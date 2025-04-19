# 라이선스 관리 시스템: 업무 프로세스 및 작업 내용

이 문서는 라이선스 관리 시스템의 전체적인 작동 방식, 주요 기능, 데이터 흐름 및 배포 과정을 설명합니다.

## 1. 개요

본 시스템은 특정 소프트웨어의 라이선스를 Computer ID 기반으로 관리하기 위한 웹 애플리케이션입니다. 관리자는 웹 인터페이스를 통해 등록된 사용자(Computer ID)의 라이선스 상태를 확인하고 승인, 거절, 삭제 등의 작업을 수행할 수 있습니다. 또한, 웹소켓(Socket.IO)을 이용한 실시간 업데이트 기능을 통해 관리자 패널의 사용자 목록이 자동으로 갱신됩니다.

주요 구성 요소는 다음과 같습니다:

*   **프론트엔드:** React 기반의 사용자 인터페이스 (GitHub Pages 배포)
*   **백엔드:** Node.js + Express 기반의 API 및 웹소켓 서버 (Debian LXC 컨테이너 배포)
*   **데이터베이스:** SQLite (사용자 등록 정보 저장)
*   **리버스 프록시:** Nginx Proxy Manager (도메인 연결, SSL, API/웹소켓 프록시)

## 2. 프론트엔드 (UI) - `src/App.jsx`

프론트엔드는 사용자의 로그인 상태에 따라 다른 화면과 기능을 제공합니다.

### 2.1. 로그아웃 상태 (랜딩 페이지)

사용자가 관리자로 로그인하지 않은 상태입니다.

*   **기본 화면:**
    *   시스템 제목("라이선스 관리 시스템")과 간단한 설명이 표시됩니다.
*   **연습용 기능 (항상 표시):**
    *   **등록 요청 (연습용):**
        *   사용자가 Computer ID를 입력하고 [요청] 버튼을 클릭합니다.
        *   `handleRegister` 함수가 실행되어 백엔드의 `/register` API로 POST 요청을 보냅니다.
        *   백엔드 응답(성공 메시지 또는 오류)을 받아 폼 하단에 표시합니다.
    *   **상태 확인 (연습용):**
        *   사용자가 Computer ID를 입력하고 [상태 확인] 버튼을 클릭합니다.
        *   `handleValidate` 함수가 실행되어 백엔드의 `/validate` API로 POST 요청을 보냅니다.
        *   백엔드 응답(상태: Approved, Rejected, Pending, Not Found 또는 오류)을 받아 폼 하단에 표시합니다.
*   **관리자 로그인 폼 (항상 표시):**
    *   사용자가 관리자 사용자 이름과 비밀번호를 입력하고 [관리자 로그인] 버튼을 클릭합니다.
    *   `handleAdminLogin` 함수가 실행되어 백엔드의 `/admin/login` API로 POST 요청을 보냅니다.
    *   **성공 시:**
        *   백엔드로부터 JWT 액세스 토큰을 받습니다.
        *   토큰을 브라우저 로컬 스토리지(Local Storage)에 저장합니다.
        *   React 상태(`accessToken`, `isLoggedIn`)를 업데이트하여 로그인 상태로 전환합니다.
        *   관리자 패널 화면으로 전환됩니다.
    *   **실패 시:**
        *   로그인 폼 하단에 오류 메시지("잘못된 사용자 이름 또는 비밀번호입니다." 등)를 표시합니다.

### 2.2. 로그인 상태 (관리자 패널)

관리자로 성공적으로 로그인한 상태입니다.

*   **초기 로드 및 실시간 연결:**
    *   `useEffect` 훅이 실행됩니다.
    *   `fetchAllUsers` 함수를 호출하여 백엔드의 `/admin/users` API로부터 전체 사용자 목록을 가져와 화면 테이블에 표시합니다. (API 호출 시 JWT 토큰을 `Authorization` 헤더에 포함)
    *   `socket.io-client`를 사용하여 백엔드 웹소켓 서버(`API_URL`)에 연결을 시도합니다. 연결 시 JWT 토큰을 `auth` 옵션으로 전달합니다.
    *   웹소켓 연결 성공 시 콘솔에 "WebSocket connected" 로그가 출력됩니다.
    *   백엔드로부터 `update_user_list` 이벤트를 수신할 리스너를 설정합니다.
*   **사용자 목록 표시:**
    *   가져온 사용자 목록(`allUsers` 상태)을 테이블 형태로 화면에 표시합니다.
    *   테이블 컬럼: ID, 컴퓨터 ID, 상태, 요청 시간, 승인/거절 시간, 메모, 작업.
    *   사용자 상태(Approved, Rejected, Pending)에 따라 행 배경색과 상태 배지가 다르게 표시됩니다.
