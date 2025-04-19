// 환경 변수 로드 (파일 최상단)
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Socket.IO 서버 설정
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// CORS 미들웨어 설정 (API 요청용)
app.use(cors({
  origin: "*",
  credentials: true
}));

// JSON 요청 본문 파싱 미들웨어
app.use(express.json());

// 환경 변수 확인
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'super-secret-dev-key';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !JWT_SECRET) {
  console.error("오류: ADMIN_USERNAME, ADMIN_PASSWORD_HASH, 또는 JWT_SECRET_KEY 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

// --- 데이터베이스 설정 ---
const DB_DIR = '../BackEndServer';
const DB_PATH = `${DB_DIR}/license_db.sqlite`;
let db;

function initDb() {
  console.log('SQLite 데이터베이스 초기화 시도...');
  if (!fs.existsSync(DB_DIR)){
      console.log(`디렉토리 생성: ${DB_DIR}`);
      fs.mkdirSync(DB_DIR, { recursive: true });
  }
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) return console.error("SQLite 생성/연결 오류:", err.message);
    console.log('SQLite 데이터베이스 연결됨 (초기화 중).');
    db.run(`CREATE TABLE IF NOT EXISTS registrations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              computer_id TEXT UNIQUE NOT NULL,
              request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              status TEXT NOT NULL DEFAULT 'Pending',
              approval_timestamp DATETIME,
              notes TEXT
            )`, (err) => {
      if (err) {
        console.error("테이블 생성 오류:", err.message);
        db.close((closeErr) => {
          if (closeErr) console.error("DB 닫기 오류 (테이블 생성 실패 시):", closeErr.message);
        });
      } else {
        console.log("registrations 테이블 확인/생성 완료.");
      }
    });
  });
}

function connectDb() {
  if (!fs.existsSync(DB_PATH)) {
    initDb();
  } else {
    db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error("SQLite 연결 오류:", err.message);
      } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
      }
    });
  }
}

connectDb();

// --- JWT 인증 미들웨어 ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
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
    console.log(`Socket authenticated for user: ${decoded.sub}`);
    next();
  });
});


// --- API 라우트 ---
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
      const newId = this.lastID; // 삽입된 ID 가져오기
      console.log(`New registration request: ${computer_id}, ID: ${newId}`);
      // 웹소켓 이벤트 발생 로그 추가
      console.log(`Emitting update_user_list event for new user ID: ${newId}`);
      io.emit('update_user_list', { message: `User list updated due to registration ID: ${newId}` });
      console.log(`Event emitted for new user ID: ${newId}`);
      res.status(201).json({ message: "Registration request received, pending approval" });
    });
  });
});

// ... (다른 라우트 - validate, admin/login, admin/users, admin/requests) ...
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

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password) {
    bcrypt.compare(password, ADMIN_PASSWORD_HASH, (err, result) => {
      if (result) {
        const accessToken = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken: accessToken });
      } else {
        console.error("Bcrypt compare error or password mismatch:", err);
        res.status(401).json({ msg: "Bad username or password" });
      }
    });
  } else {
    res.status(401).json({ msg: "Bad username or password" });
  }
});

app.get('/admin/users', authenticateToken, (req, res) => {
  db.all("SELECT id, computer_id, request_timestamp, status, approval_timestamp, notes FROM registrations ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("DB 조회 오류 (admin/users):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

app.get('/admin/requests', authenticateToken, (req, res) => {
   db.all("SELECT id, computer_id, request_timestamp FROM registrations WHERE status = 'Pending' ORDER BY request_timestamp DESC", [], (err, rows) => {
    if (err) {
      console.error("DB 조회 오류 (admin/requests):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});


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
    // 웹소켓 이벤트 발생 로그 추가
    console.log(`Emitting update_user_list event for deleted user ID: ${userId}`);
    io.emit('update_user_list', { message: `User list updated due to deletion ID: ${userId}` });
    console.log(`Event emitted for deleted user ID: ${userId}`);
    res.json({ message: `User ${userId} deleted successfully` });
  });
});

app.post('/admin/action/:id', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const { action } = req.body;
  if (!action || !['Approve', 'Reject'].includes(action)) {
    return res.status(400).json({ error: "Invalid action specified (Approve or Reject)" });
  }
  const dbStatus = action === 'Approve' ? 'Approved' : 'Rejected';
  const approvalTimestamp = new Date().toISOString();
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
    // 웹소켓 이벤트 발생 로그 추가
    console.log(`Emitting update_user_list event for action on ID: ${requestId}`);
    io.emit('update_user_list', { message: `User list updated due to action on ID: ${requestId}` });
    console.log(`Event emitted for action on ID: ${requestId}`);
    res.json({ message: `Request ${requestId} has been ${dbStatus.toLowerCase()}` });
  });
});


// --- Socket.IO 이벤트 핸들러 ---
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});


// --- 서버 시작 ---
server.listen(PORT, () => {
  console.log(`Node.js 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`);
});

// --- 종료 처리 개선 ---
function gracefulShutdown() {
  console.log('서버 종료 신호 수신, 정리 시작...');
  io.close(() => {
    console.log('Socket.IO 서버 닫힘.');
    server.close(() => {
      console.log('HTTP 서버 닫힘.');
      if (db) {
        db.close((err) => {
          if (err) {
            console.error("DB 닫기 오류:", err.message);
            process.exit(1);
          } else {
            console.log('SQLite 연결이 닫혔습니다.');
            process.exit(0);
          }
        });
      } else {
        process.exit(0);
      }
    });
  });
  setTimeout(() => {
    console.error('정리 시간 초과, 강제 종료.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
