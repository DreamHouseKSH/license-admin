const express = require('express');
const router = express.Router();

// 등록 요청
router.post('/register', (req, res) => {
  const db = req.db;
  const io = req.io;
  if (!db) return res.status(500).json({ error: "데이터베이스에 연결되지 않았습니다." }); // 한국어

  const { computer_id } = req.body;
  if (!computer_id) {
    return res.status(400).json({ error: "computer_id가 누락되었습니다." }); // 한국어
  }
  db.get("SELECT id FROM registrations WHERE computer_id = ?", [computer_id], (err, row) => {
    if (err) {
      console.error("DB 조회 오류 (register):", err.message);
      return res.status(500).json({ error: "데이터베이스 오류" }); // 한국어
    }
    if (row) {
      return res.status(200).json({ message: "이미 등록되었거나 승인 대기 중인 컴퓨터 ID입니다." }); // 한국어
    }
    db.run("INSERT INTO registrations (computer_id) VALUES (?)", [computer_id], function(err) {
      if (err) {
        console.error("DB 삽입 오류 (register):", err.message);
        return res.status(500).json({ error: "데이터베이스 오류" }); // 한국어
      }
      const newId = this.lastID;
      console.log(`새 등록 요청: ${computer_id}, ID: ${newId}`); // 한국어
      console.log(`update_user_list 이벤트 발행 (새 사용자 ID: ${newId})`); // 한국어
      io.emit('update_user_list', { message: `사용자 목록 업데이트됨 (등록 ID: ${newId})` }); // 한국어
      console.log(`이벤트 발행 완료 (새 사용자 ID: ${newId})`); // 한국어
      res.status(201).json({ message: "등록 요청 접수됨, 승인 대기 중입니다." }); // 한국어
    });
  });
});

// 상태 확인
router.post('/validate', (req, res) => {
  const db = req.db;
  if (!db) return res.status(500).json({ error: "데이터베이스에 연결되지 않았습니다." }); // 한국어

  const { computer_id } = req.body;
  if (!computer_id) {
    return res.status(400).json({ error: "computer_id가 누락되었습니다." }); // 한국어
  }
  db.get("SELECT status FROM registrations WHERE computer_id = ?", [computer_id], (err, row) => {
    if (err) {
      console.error("DB 조회 오류 (validate):", err.message);
      return res.status(500).json({ error: "데이터베이스 오류" }); // 한국어
    }
    if (row) {
      res.status(200).json({ status: row.status }); // 상태는 영어 유지 (프론트에서 변환)
    } else {
      res.status(404).json({ status: "Not Found" }); // 상태는 영어 유지 (프론트에서 변환)
    }
  });
});

module.exports = router;
