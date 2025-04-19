const express = require('express');
// const sqlite3 = require('sqlite3').verbose(); // DB 객체는 req에서 받음
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// const { io } = require('../server'); // io 객체는 req에서 받음
const { authenticateToken } = require('../middleware/auth'); // API 인증 미들웨어만 가져오기

const router = express.Router();

// --- 환경 변수 (server.js에서 로드된 것을 사용) ---
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'super-secret-dev-key';

// --- 데이터베이스 및 io 객체는 req에서 전달받아 사용 ---

// 관리자 로그인
router.post('/login', (req, res) => {
  // DB 객체는 이 라우트에서는 직접 필요하지 않음 (인증만 수행)
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password && ADMIN_PASSWORD_HASH) {
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

// --- 이하 라우트는 JWT 인증 필요 ---

// 전체 사용자 목록 조회
router.get('/users', authenticateToken, (req, res) => {
  const db = req.db; // req 객체에서 DB 인스턴스 가져오기
  if (!db) return res.status(500).json({ error: "Database not connected" });

  db.all("SELECT id, computer_id, request_timestamp, status, approval_timestamp, notes FROM registrations ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("DB 조회 오류 (admin/users):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// 보류 중인 요청 조회
router.get('/requests', authenticateToken, (req, res) => {
   const db = req.db;
   if (!db) return res.status(500).json({ error: "Database not connected" });

   db.all("SELECT id, computer_id, request_timestamp FROM registrations WHERE status = 'Pending' ORDER BY request_timestamp DESC", [], (err, rows) => {
    if (err) {
      console.error("DB 조회 오류 (admin/requests):", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// 사용자 삭제
router.delete('/user/:id', authenticateToken, (req, res) => {
  const db = req.db;
  const io = req.io; // req 객체에서 io 인스턴스 가져오기
  if (!db) return res.status(500).json({ error: "Database not connected" });

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
    // io 객체 사용
    console.log(`Emitting update_user_list event for deleted user ID: ${userId}`);
    io.emit('update_user_list', { message: `User list updated due to deletion ID: ${userId}` });
    console.log(`Event emitted for deleted user ID: ${userId}`);
    res.json({ message: `User ${userId} deleted successfully` });
  });
});

// 요청 처리 (승인/거절)
router.post('/action/:id', authenticateToken, (req, res) => {
  const db = req.db;
  const io = req.io;
  if (!db) return res.status(500).json({ error: "Database not connected" });

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
    // io 객체 사용
    console.log(`Emitting update_user_list event for action on ID: ${requestId}`);
    io.emit('update_user_list', { message: `User list updated due to action on ID: ${requestId}` });
    console.log(`Event emitted for action on ID: ${requestId}`);
    res.json({ message: `Request ${requestId} has been ${dbStatus.toLowerCase()}` });
  });
});

module.exports = router;
