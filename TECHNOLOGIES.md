# 프로젝트 기술 스택 및 버전 정보

이 문서는 라이선스 관리 시스템 프로젝트에 사용된 주요 기술 스택과 해당 버전 정보를 정리합니다.

## 백엔드 (Backend)

백엔드는 Node.js 환경에서 Express 프레임워크와 Socket.IO를 사용하여 구현되었습니다.

| 기술 분류         | 기술명           | 버전      | 설명                                                     |
|-----------------|------------------|-----------|----------------------------------------------------------|
| **런타임**        | Node.js          | `20.x`    | JavaScript 런타임 (서버 환경에서 확인된 버전 기준)         |
| **웹 프레임워크** | Express          | `^4.19.2` | Node.js 웹 애플리케이션 프레임워크 (설치된 버전 기준 추정) |
| **실시간 통신** | Socket.IO        | `^4.7.5`  | 웹소켓 기반 실시간 양방향 통신 라이브러리 (서버)         |
| **데이터베이스**  | SQLite           | -         | `sqlite3` npm 패키지 사용 (`^5.1.7` 설치됨)              |
| **인증**          | jsonwebtoken     | `^9.0.2`  | JWT(JSON Web Tokens) 생성 및 검증 라이브러리             |
| **비밀번호 처리** | bcrypt           | `^5.1.1`  | 비밀번호 해싱 라이브러리                                 |
| **환경 변수**   | dotenv           | `^16.4.5` | `.env` 파일에서 환경 변수 로드                             |
| **CORS 처리**   | cors             | `^2.8.5`  | Cross-Origin Resource Sharing 미들웨어                   |
| **프로세스 관리** | systemd          | -         | Node.js 서버 프로세스 관리 (LXC 환경)                    |
| **기타**        | http             | -         | Node.js 내장 모듈 (HTTP 서버 생성)                       |
|                 | fs               | -         | Node.js 내장 모듈 (파일 시스템 접근)                     |
|                 | eventlet/gevent  | -         | (Python 관련, 현재 Node.js 백엔드에서는 사용 안 함)      |
|                 | Gunicorn         | -         | (Python 관련, 현재 Node.js 백엔드에서는 사용 안 함)      |
|                 | python-dotenv    | -         | (Python 관련, 현재 Node.js 백엔드에서는 사용 안 함)      |
|                 | Flask-JWT-Extended| -        | (Python 관련, 현재 Node.js 백엔드에서는 사용 안 함)      |
|                 | Flask-SocketIO   | -         | (Python 관련, 현재 Node.js 백엔드에서는 사용 안 함)      |
|                 | Flask-Cors       | -         | (Python 관련, 현재 Node.js 백엔드에서는 사용 안 함)      |

*참고: npm 패키지 버전은 `npm install` 시점에 따라 약간의 차이가 있을 수 있습니다. `package-lock.json` 파일에서 정확한 버전을 확인할 수 있습니다.*
*참고: Python 백엔드에서 사용되던 라이브러리(eventlet, gevent, Gunicorn 등)는 현재 Node.js 백엔드에서는 사용되지 않습니다.*

## 프론트엔드 (Frontend)

프론트엔드는 React 라이브러리와 Vite 빌드 도구를 사용하여 구현되었습니다.

| 기술 분류         | 기술명                       | 버전      | 설명                                                     |
|-----------------|------------------------------|-----------|----------------------------------------------------------|
| **UI 라이브러리** | React                        | `^19.0.0` | 사용자 인터페이스 구축 라이브러리                          |
|                 | React DOM                    | `^19.0.0` | React를 웹 브라우저 DOM과 연결                             |
| **빌드 도구**     | Vite                         | `^6.2.0`  | 빠르고 효율적인 프론트엔드 빌드 도구                       |
|                 | @vitejs/plugin-react         | `^4.3.4`  | Vite에서 React를 사용하기 위한 플러그인                    |
| **스타일링**      | Tailwind CSS                 | `^3.4.1`  | 유틸리티 우선 CSS 프레임워크                               |
|                 | PostCSS                      | `^8.4.21` | CSS 처리 도구 (Tailwind CSS 의존성)                    |
|                 | Autoprefixer                 | `^10.4.21`| CSS 벤더 프리픽스 자동 추가 (Tailwind CSS 의존성)          |
| **HTTP 클라이언트**| Axios                        | `^1.8.4`  | Promise 기반 HTTP 클라이언트                             |
| **실시간 통신** | socket.io-client             | `^4.8.1`  | 웹소켓(Socket.IO) 클라이언트 라이브러리                    |
| **코드 품질**     | ESLint                       | `^9.24.0` | JavaScript/JSX 코드 린터                                 |
|                 | Prettier                     | `^3.5.3`  | 코드 포맷터                                                |
|                 | eslint-config-prettier       | `^10.1.2` | ESLint와 Prettier 충돌 방지 설정                         |
|                 | eslint-plugin-prettier       | `^5.2.6`  | ESLint에서 Prettier 규칙 사용                            |
|                 | eslint-plugin-react          | `^7.37.5` | React 관련 ESLint 규칙                                   |
|                 | eslint-plugin-react-hooks    | `^5.2.0`  | React Hooks 관련 ESLint 규칙                             |
|                 | eslint-plugin-react-refresh  | `^0.4.19` | Vite Fast Refresh 관련 ESLint 규칙                       |
|                 | @eslint/js                   | `^9.24.0` | ESLint JavaScript 규칙                                   |
|                 | globals                      | `^16.0.0` | ESLint 전역 변수 설정                                    |
| **배포**          | gh-pages                     | `^6.3.0`  | GitHub Pages 배포 유틸리티                               |
| **기타 (SSE 관련)** | @microsoft/fetch-event-source | `^2.0.1` | SSE 클라이언트 라이브러리 (현재 웹소켓 사용으로 불필요)      |

*참고: `@microsoft/fetch-event-source`는 이전에 SSE 구현 시 설치되었으나, 현재 웹소켓 방식으로 변경되어 직접적으로 사용되지 않습니다. 필요 없다면 `npm uninstall @microsoft/fetch-event-source` 명령으로 제거해도 됩니다.*

## 인프라 및 기타

| 기술 분류             | 기술명               | 설명                                       |
|-----------------------|----------------------|--------------------------------------------|
| **백엔드 호스팅**     | Debian LXC           | Proxmox 환경 내 컨테이너                     |
| **프론트엔드 호스팅** | GitHub Pages         | 정적 웹사이트 호스팅 서비스                  |
| **리버스 프록시**     | Nginx Proxy Manager  | 도메인 연결, SSL 처리, 백엔드 프록시       |
| **백엔드 프로세스 관리**| systemd              | Node.js 서버 프로세스 관리                 |
| **메시지 큐 (SSE용)** | Redis                | SSE 구현 시 사용 (현재 웹소켓 사용으로 불필요) |
