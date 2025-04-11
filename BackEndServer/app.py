import sqlite3
import json
from flask import Flask, request, jsonify
from flask_cors import CORS # CORS 추가
from functools import wraps # 관리자 인증 데코레이터용 (예시)
import os
import sys # 환경 변수 확인용
from dotenv import load_dotenv # .env 파일 로드용

# .env 파일 로드 (파일이 있으면 해당 파일의 변수를 환경 변수로 로드)
# 시스템 환경 변수가 .env 파일보다 우선 순위가 높을 수 있음 (라이브러리 동작 방식 확인 필요)
load_dotenv()

DATABASE = 'license_db.sqlite'
# 환경 변수에서 관리자 정보 읽기
# ★★★ 운영 환경에서는 반드시 환경 변수를 설정해야 합니다! ★★★
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

# 환경 변수가 설정되지 않았는지 확인 (이제 .env 또는 시스템 환경 변수에 반드시 있어야 함)
if not ADMIN_USERNAME or not ADMIN_PASSWORD:
    print("오류: ADMIN_USERNAME 또는 ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.", file=sys.stderr)
    print("BackEndServer/.env 파일을 생성하고 값을 설정하거나 시스템 환경 변수를 설정해주세요.", file=sys.stderr)
    sys.exit(1)


app = Flask(__name__)
# CORS 설정 추가: 모든 경로에 대해 모든 Origin 허용 (개발/테스트용)
# ★★★ 운영 시에는 origins=["https://DreamHousekSH.github.io"] 와 같이 특정 출처만 허용하는 것이 안전합니다. ★★★
CORS(app)

def get_db():
    """데이터베이스 연결을 가져옵니다."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # 컬럼 이름으로 접근 가능하게
    return conn

def init_db():
    """데이터베이스 테이블을 초기화합니다."""
    if not os.path.exists(DATABASE):
        print(f"Creating database: {DATABASE}")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                computer_id TEXT UNIQUE NOT NULL,
                request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
                approval_timestamp DATETIME,
                notes TEXT
            )
        ''')
        conn.commit()
        conn.close()
        print("Database initialized.")
    else:
        print("Database already exists.")

# 관리자 인증 데코레이터 (매우 기본적인 예시 - 실제로는 토큰 기반 등 사용)
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth = request.authorization
        if not auth or not (auth.username == ADMIN_USERNAME and auth.password == ADMIN_PASSWORD):
            return jsonify({"message": "Authentication Required"}), 401, {'WWW-Authenticate': 'Basic realm="Login Required"'}
        return f(*args, **kwargs)
    return decorated_function

@app.route('/register', methods=['POST'])
def register_computer():
    """클라이언트의 등록 요청을 처리합니다."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        data = request.get_json()
        if not data or 'computer_id' not in data:
            return jsonify({"error": "Missing computer_id"}), 400

        computer_id = data['computer_id']

        # 이미 존재하는지 확인
        cursor.execute("SELECT id FROM registrations WHERE computer_id = ?", (computer_id,))
        existing = cursor.fetchone()

        if existing:
            return jsonify({"message": "Computer already registered or pending"}), 200 # 이미 있으면 성공처럼 응답 (정책따라 다름)

        # 새로 등록
        cursor.execute("INSERT INTO registrations (computer_id) VALUES (?)", (computer_id,))
        conn.commit()
        return jsonify({"message": "Registration request received, pending approval"}), 201

    except sqlite3.Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred"}), 500
    finally:
        conn.close()

@app.route('/validate', methods=['POST'])
def validate_computer():
    """클라이언트의 사용 가능 여부를 확인합니다."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        data = request.get_json()
        if not data or 'computer_id' not in data:
            return jsonify({"error": "Missing computer_id"}), 400

        computer_id = data['computer_id']

        cursor.execute("SELECT status FROM registrations WHERE computer_id = ?", (computer_id,))
        result = cursor.fetchone()

        if result:
            status = result['status']
            return jsonify({"status": status}), 200
        else:
            return jsonify({"status": "Not Found"}), 404 # 등록되지 않음

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred"}), 500
    finally:
        conn.close()

# --- 관리자 API ---

@app.route('/admin/requests', methods=['GET'])
@admin_required
def get_pending_requests():
    """관리자가 승인 대기 중인 요청 목록을 봅니다."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, computer_id, request_timestamp FROM registrations WHERE status = 'Pending' ORDER BY request_timestamp DESC")
        requests = [dict(row) for row in cursor.fetchall()]
        return jsonify(requests), 200
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        conn.close()

@app.route('/admin/action/<int:request_id>', methods=['POST']) # 예: /admin/action/123
@admin_required
def process_request(request_id):
    """관리자가 요청을 승인 또는 거절합니다."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        data = request.get_json()
        if not data or 'action' not in data or data['action'] not in ['Approve', 'Reject']:
             return jsonify({"error": "Invalid action specified (Approve or Reject)"}), 400

        new_status = data['action'] # 'Approve' -> 'Approved', 'Reject' -> 'Rejected'
        db_status = 'Approved' if new_status == 'Approve' else 'Rejected'

        # 상태 업데이트
        cursor.execute("""
            UPDATE registrations
            SET status = ?, approval_timestamp = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'Pending'
        """, (db_status, request_id))

        conn.commit()

        if cursor.rowcount == 0: # 업데이트된 행이 없으면 (ID가 없거나 이미 처리됨)
            return jsonify({"message": "Request not found or already processed"}), 404

        return jsonify({"message": f"Request {request_id} has been {db_status.lower()}"}), 200

    except sqlite3.Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred"}), 500
    finally:
        conn.close()


if __name__ == '__main__':
    init_db() # 서버 시작 시 DB 자동 생성/확인
    # ★★★ 개발용 서버. 실제 배포 시에는 Waitress, Gunicorn 등 WSGI 서버 사용 ★★★
    # ★★★ HTTPS 적용 필수! (예: Nginx 리버스 프록시 + Let's Encrypt) ★★★
    print("Starting Flask server (Development)...")
    app.run(host='0.0.0.0', port=5000, debug=True) # debug=True는 개발 중에만 사용