*   **실시간 업데이트:**
    *   백엔드에서 사용자 데이터 변경(등록, 승인, 거절, 삭제)이 발생하면, 백엔드는 연결된 모든 클라이언트에게 `update_user_list` 웹소켓 이벤트를 발행(emit)합니다.
    *   프론트엔드는 이 이벤트를 수신하여 `fetchAllUsers` 함수를 다시 호출하고, 최신 사용자 목록을 가져와 테이블을 자동으로 업데이트합니다.
*   **사용자 작업:**
    *   **승인/거절:** 'Pending' 상태인 사용자의 [승인] 또는 [거절] 버튼을 클릭합니다.
        *   `handleAction` 함수가 실행되어 백엔드의 `/admin/action/<id>` API로 POST 요청을 보냅니다. (JWT 토큰 포함)
        *   백엔드에서 처리 후 `update_user_list` 이벤트가 발행되어 목록이 자동으로 업데이트됩니다.
    *   **삭제:** 사용자의 [삭제] 버튼을 클릭합니다.
        *   `window.confirm`으로 삭제 여부를 확인합니다.
        *   `handleDelete` 함수가 실행되어 백엔드의 `/admin/user/<id>` API로 DELETE 요청을 보냅니다. (JWT 토큰 포함)
        *   백엔드에서 처리 후 `update_user_list` 이벤트가 발행되어 목록이 자동으로 업데이트됩니다.
*   **로그아웃:**
    *   [로그아웃] 버튼을 클릭합니다.
    *   `handleAdminLogout` 함수가 실행됩니다.
    *   웹소켓 연결을 해제합니다 (`socketRef.current.disconnect()`).
    *   로컬 스토리지와 React 상태에서 토큰 및 관련 정보를 제거합니다.
    *   `isLoggedIn` 상태가 `false`로 변경되어 랜딩 페이지 화면으로 전환됩니다.

## 3. 백엔드 (API 서버) - `NodeBackendServer/server.js`

Node.js 환경에서 Express와 Socket.IO를 사용하여 API 및 웹소켓 서버를 구축합니다.

*   **서버 초기화:**
    *   Express 앱 인스턴스를 생성합니다.
    *   Node.js 내장 `http` 모듈로 HTTP 서버를 생성합니다.
    *   Socket.IO 서버를 생성하고 HTTP 서버와 연결합니다. CORS 설정을 적용합니다.
    *   Express 앱에 CORS 미들웨어와 JSON 파싱 미들웨어를 적용합니다.
    *   환경 변수(포트, 관리자 계정, JWT 키 등)를 로드하고 확인합니다.
*   **데이터베이스 (`connectDb`, `initDb`):**
    *   SQLite 데이터베이스 파일(`../BackEndServer/license_db.sqlite`)을 사용합니다 (`sqlite3` npm 패키지).
    *   서버 시작 시 `connectDb` 함수를 호출하여 데이터베이스에 연결합니다. 파일이 없으면 `initDb` 함수를 호출하여 디렉토리 및 파일을 생성하고 `registrations` 테이블을 생성합니다.
*   **API 엔드포인트 (Express 라우트):**
    *   `/register` (POST): 클라이언트로부터 Computer ID를 받아 데이터베이스에 'Pending' 상태로 등록하고, `update_user_list` 웹소켓 이벤트를 발행합니다.
    *   `/validate` (POST): Computer ID를 받아 데이터베이스에서 상태를 조회하여 반환합니다.
    *   `/admin/login` (POST): 사용자 이름과 비밀번호를 받아 환경 변수의 관리자 정보(해시된 비밀번호)와 `bcrypt.compare`를 사용하여 비교합니다. 일치하면 JWT 액세스 토큰(`jsonwebtoken` 라이브러리 사용)을 생성하여 반환합니다.
    *   `/admin/users` (GET, JWT 필요): `authenticateToken` 미들웨어를 통해 JWT 토큰을 검증합니다. 유효한 경우 데이터베이스에서 모든 사용자 정보를 조회하여 반환합니다.
    *   `/admin/requests` (GET, JWT 필요): `authenticateToken` 미들웨어를 통해 JWT 토큰을 검증합니다. 'Pending' 상태인 사용자 정보만 조회하여 반환합니다.
    *   `/admin/action/<id>` (POST, JWT 필요): `authenticateToken` 미들웨어를 통해 JWT 토큰을 검증합니다. 특정 사용자의 상태를 'Approved' 또는 'Rejected'로 업데이트하고, `update_user_list` 웹소켓 이벤트를 발행합니다.
    *   `/admin/user/<id>` (DELETE, JWT 필요): `authenticateToken` 미들웨어를 통해 JWT 토큰을 검증합니다. 특정 사용자를 데이터베이스에서 삭제하고, `update_user_list` 웹소켓 이벤트를 발행합니다.
