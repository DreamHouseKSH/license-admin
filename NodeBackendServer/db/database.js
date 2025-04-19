const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path'); // path 모듈 추가

// DB 파일 경로 설정 (프로젝트 루트 기준)
const DB_DIR = path.resolve(__dirname, '../../BackEndServer'); // 현재 파일 기준 상대 경로
const DB_PATH = path.join(DB_DIR, 'license_db.sqlite');
let db = null; // DB 인스턴스

// DB 초기화 함수
function initDb() {
  console.log('SQLite 데이터베이스 초기화 시도...');
  // 디렉토리 존재 확인 및 생성
  if (!fs.existsSync(DB_DIR)){
      console.log(`디렉토리 생성: ${DB_DIR}`);
      fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const newDb = new sqlite3.Database(DB_PATH, (err) => { // 파일 없으면 생성
    if (err) return console.error("SQLite 생성/연결 오류:", err.message);

    console.log('SQLite 데이터베이스 연결됨 (초기화 중).');
    newDb.run(`CREATE TABLE IF NOT EXISTS registrations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              computer_id TEXT UNIQUE NOT NULL,
              request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              status TEXT NOT NULL DEFAULT 'Pending',
              approval_timestamp DATETIME,
              notes TEXT
            )`, (err) => {
      if (err) {
        console.error("테이블 생성 오류:", err.message);
        newDb.close((closeErr) => {
          if (closeErr) console.error("DB 닫기 오류 (테이블 생성 실패 시):", closeErr.message);
        });
      } else {
        console.log("registrations 테이블 확인/생성 완료.");
        db = newDb; // 초기화 성공 시 전역 변수에 할당
      }
    });
  });
}

// DB 연결 함수
function connectDb() {
  if (!fs.existsSync(DB_PATH)) {
    initDb(); // 파일 없으면 초기화
  } else {
    db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error("SQLite 연결 오류:", err.message);
        db = null; // 연결 실패 시 null 처리
      } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
      }
    });
  }
}

// DB 인스턴스 가져오기 함수
function getDb() {
  if (!db) {
    console.warn("DB가 연결되지 않았습니다. 재연결 시도...");
    connectDb(); // 연결 안됐으면 다시 시도
  }
  return db;
}

// DB 연결 닫기 함수 (애플리케이션 종료 시 호출)
function closeDb() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error("DB 닫기 오류:", err.message);
      } else {
        console.log('SQLite 연결이 닫혔습니다.');
        db = null;
      }
    });
  }
}

// 모듈 로드 시 DB 연결 시도
connectDb();

module.exports = {
  getDb,
  closeDb
};
