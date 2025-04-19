# 프로젝트 파일 구조 및 설명

이 문서는 License Manager Admin 프로젝트의 프론트엔드 및 백엔드 파일 구조를 설명합니다.

## 1. 프론트엔드 (React + Vite)

프론트엔드 애플리케이션은 React와 Vite를 사용하여 구축되었습니다. 주요 파일 및 디렉토리 구조는 다음과 같습니다.

```
/
├── public/              # 정적 에셋 (이미지, 폰트 등)
├── src/                 # 소스 코드 루트
│   ├── components/      # 재사용 가능한 React 컴포넌트
│   │   ├── AdminLogin.jsx
│   │   ├── AdminPanel.jsx
│   │   ├── Filters.jsx
│   │   ├── Footer.jsx
│   │   ├── LandingIntro.jsx
│   │   ├── MonthlyChart.jsx
│   │   ├── PracticeForms.jsx
│   │   ├── Statistics.jsx
│   │   └── UserTable.jsx
│   ├── hooks/           # 커스텀 React Hooks
│   │   └── useSocket.js
│   ├── services/        # API 통신 관련 서비스
│   │   └── api.js
│   ├── utils/           # 유틸리티 함수
│   │   └── helpers.js
│   ├── App.jsx          # 메인 애플리케이션 컴포넌트 (라우팅 등)
│   ├── index.css        # 전역 CSS 스타일 (Tailwind CSS 포함)
│   └── main.jsx         # 애플리케이션 진입점 (React DOM 렌더링)
├── .env                 # 개발 환경 변수 (로컬)
├── .env.production      # 프로덕션 환경 변수
├── .gitignore           # Git 추적 제외 파일/디렉토리 목록
├── .prettierrc.json     # Prettier 코드 포맷터 설정
├── eslint.config.js     # ESLint 코드 린터 설정
├── index.html           # HTML 템플릿 (Vite 진입점)
├── package.json         # 프로젝트 메타데이터 및 의존성 관리
├── package-lock.json    # 의존성 버전 고정
├── postcss.config.js    # PostCSS 설정 (Tailwind CSS 등)
├── tailwind.config.js   # Tailwind CSS 설정
└── vite.config.js       # Vite 설정 파일
```

**주요 디렉토리 설명:**

*   `public/`: 빌드 과정에 포함되지 않고 그대로 제공되는 정적 파일들을 위치시킵니다.
*   `src/`: 애플리케이션의 핵심 로직과 UI 컴포넌트가 위치합니다.
    *   `components/`: UI를 구성하는 각 부분(로그인 폼, 관리자 패널, 테이블 등)을 컴포넌트 단위로 분리하여 관리합니다.
    *   `hooks/`: 상태 관리 로직, API 호출 로직 등 재사용 가능한 로직을 커스텀 훅으로 분리합니다. (예: `useSocket` - 웹소켓 연결 관리)
    *   `services/`: 백엔드 API와 통신하는 함수들을 모아 관리합니다. (예: `api.js`)
    *   `utils/`: 날짜 포맷팅, 데이터 검증 등 애플리케이션 전반에서 사용되는 유틸리티 함수들을 관리합니다.
*   **설정 파일**:
    *   `vite.config.js`: Vite 빌드 도구 관련 설정 (플러그인, 서버 옵션 등)
    *   `tailwind.config.js`, `postcss.config.js`: Tailwind CSS 및 PostCSS 관련 설정
    *   `eslint.config.js`, `.prettierrc.json`: 코드 스타일 및 품질 관리를 위한 린터/포맷터 설정
    *   `package.json`: 프로젝트 의존성 및 스크립트 정의

## 2. 백엔드

현재 프로젝트에는 두 개의 백엔드 서버 디렉토리가 존재합니다.

### 2.1. Node.js 백엔드 (`NodeBackendServer/`)

Node.js와 Express 프레임워크를 기반으로 구축된 메인 백엔드 서버로 추정됩니다.

```
NodeBackendServer/
├── db/                  # 데이터베이스 관련 모듈
│   └── database.js      # 데이터베이스 연결 및 쿼리 로직 (추정)
├── middleware/          # Express 미들웨어
│   └── auth.js          # 인증/인가 관련 미들웨어 (추정)
├── routes/              # API 라우팅 정의
│   ├── admin.js         # 관리자 관련 API 라우트
│   └── public.js        # 공개 API 라우트 (로그인 등)
├── .env                 # 백엔드 환경 변수 (로컬)
├── .gitignore           # Git 추적 제외 파일/디렉토리 목록
└── server.js            # Express 서버 진입점 및 설정
```

**주요 파일/디렉토리 설명:**

*   `db/database.js`: 데이터베이스(종류 미확인) 연결 설정 및 데이터 조작 관련 함수들이 위치할 것으로 예상됩니다.
*   `middleware/auth.js`: 요청 처리 전후에 실행되는 미들웨어, 특히 사용자 인증 및 권한 검사 로직이 포함될 수 있습니다.
*   `routes/`: API 엔드포인트를 정의하고 해당 요청을 처리하는 컨트롤러 로직을 연결합니다. `admin.js`는 관리자 기능, `public.js`는 일반 사용자 또는 로그인 관련 기능을 담당할 것으로 보입니다.
*   `server.js`: Express 애플리케이션을 생성하고, 미들웨어를 등록하며, 라우터를 연결하고, 서버를 시작하는 메인 파일입니다.
*   `.env`: 데이터베이스 접속 정보, JWT 시크릿 키 등 민감한 설정값을 환경 변수로 관리합니다.

### 2.2. Python 백엔드 (`BackEndServer/`)

간단한 Python 기반 서버로 보이며, 특정 기능을 위해 별도로 운영될 수 있습니다. (예: 라이선스 키 생성/검증 등)

```
BackEndServer/
├── .env         # Python 백엔드 환경 변수 (로컬)
└── app.py       # Python 서버 애플리케이션 코드 (Flask 또는 FastAPI 등 사용 추정)
```

**주요 파일 설명:**

*   `app.py`: Python 웹 프레임워크(Flask, FastAPI 등)를 사용하여 구현된 서버 로직이 포함된 파일입니다. 현재 파일 하나만 존재하므로 비교적 간단한 기능을 수행할 가능성이 높습니다.
*   `.env`: Python 서버에서 사용하는 환경 변수를 정의합니다.

## 3. 기타 설정 파일

*   `.github/workflows/`: GitHub Actions 워크플로우 파일들이 위치합니다.
    *   `deploy.yml`: 프론트엔드 배포 자동화 워크플로우 (추정)
    *   `deploy-backend.yml`: 백엔드 배포 자동화 워크플로우 (추정)
*   `PROCESS_DOCUMENTATION.md`: 프로젝트 진행 과정 관련 문서
*   `TECHNOLOGIES.md`: 프로젝트에 사용된 기술 스택 관련 문서
*   `README.md`: 프로젝트 개요 및 사용법 안내

이 구조는 현재 파일 목록을 기반으로 추정한 것이며, 실제 구현 내용에 따라 다를 수 있습니다.
