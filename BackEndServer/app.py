# eventlet 몽키 패치를 다른 임포트보다 먼저 수행!
import eventlet
eventlet.monkey_patch()

import sqlite3
import json
from flask import Flask, request, jsonify
from flask_cors import CORS # CORS 임포트 확인
from flask_jwt_extended import create_access_token, jwt_required, JWTManager
from flask_socketio import SocketIO, emit
from datetime import timedelta
import os
import sys
from dotenv import load_dotenv
import bcrypt

# .env 파일 로드
load_dotenv()

DATABASE = 'license_db.sqlite'
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_PASSWORD_HASH = os.environ.get('ADMIN_PASSWORD_HASH')

# SocketIO 객체 생성
# cors_allowed_origins는 SocketIO 연결에만 적용될 수 있음
socketio = SocketIO(async_mode='eventlet') # CORS 설정은 Flask-Cors에서 처리하도록 제거

# --- 데이터베이스 관련 함수 ---
# ... (이전과 동일) ...
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DATABASE):
        print(f"Creating database: {DATABASE}")
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE registrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    computer_id TEXT UNIQUE NOT NULL,
                    request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT NOT NULL DEFAULT 'Pending',
                    approval_timestamp DATETIME,
                    notes TEXT
                )
            ''')
            conn.commit()
            conn.close()
            print("Database initialized.")
        except Exception as e:
            print(f"Error initializing DB outside app context: {e}")
    else:
        print("Database already exists.")

# --- Flask 앱 팩토리 ---
def create_app():
    app = Flask(__name__)

    if not ADMIN_USERNAME or not ADMIN_PASSWORD_HASH:
        print("오류: ADMIN_USERNAME 또는 ADMIN_PASSWORD_HASH 환경 변수가 설정되지 않았습니다.", file=sys.stderr)
        print("BackEndServer/.env 파일을 생성하고 값을 설정하거나 시스템 환경 변수를 설정해주세요.", file=sys.stderr)
        sys.exit(1)

    # --- CORS 설정 (Flask-Cors 사용) ---
    # 모든 출처(*)에서 모든 경로(/api/* 등)에 대해 필요한 헤더(Authorization 등)와 메서드(POST, GET, DELETE 등) 허용
    # 실제 운영 시에는 origins=["https://DreamHouseKSH.github.io"] 와 같이 특정 출처만 지정하는 것이 더 안전
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True) # 모든 경로에 CORS 적용

    # --- JWT 설정 ---
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret-dev-key")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    jwt = JWTManager(app)

    # --- SocketIO 초기화 ---
    socketio.init_app(app)

    # --- 라우트 정의 ---
    # ... (라우트 정의는 이전과 동일) ...
    @app.route('/register', methods=['POST'])
    def register_computer():
        conn = get_db()
        cursor = conn.cursor()
        try:
            data = request.get_json()
            if not data or 'computer_id' not in data:
                return jsonify({"error": "Missing computer_id"}), 400
            computer_id = data['computer_id']
            cursor.execute("SELECT id FROM registrations WHERE computer_id = ?", (computer_id,))
            existing = cursor.fetchone()
            if existing:
                return jsonify({"message": "Computer already registered or pending"}), 200
            cursor.execute("INSERT INTO registrations (computer_id) VALUES (?)", (computer_id,))
            conn.commit()
            socketio.emit('update_user_list', {'message': 'User list may have changed'})
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
                return jsonify({"status": result['status']}), 200
            else:
                return jsonify({"status": "Not Found"}), 404
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({"error": "Database error"}), 500
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({"error": "An error occurred"}), 500
        finally:
            conn.close()

    @app.route('/admin/login', methods=['POST'])
    def admin_login():
        username = request.json.get('username', None)
        password = request.json.get('password', None)
        if username == ADMIN_USERNAME and password and ADMIN_PASSWORD_HASH and \
           bcrypt.checkpw(password.encode('utf-8'), ADMIN_PASSWORD_HASH.encode('utf-8')):
            access_token = create_access_token(identity=username)
            return jsonify(access_token=access_token)
        else:
            return jsonify({"msg": "Bad username or password"}), 401

    @app.route('/admin/users', methods=['GET'])
    @jwt_required()
    def get_all_users():
        conn = get_db()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT id, computer_id, request_timestamp, status, approval_timestamp, notes FROM registrations ORDER BY id DESC")
            users = [dict(row) for row in cursor.fetchall()]
            return jsonify(users), 200
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({"error": "Database error"}), 500
        finally:
            conn.close()

    @app.route('/admin/requests', methods=['GET'])
    @jwt_required()
    def get_pending_requests():
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

    @app.route('/admin/user/<int:user_id>', methods=['DELETE'])
    @jwt_required()
    def delete_user(user_id):
        conn = get_db()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM registrations WHERE id = ?", (user_id,))
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"message": "User not found"}), 404
            socketio.emit('update_user_list', {'message': 'User list may have changed'})
            return jsonify({"message": f"User {user_id} deleted successfully"}), 200
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

    @app.route('/admin/action/<int:request_id>', methods=['POST'])
    @jwt_required()
    def process_request(request_id):
        conn = get_db()
        cursor = conn.cursor()
        try:
            data = request.get_json()
            if not data or 'action' not in data or data['action'] not in ['Approve', 'Reject']:
                 return jsonify({"error": "Invalid action specified (Approve or Reject)"}), 400
            new_status = data['action']
            db_status = 'Approved' if new_status == 'Approve' else 'Rejected'
            cursor.execute("""
                UPDATE registrations
                SET status = ?, approval_timestamp = CURRENT_TIMESTAMP
                WHERE id = ? AND status = 'Pending'
            """, (db_status, request_id))
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"message": "Request not found or already processed"}), 404
            socketio.emit('update_user_list', {'message': 'User list may have changed'})
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

    # --- SocketIO 이벤트 핸들러 ---
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')

    return app

# --- 앱 실행 ---
app = create_app()

if __name__ == '__main__':
    init_db()
    print("Starting Flask-SocketIO server (Development)...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)
