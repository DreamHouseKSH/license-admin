// 환경 변수 로드 (파일 최상단, 현재 디렉토리의 .env 파일 로드)
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { getDb, closeDb } = require('./db/database.cjs'); // 확장자 .cjs로 변경
const { authenticateSocketToken } = require('./middleware/auth.cjs'); // 확장자 .cjs로 변경
const publicRoutes = require('./routes/public.cjs'); // 확장자 .cjs로 변경
const adminRoutes = require('./routes/admin.cjs'); // 확장자 .cjs로 변경

const app = express();
const server = http.createServer(app);

// Socket.IO 서버 설정
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", // 환경 변수 사용 또는 모든 출처 허용
    methods: ["GET", "POST"]
  }
});

// CORS 미들웨어 설정 (API 요청용)
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

// JSON 요청 본문 파싱 미들웨어
app.use(express.json());

// 환경 변수 확인 (필수 변수만)
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !JWT_SECRET) {
  console.error("오류: 필수 환경 변수(ADMIN_USERNAME, ADMIN_PASSWORD_HASH, JWT_SECRET_KEY)가 설정되지 않았습니다.");
  process.exit(1);
}

// Socket.IO 객체를 라우터에서 사용할 수 있도록 req 객체에 추가하는 미들웨어
app.use((req, res, next) => {
  req.io = io;
  next();
});

// DB 객체를 라우터에서 사용할 수 있도록 req 객체에 추가하는 미들웨어
app.use((req, res, next) => {
  req.db = getDb();
  if (!req.db) {
     return res.status(500).json({ error: "데이터베이스 연결 실패" }); // 한국어
  }
  next();
});


// --- 라우트 연결 ---
app.use('/', publicRoutes); // 공개 라우트 연결
app.use('/admin', adminRoutes); // 관리자 라우트 연결 (prefix: /admin)


// --- Socket.IO 설정 ---
io.use(authenticateSocketToken); // Socket.IO 연결 시 JWT 인증 적용

io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id); // 한국어
  socket.on('disconnect', () => {
    console.log('사용자 연결 끊김:', socket.id); // 한국어
  });
});


// --- 서버 시작 ---
server.listen(PORT, () => {
  console.log(`Node.js 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`); // 한국어
});

// --- 종료 처리 ---
function gracefulShutdown() {
  console.log('서버 종료 신호 수신, 정리 시작...'); // 한국어
  io.close(() => {
    console.log('Socket.IO 서버 닫힘.'); // 한국어
    server.close(() => {
      console.log('HTTP 서버 닫힘.'); // 한국어
      closeDb();
    });
  });
  setTimeout(() => {
    console.error('정리 시간 초과, 강제 종료.'); // 한국어
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
