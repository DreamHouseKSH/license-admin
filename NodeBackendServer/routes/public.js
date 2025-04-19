const express = require('express');
// const sqlite3 = require('sqlite3').verbose(); // DB 객체는 req에서 받음
// const { io } = require('../server'); // io 객체는 req에서 받음

const router = express.Router();

// --- 데이터베이스 및 io 객체는 req에서 전달받아 사용 ---

// 등록 요청
router.post('/register', (req, res) => {
  const db = req.db; // req 객체에서 DB 인스턴스 가져오기
  const io = req.io; // req 객체에서 io 인스턴스 가져오기
  if (!db) return res.status(500).json({ error: "Database not connected" });

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
      return res.status(200).json({ message: "이미 등록되었거나 승인 대기 중인 컴퓨터 ID입니다." });
    }
    db.run("INSERT INTO registrations (computer_id) VALUES (?)", [computer_id], function(err) {
      if (err) {
        console.error("DB 삽입 오류 (register):", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      const newId = this.lastID;
      console.log(`New registration request: ${computer_id}, ID: ${newId}`);
      // io 객체 사용
      console.log(`Emitting update_user_list event for new user ID: ${newId}`);
      io.emit('update_user_list', { message: `User list updated due to registration ID: ${newId}` });
      console.log(`Event emitted for new user ID: ${newId}`);
      res.status(201).json({ message: "등록 요청 접수됨, 승인 대기 중입니다." });
    });
  });
});

// 상태 확인
router.post('/validate', (req, res) => {
  const db = req.db;
  if (!db) return res.status(500).json({ error: "Database not connected" });

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

module.exports = router;
