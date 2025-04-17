// 환경 변수 로드 (파일 최상단)
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose(); // verbose 모드로 상세 로그 확인

const app = express();
const server = http.createServer(app);

// Socket.IO 서버 설정
const io = new Server(server, {
  cors: {
    origin: "*", // 실제 운영 시에는 프론트엔드 주소로 제한: process.env.FRONTEND_URL || "https://DreamHouseKSH.github.io"
    methods: ["GET", "POST"]
  }
});

// CORS 미들웨어 설정 (API 요청용)
app.use(cors({
  origin: "*", // 실제 운영 시에는 프론트엔드 주소로 제한
  credentials: true // 필요시 쿠키/인증 헤더 허용
}));

// JSON 요청 본문 파싱 미들웨어
app.use(express.json());

// 환경 변수 확인
const PORT = process.env.PORT || 8000; // Gunicorn과 동일한 포트 사용
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'super-secret-dev-key';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !JWT_SECRET) {
  console.error("오류: ADMIN_USERNAME, ADMIN_PASSWORD_HASH, 또는 JWT_SECRET_KEY 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

// --- 데이터베이스 설정 ---
const DB_PATH = '../BackEndServer/license_db.sqlite'; // 기존 SQLite 파일 경로
let db;

function connectDb() {
  db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error("SQLite 연결 오류:", err.message);
      // DB 파일이 없으면 초기화 시도 (선택 사항)
      // initDb(); // 아래 initDb 함수 정의 필요
    } else {
      console.log('SQLite 데이터베이스에 연결되었습니다.');
    }
  });
}

// DB 초기화 함수 (필요시 사용)
/*
function initDb() {
  db = new sqlite3.Database(DB_PATH, (err) => { // 파일 없으면 생성
    if (err) return console.error("SQLite 생성 오류:", err.message);
    console.log('새 SQLite 데이터베이스 생성 중...');
    db.run(`CREATE TABLE registrations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              computer_id TEXT UNIQUE NOT NULL,
              request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              status TEXT NOT NULL DEFAULT 'Pending',
              approval_timestamp DATETIME,
              notes TEXT
            )`, (err) => {
      if (err) return console.error("테이블 생성 오류:", err.message);
      console.log("registrations 테이블 생성 완료.");
      connectDb(); // 테이블 생성 후 다시 연결
    });
  });
}
*/

connectDb(); // 서버 시작 시 DB 연결

// --- JWT 인증 미들웨어 (Socket.IO 및 API용) ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // 토큰 없음

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // 토큰 유효하지 않음
    req.user = user; // 요청 객체에 사용자 정보 저장 (여기서는 username)
    next();
  });
};

// Socket.IO 연결 시 인증 미들웨어
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: Token not provided"));
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
    // socket.decoded = decoded; // 필요시 디코딩된 정보 저장
    console.log(`Socket authenticated for user: ${decoded.sub}`);
    next();
  });
});


// --- API 라우트 ---

// 등록 요청
app.post('/register', (req, res) => {
  const { computer_id } = req.body;
  if (!computer_id) {
    return res.status(400).json({ error: "Missing computer_id" });
  }

  db.get("SELECT id FROM registrations WHERE computer_id = ?", [computer_id], (err, row) => {
    if (err) {
      console.error("DB 조회 오류 (register):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    if (row) {
      return res.status(200).json({ message: "Computer already registered or pending" });
    }

    db.run("INSERT INTO registrations (computer_id) VALUES (?)", [computer_id], function(err) {
      if (err) {
        console.error("DB 삽입 오류 (register):", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      console.log(`New registration request: ${computer_id}, ID: ${this.lastID}`);
      // 웹소켓 이벤트 발생
      io.emit('update_user_list', { message: 'User list may have changed' });
      res.status(201).json({ message: "Registration request received, pending approval" });
    });
  });
});

// 상태 확인
app.post('/validate', (req, res) => {
  const { computer_id } = req.body;
  if (!computer_id) {
    return res.status(400).json({ error: "Missing computer_id" });
  }

  db.get("SELECT status FROM registrations WHERE computer_id = ?", [computer_id], (err, row) => {
    if (err) {
      console.error("DB 조회 오류 (validate):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    if (row) {
      res.status(200).json({ status: row.status });
    } else {
      res.status(404).json({ status: "Not Found" });
    }
  });
});

// 관리자 로그인
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password) {
    bcrypt.compare(password, ADMIN_PASSWORD_HASH, (err, result) => {
      if (result) {
        // 비밀번호 일치 -> JWT 생성
        const accessToken = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken: accessToken });
      } else {
        // 비밀번호 불일치 또는 bcrypt 오류
        console.error("Bcrypt compare error or password mismatch:", err);
        res.status(401).json({ msg: "Bad username or password" });
      }
    });
  } else {
    res.status(401).json({ msg: "Bad username or password" });
  }
});

// --- 관리자 API (JWT 인증 필요) ---

// 전체 사용자 목록 조회
app.get('/admin/users', authenticateToken, (req, res) => {
  db.all("SELECT id, computer_id, request_timestamp, status, approval_timestamp, notes FROM registrations ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("DB 조회 오류 (admin/users):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// 보류 중인 요청 조회 (필요시 사용)
app.get('/admin/requests', authenticateToken, (req, res) => {
   db.all("SELECT id, computer_id, request_timestamp FROM registrations WHERE status = 'Pending' ORDER BY request_timestamp DESC", [], (err, rows) => {
    if (err) {
      console.error("DB 조회 오류 (admin/requests):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// 사용자 삭제
app.delete('/admin/user/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  db.run("DELETE FROM registrations WHERE id = ?", [userId], function(err) {
    if (err) {
      console.error("DB 삭제 오류 (admin/user):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(`User deleted: ID ${userId}`);
    io.emit('update_user_list', { message: 'User list may have changed' });
    res.json({ message: `User ${userId} deleted successfully` });
  });
});

// 요청 처리 (승인/거절)
app.post('/admin/action/:id', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const { action } = req.body;

  if (!action || !['Approve', 'Reject'].includes(action)) {
    return res.status(400).json({ error: "Invalid action specified (Approve or Reject)" });
  }

  const dbStatus = action === 'Approve' ? 'Approved' : 'Rejected';
  const approvalTimestamp = new Date().toISOString(); // ISO 8601 형식

  db.run(`UPDATE registrations
          SET status = ?, approval_timestamp = ?
          WHERE id = ? AND status = 'Pending'`,
         [dbStatus, approvalTimestamp, requestId], function(err) {
    if (err) {
      console.error("DB 업데이트 오류 (admin/action):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Request not found or already processed" });
    }
    console.log(`Request ${requestId} processed: ${dbStatus}`);
    io.emit('update_user_list', { message: 'User list may have changed' });
    res.json({ message: `Request ${requestId} has been ${dbStatus.toLowerCase()}` });
  });
});


// --- Socket.IO 이벤트 핸들러 ---
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // 연결 해제 시
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });

  // 다른 필요한 이벤트 핸들러 추가 가능
});


// --- 서버 시작 ---
server.listen(PORT, () => {
  console.log(`Node.js 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

// --- 종료 처리 ---
process.on('SIGINT', () => {
  console.log('서버 종료 중...');
  db.close((err) => {
    if (err) console.error("DB 닫기 오류:", err.message);
    else console.log('SQLite 연결이 닫혔습니다.');
    server.close(() => {
      console.log('서버가 종료되었습니다.');
      process.exit(0);
    });
  });
});
