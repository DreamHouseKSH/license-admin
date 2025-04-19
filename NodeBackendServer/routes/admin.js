const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'super-secret-dev-key';

// 관리자 로그인
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password && ADMIN_PASSWORD_HASH) {
    bcrypt.compare(password, ADMIN_PASSWORD_HASH, (err, result) => {
      if (result) {
        const accessToken = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken: accessToken });
      } else {
        console.error("Bcrypt 비교 오류 또는 비밀번호 불일치:", err); // 한국어
        res.status(401).json({ msg: "잘못된 사용자 이름 또는 비밀번호입니다." }); // 한국어
      }
    });
  } else {
    res.status(401).json({ msg: "잘못된 사용자 이름 또는 비밀번호입니다." }); // 한국어
  }
});

// --- 이하 라우트는 JWT 인증 필요 ---

// 전체 사용자 목록 조회
router.get('/users', authenticateToken, (req, res) => {
  const db = req.db;
  if (!db) return res.status(500).json({ error: "데이터베이스에 연결되지 않았습니다." }); // 한국어

  db.all("SELECT id, computer_id, request_timestamp, status, approval_timestamp, notes FROM registrations ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("DB 조회 오류 (admin/users):", err.message);
      return res.status(500).json({ error: "데이터베이스 오류" }); // 한국어
    }
    res.json(rows);
  });
});

// 보류 중인 요청 조회
router.get('/requests', authenticateToken, (req, res) => {
   const db = req.db;
   if (!db) return res.status(500).json({ error: "데이터베이스에 연결되지 않았습니다." }); // 한국어

   db.all("SELECT id, computer_id, request_timestamp FROM registrations WHERE status = 'Pending' ORDER BY request_timestamp DESC", [], (err, rows) => {
    if (err) {
      console.error("DB 조회 오류 (admin/requests):", err.message);
      return res.status(500).json({ error: "데이터베이스 오류" }); // 한국어
    }
    res.json(rows);
  });
});

// 사용자 삭제
router.delete('/user/:id', authenticateToken, (req, res) => {
  const db = req.db;
  const io = req.io;
  if (!db) return res.status(500).json({ error: "데이터베이스에 연결되지 않았습니다." }); // 한국어

  const userId = req.params.id;
  db.run("DELETE FROM registrations WHERE id = ?", [userId], function(err) {
    if (err) {
      console.error("DB 삭제 오류 (admin/user):", err.message);
      return res.status(500).json({ error: "데이터베이스 오류" }); // 한국어
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." }); // 한국어
    }
    console.log(`사용자 삭제됨: ID ${userId}`); // 한국어
    console.log(`update_user_list 이벤트 발행 (삭제된 사용자 ID: ${userId})`); // 한국어
    io.emit('update_user_list', { message: `사용자 목록 업데이트됨 (삭제 ID: ${userId})` }); // 한국어
    console.log(`이벤트 발행 완료 (삭제된 사용자 ID: ${userId})`); // 한국어
    res.json({ message: `사용자 ID ${userId} 삭제 성공` }); // 한국어
  });
});

// 요청 처리 (승인/거절)
router.post('/action/:id', authenticateToken, (req, res) => {
  const db = req.db;
  const io = req.io;
  if (!db) return res.status(500).json({ error: "데이터베이스에 연결되지 않았습니다." }); // 한국어

  const requestId = req.params.id;
  const { action } = req.body;
  if (!action || !['Approve', 'Reject'].includes(action)) {
    return res.status(400).json({ error: "잘못된 작업 요청입니다 (승인 또는 거절)." }); // 한국어
  }
  const dbStatus = action === 'Approve' ? 'Approved' : 'Rejected';
  const approvalTimestamp = new Date().toISOString();
  db.run(`UPDATE registrations
          SET status = ?, approval_timestamp = ?
          WHERE id = ? AND status = 'Pending'`,
         [dbStatus, approvalTimestamp, requestId], function(err) {
    if (err) {
      console.error("DB 업데이트 오류 (admin/action):", err.message);
      return res.status(500).json({ error: "데이터베이스 오류" }); // 한국어
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "요청을 찾을 수 없거나 이미 처리되었습니다." }); // 한국어
    }
    console.log(`요청 처리됨 ${requestId}: ${dbStatus}`); // 한국어
    console.log(`update_user_list 이벤트 발행 (작업 ID: ${requestId})`); // 한국어
    io.emit('update_user_list', { message: `사용자 목록 업데이트됨 (작업 ID: ${requestId})` }); // 한국어
    console.log(`이벤트 발행 완료 (작업 ID: ${requestId})`); // 한국어
    // 성공 메시지 한국어 변환
    const actionKorean = dbStatus === 'Approved' ? '승인' : '거절';
    res.json({ message: `요청 ID ${requestId}이(가) ${actionKorean}되었습니다.` });
  });
});

module.exports = router;
