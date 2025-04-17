# 프로젝트 기술 스택 및 버전 정보

이 문서는 라이선스 관리 시스템 프로젝트에 사용된 주요 기술 스택과 해당 버전 정보를 정리합니다.

## 백엔드 (Backend)

백엔드는 Python 기반의 Flask 프레임워크를 사용하여 구현되었습니다.

| 기술 분류         | 기술명               | 버전      | 설명                                                                 |
|-----------------|----------------------|-----------|----------------------------------------------------------------------|
| **웹 프레임워크** | Flask                | `3.1.0`   | 마이크로 웹 프레임워크                                                   |
| **데이터베이스**  | SQLite               | -         | Python 내장 `sqlite3` 모듈 사용 (별도 버전 없음)                         |
| **인증**          | Flask-JWT-Extended   | `4.7.1`   | JWT(JSON Web Tokens) 기반 인증 처리                                    |
| **비밀번호 처리** | bcrypt               | `4.3.0`   | 비밀번호 해싱 라이브러리                                                 |
| **실시간 통신** | Flask-SocketIO       | `5.5.1`   | 웹소켓(WebSockets) 기반 실시간 양방향 통신 구현                          |
|                 | python-socketio      | `5.13.0`  | Flask-SocketIO의 의존성, Socket.IO 프로토콜 구현                       |
|                 | python-engineio      | `4.12.0`  | Flask-SocketIO의 의존성, Engine.IO 프로토콜 구현                       |
| **비동기 처리** | eventlet             | `0.39.1`  | 웹소켓/SSE 지원을 위한 비동기 네트워킹 라이브러리 (Gunicorn 워커)        |
|                 | gevent               | `24.11.1` | 웹소켓/SSE 지원을 위한 비동기 네트워킹 라이브러리 (현재 eventlet 사용 중) |
|                 | greenlet             | `3.2.0`   | eventlet/gevent 의존성                                               |
| **WSGI 서버**   | Gunicorn             | `23.0.0`  | Python WSGI HTTP 서버                                                |
| **환경 변수**   | python-dotenv        | `1.1.0`   | `.env` 파일에서 환경 변수 로드                                           |
| **CORS 처리**   | flask-cors           | `5.0.1`   | Cross-Origin Resource Sharing 처리 (SocketIO 내장 기능도 사용)         |
| **데이터베이스 ORM/유틸** | - | - | 특별한 ORM 없이 `sqlite3` 직접 사용 |
| **기타 의존성** | Werkzeug             | `3.1.3`   | Flask 의존성, WSGI 유틸리티 라이브러리                                 |
|                 | Jinja2               | `3.1.6`   | Flask 의존성, 템플릿 엔진 (현재 직접 사용 안 함)                         |
|                 | itsdangerous         | `2.2.0`   | Flask 의존성, 데이터 서명 라이브러리                                   |
|                 | click                | `8.1.8`   | Flask 의존성, 커맨드 라인 인터페이스 생성                              |
|                 | MarkupSafe           | `3.0.2`   | Jinja2 의존성                                                        |
|                 | blinker              | `1.9.0`   | Flask 시그널링 라이브러리                                              |
|                 | PyJWT                | `2.10.1`  | Flask-JWT-Extended 의존성                                            |
|                 | simple-websocket     | `1.1.0`   | python-engineio 의존성                                               |
|                 | six                  | `1.17.0`  | 호환성 라이브러리 (다른 패키지의 의존성)                               |
|                 | bidict               | `0.23.1`  | python-socketio 의존성                                               |
|                 | async-timeout        | `5.0.1`   | 비동기 관련 유틸리티 (다른 패키지의 의존성)                              |
|                 | dnspython            | `2.7.0`   | DNS 툴킷 (다른 패키지의 의존성)                                        |
|                 | h11                  | `0.14.0`  | HTTP/1.1 프로토콜 구현 (다른 패키지의 의존성)                          |
|                 | packaging            | `24.2`    | 패키지 관련 유틸리티 (다른 패키지의 의존성)                              |
|                 | wsproto              | `1.2.0`   | WebSocket 프로토콜 구현 (다른 패키지의 의존성)                         |
|                 | zope.event           | `5.0`     | gevent 의존성                                                        |
|                 | zope.interface       | `7.2`     | gevent 의존성                                                        |
|                 | redis                | `5.2.1`   | Redis 클라이언트 라이브러리 (SSE 구현 시 설치, 현재 웹소켓 사용으로 불필요) |
|                 | Flask-SSE            | `1.0.0`   | SSE 라이브러리 (현재 웹소켓 사용으로 불필요)                             |

