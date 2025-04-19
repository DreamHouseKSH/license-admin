const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_DIR = path.resolve(__dirname, '../../BackEndServer');
const DB_PATH = path.join(DB_DIR, 'license_db.sqlite');
let db = null;

function initDb() {
  console.log('SQLite 데이터베이스 초기화 시도...'); // 한국어
  if (!fs.existsSync(DB_DIR)){
      console.log(`디렉토리 생성: ${DB_DIR}`); // 한국어
      fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const newDb = new sqlite3.Database(DB_PATH, (err) => {
    if (err) return console.error("SQLite 생성/연결 오류:", err.message); // 한국어

    console.log('SQLite 데이터베이스 연결됨 (초기화 중).'); // 한국어
    newDb.run(`CREATE TABLE IF NOT EXISTS registrations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              computer_id TEXT UNIQUE NOT NULL,
              request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              status TEXT NOT NULL DEFAULT 'Pending',
              approval_timestamp DATETIME,
              notes TEXT
            )`, (err) => {
      if (err) {
        console.error("테이블 생성 오류:", err.message); // 한국어
        newDb.close((closeErr) => {
          if (closeErr) console.error("DB 닫기 오류 (테이블 생성 실패 시):", closeErr.message); // 한국어
        });
      } else {
        console.log("registrations 테이블 확인/생성 완료."); // 한국어
        db = newDb;
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
        console.error("SQLite 연결 오류:", err.message); // 한국어
        db = null;
      } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.'); // 한국어
      }
    });
  }
}

function getDb() {
  if (!db) {
    console.warn("DB가 연결되지 않았습니다. 재연결 시도..."); // 한국어
    connectDb();
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error("DB 닫기 오류:", err.message); // 한국어
      } else {
        console.log('SQLite 연결이 닫혔습니다.'); // 한국어
        db = null;
      }
    });
  }
}

connectDb();

module.exports = {
  getDb,
  closeDb
};