*   **웹소켓 이벤트 (Socket.IO):**
    *   `connection`: 클라이언트가 웹소켓에 연결될 때 호출됩니다. 연결 시 `io.use` 미들웨어를 통해 JWT 토큰 인증을 수행합니다.
    *   `disconnect`: 클라이언트 연결이 끊어졌을 때 호출됩니다.
    *   `io.emit('update_user_list', ...)`: 사용자 데이터 변경 시 연결된 모든 클라이언트에게 'update_user_list' 이벤트를 브로드캐스트합니다.
*   **서버 실행 및 종료:**
    *   `server.listen(PORT, ...)`: 지정된 포트에서 HTTP 서버를 시작합니다.
    *   `process.on('SIGINT', ...), process.on('SIGTERM', ...)`: 종료 신호(Ctrl+C 등)를 감지하여 Socket.IO 서버, HTTP 서버, 데이터베이스 연결을 순서대로 안전하게 종료하는 `gracefulShutdown` 함수를 실행합니다.

## 4. 인증 및 인가

*   **관리자 로그인:** 백엔드는 환경 변수에 저장된 사용자 이름 및 **해시된 비밀번호**와 사용자가 입력한 값을 `bcrypt.compare`를 사용하여 비교합니다. 성공 시 JWT 토큰을 발급합니다.
*   **API 접근 제어:** 관리자 기능 API(`/admin/*` 경로)는 `authenticateToken` 미들웨어를 통해 보호됩니다. 클라이언트는 유효한 JWT 토큰을 HTTP 요청 헤더(`Authorization: Bearer <토큰>`)에 포함해야만 해당 API에 접근할 수 있습니다.
*   **웹소켓 인증:** 프론트엔드는 웹소켓 연결 시 `auth` 옵션을 통해 JWT 토큰을 전달합니다. 백엔드의 `io.use` 미들웨어는 이 토큰을 `jsonwebtoken` 라이브러리로 검증하여 유효하지 않으면 연결을 거부합니다.

## 5. 배포

*   **프론트엔드:**
    *   로컬에서 `npm run build` 명령으로 프로젝트를 빌드합니다.
    *   `npm run deploy` 명령을 사용하여 빌드 결과물(`dist` 폴더)을 GitHub 저장소의 `gh-pages` 브랜치에 푸시합니다.
    *   GitHub Pages는 `gh-pages` 브랜치의 내용을 웹사이트(`https://DreamHouseKSH.github.io/license-admin`)로 자동 배포합니다.
    *   빌드 시 사용될 백엔드 API 주소(`VITE_API_URL`)는 GitHub 저장소의 Secrets에서 가져옵니다 (GitHub Actions 워크플로우 사용 시) 또는 로컬 `.env.production` 파일을 사용합니다 (수동 배포 시).
*   **백엔드:**
    *   Debian LXC 컨테이너 환경에서 실행됩니다.
    *   Node.js 런타임과 npm 패키지 관리자를 사용합니다.
    *   systemd 서비스(`node-license-admin.service`)를 사용하여 Node.js 서버 프로세스(`node server.js`)를 관리합니다.
    *   `.env` 파일 또는 systemd 서비스 파일의 `Environment` 지시어를 통해 환경 변수를 설정합니다.
*   **리버스 프록시:**
    *   Nginx Proxy Manager를 사용하여 외부 도메인(`licmngserver.dahangis.co.kr`)과 백엔드 서버(`http://<서버_IP>:8000`)를 연결합니다.
    *   SSL 인증서를 적용하여 HTTPS 통신을 제공합니다.
    *   웹소켓 연결을 지원하도록 설정되어 있습니다 ("Websockets Support" 옵션 활성화).

## 6. 설정 관리

*   **프론트엔드:**
    *   `.env`: 로컬 개발 환경용 환경 변수 (Git 무시됨)
    *   `.env.production`: 프로덕션 빌드용 환경 변수 (Git 추적됨, 비밀 정보 포함 금지)
    *   GitHub Secrets: GitHub Actions 워크플로우에서 사용할 민감한 정보(예: `VITE_API_URL`) 저장
*   **백엔드:**
    *   `NodeBackendServer/.env`: 백엔드 환경 변수 (관리자 계정, JWT 비밀 키 등) 저장 (Git 무시됨)
    *   `/etc/systemd/system/node-license-admin.service`: systemd 서비스 파일 내 `Environment` 지시어를 통해 환경 변수 설정 가능 (현재 방식)