*참고: `redis`와 `Flask-SSE`는 이전에 SSE 구현 시 설치되었으나, 현재 웹소켓 방식으로 변경되어 직접적으로 사용되지 않습니다. 필요 없다면 가상 환경에서 제거해도 됩니다.*

## 프론트엔드 (Frontend)

프론트엔드는 React 라이브러리와 Vite 빌드 도구를 사용하여 구현되었습니다.

| 기술 분류         | 기술명                       | 버전      | 설명                                                                 |
|-----------------|------------------------------|-----------|----------------------------------------------------------------------|
| **UI 라이브러리** | React                        | `^19.0.0` | 사용자 인터페이스 구축 라이브러리                                      |
|                 | React DOM                    | `^19.0.0` | React를 웹 브라우저 DOM과 연결                                         |
| **빌드 도구**     | Vite                         | `^6.2.0`  | 빠르고 효율적인 프론트엔드 빌드 도구                                   |
|                 | @vitejs/plugin-react         | `^4.3.4`  | Vite에서 React를 사용하기 위한 플러그인                                |
| **스타일링**      | Tailwind CSS                 | `^3.4.1`  | 유틸리티 우선 CSS 프레임워크                                           |
|                 | PostCSS                      | `^8.4.21` | CSS 처리 도구 (Tailwind CSS 의존성)                                |
|                 | Autoprefixer                 | `^10.4.21`| CSS 벤더 프리픽스 자동 추가 (Tailwind CSS 의존성)                      |
| **HTTP 클라이언트**| Axios                        | `^1.8.4`  | Promise 기반 HTTP 클라이언트                                         |
| **실시간 통신** | socket.io-client             | `^4.8.1`  | 웹소켓(Socket.IO) 클라이언트 라이브러리                                |
| **코드 품질**     | ESLint                       | `^9.24.0` | JavaScript/JSX 코드 린터                                             |
|                 | Prettier                     | `^3.5.3`  | 코드 포맷터                                                            |
|                 | eslint-config-prettier       | `^10.1.2` | ESLint와 Prettier 충돌 방지 설정                                     |
|                 | eslint-plugin-prettier       | `^5.2.6`  | ESLint에서 Prettier 규칙 사용                                        |
|                 | eslint-plugin-react          | `^7.37.5` | React 관련 ESLint 규칙                                               |
|                 | eslint-plugin-react-hooks    | `^5.2.0`  | React Hooks 관련 ESLint 규칙                                         |
|                 | eslint-plugin-react-refresh  | `^0.4.19` | Vite Fast Refresh 관련 ESLint 규칙                                   |
|                 | @eslint/js                   | `^9.24.0` | ESLint JavaScript 규칙                                               |
|                 | globals                      | `^16.0.0` | ESLint 전역 변수 설정                                                |
| **배포**          | gh-pages                     | `^6.3.0`  | GitHub Pages 배포 유틸리티                                           |
| **기타 (SSE 관련)** | @microsoft/fetch-event-source | `^2.0.1` | SSE 클라이언트 라이브러리 (현재 웹소켓 사용으로 불필요)                  |

*참고: `@microsoft/fetch-event-source`는 이전에 SSE 구현 시 설치되었으나, 현재 웹소켓 방식으로 변경되어 직접적으로 사용되지 않습니다. 필요 없다면 `npm uninstall @microsoft/fetch-event-source` 명령으로 제거해도 됩니다.*

## 인프라 및 기타

| 기술 분류             | 기술명               | 설명                                       |
|-----------------------|----------------------|--------------------------------------------|
| **백엔드 호스팅**     | Debian LXC           | Proxmox 환경 내 컨테이너                     |
| **프론트엔드 호스팅** | GitHub Pages         | 정적 웹사이트 호스팅 서비스                  |
| **리버스 프록시**     | Nginx Proxy Manager  | 도메인 연결, SSL 처리, 백엔드 프록시       |
| **백엔드 프로세스 관리**| systemd              | 백엔드 Gunicorn 서비스 관리                |
| **메시지 큐 (SSE용)** | Redis                | SSE 구현 시 사용 (현재 웹소켓 사용으로 불필요) |
