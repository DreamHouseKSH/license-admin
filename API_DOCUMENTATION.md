# License Manager Admin - 백엔드 API 문서

이 문서는 License Manager Admin 백엔드 API의 엔드포인트, 기능, 요청/응답 형식 등을 설명합니다.

**기본 URL**: (서버 주소)/api (예: `http://localhost:3001/api`)

**인증**:

*   대부분의 관리자 API는 **JWT(JSON Web Token)** 인증이 필요합니다.
*   로그인 성공 시 발급되는 `accessToken`을 HTTP 요청 헤더의 `Authorization` 필드에 `Bearer <token>` 형식으로 포함해야 합니다.

## 1. 공개 API (`/api`)

인증 없이 접근 가능한 API입니다.

### 1.1. 등록 요청 제출

*   **엔드포인트**: `POST /register`
*   **설명**: 클라이언트(라이선스 사용자)가 자신의 컴퓨터 ID를 사용하여 라이선스 등록을 요청합니다.
*   **인증**: 필요 없음
*   **요청 본문**:
    ```json
    {
      "computer_id": "사용자의 고유 컴퓨터 식별자"
    }
    ```
*   **성공 응답**:
    *   **`201 Created`**: 신규 등록 요청 성공
        ```json
        {
          "message": "등록 요청 접수됨, 승인 대기 중입니다."
        }
        ```
    *   **`200 OK`**: 이미 등록되었거나 승인 대기 중인 경우
        ```json
        {
          "message": "이미 등록되었거나 승인 대기 중인 컴퓨터 ID입니다."
        }
        ```
*   **오류 응답**:
    *   **`400 Bad Request`**: `computer_id` 누락
        ```json
        {
          "error": "computer_id가 누락되었습니다."
        }
        ```
    *   **`500 Internal Server Error`**: 데이터베이스 오류
        ```json
        {
          "error": "데이터베이스 오류"
        }
        ```
*   **추가 동작**: 성공적인 신규 등록 시, 웹소켓을 통해 관리자에게 `update_user_list` 이벤트가 전송됩니다.

### 1.2. 등록 상태 확인

*   **엔드포인트**: `POST /validate`
*   **설명**: 클라이언트가 자신의 `computer_id`에 대한 현재 등록 상태(승인 여부)를 확인합니다.
*   **인증**: 필요 없음
*   **요청 본문**:
    ```json
    {
      "computer_id": "사용자의 고유 컴퓨터 식별자"
    }
    ```
*   **성공 응답**:
    *   **`200 OK`**: 등록 정보를 찾은 경우
        ```json
        {
          "status": "Pending" | "Approved" | "Rejected"
        }
        ```
        *(참고: 상태 값은 영어로 반환되며, 프론트엔드에서 필요에 따라 변환합니다.)*
    *   **`404 Not Found`**: 해당 `computer_id`로 등록된 정보가 없는 경우
        ```json
        {
          "status": "Not Found"
        }
        ```
*   **오류 응답**:
    *   **`400 Bad Request`**: `computer_id` 누락
        ```json
        {
          "error": "computer_id가 누락되었습니다."
        }
        ```
    *   **`500 Internal Server Error`**: 데이터베이스 오류
        ```json
        {
          "error": "데이터베이스 오류"
        }
        ```

## 2. 관리자 API (`/api/admin`)

관리자 기능 수행을 위한 API이며, 로그인을 제외한 모든 엔드포인트는 JWT 인증이 필요합니다.

### 2.1. 관리자 로그인

*   **엔드포인트**: `POST /admin/login`
*   **설명**: 관리자 계정으로 로그인하여 JWT 액세스 토큰을 발급받습니다.
*   **인증**: 필요 없음
*   **요청 본문**:
    ```json
    {
      "username": "관리자 아이디",
      "password": "관리자 비밀번호"
    }
    ```
*   **성공 응답**:
    *   **`200 OK`**: 로그인 성공
        ```json
        {
          "accessToken": "발급된_JWT_액세스_토큰"
        }
        ```
*   **오류 응답**:
    *   **`401 Unauthorized`**: 사용자 이름 또는 비밀번호 불일치
        ```json
        {
          "msg": "잘못된 사용자 이름 또는 비밀번호입니다."
        }
        ```

### 2.2. 전체 사용자 목록 조회

*   **엔드포인트**: `GET /admin/users`
*   **설명**: 등록된 모든 사용자(라이선스 요청자)의 목록과 상태 정보를 조회합니다.
*   **인증**: JWT 토큰 필요 (`Authorization: Bearer <token>`)
*   **성공 응답**:
    *   **`200 OK`**:
        ```json
        [
          {
            "id": 1,
            "computer_id": "COMP-ID-123",
            "request_timestamp": "2024-01-10T10:00:00.000Z",
            "status": "Approved",
            "approval_timestamp": "2024-01-10T11:30:00.000Z",
            "notes": "테스트 사용자" // 관리자가 추가한 메모 (현재 구현에는 없음)
          },
          // ... 다른 사용자 정보
        ]
        ```
*   **오류 응답**:
    *   **`401 Unauthorized` / `403 Forbidden`**: 인증 실패
    *   **`500 Internal Server Error`**: 데이터베이스 오류

### 2.3. 보류 중인 요청 조회

*   **엔드포인트**: `GET /admin/requests`
*   **설명**: 현재 승인 대기 중인 등록 요청 목록을 조회합니다.
*   **인증**: JWT 토큰 필요
*   **성공 응답**:
    *   **`200 OK`**:
        ```json
        [
          {
            "id": 2,
            "computer_id": "COMP-ID-456",
            "request_timestamp": "2024-01-11T09:00:00.000Z"
          },
          // ... 다른 보류 중인 요청
        ]
        ```
*   **오류 응답**:
    *   **`401 Unauthorized` / `403 Forbidden`**: 인증 실패
    *   **`500 Internal Server Error`**: 데이터베이스 오류

### 2.4. 사용자 삭제

*   **엔드포인트**: `DELETE /admin/user/:id`
*   **설명**: 특정 ID의 사용자를 등록 목록에서 삭제합니다.
*   **인증**: JWT 토큰 필요
*   **경로 매개변수**:
    *   `id`: 삭제할 사용자의 고유 ID (데이터베이스 `id` 컬럼 값)
*   **성공 응답**:
    *   **`200 OK`**:
        ```json
        {
          "message": "사용자 ID {id} 삭제 성공"
        }
        ```
*   **오류 응답**:
    *   **`404 Not Found`**: 해당 ID의 사용자를 찾을 수 없음
        ```json
        {
          "message": "사용자를 찾을 수 없습니다."
        }
        ```
    *   **`401 Unauthorized` / `403 Forbidden`**: 인증 실패
    *   **`500 Internal Server Error`**: 데이터베이스 오류
*   **추가 동작**: 성공적인 삭제 시, 웹소켓을 통해 관리자에게 `update_user_list` 이벤트가 전송됩니다.

### 2.5. 요청 처리 (승인/거절)

*   **엔드포인트**: `POST /admin/action/:id`
*   **설명**: 특정 ID의 등록 요청을 승인하거나 거절합니다.
*   **인증**: JWT 토큰 필요
*   **경로 매개변수**:
    *   `id`: 처리할 요청의 고유 ID (데이터베이스 `id` 컬럼 값)
*   **요청 본문**:
    ```json
    {
      "action": "Approve" | "Reject"
    }
    ```
*   **성공 응답**:
    *   **`200 OK`**:
        ```json
        {
          "message": "요청 ID {id}이(가) 승인되었습니다." // 또는 "거절되었습니다."
        }
        ```
*   **오류 응답**:
    *   **`400 Bad Request`**: `action` 값이 잘못되었거나 누락됨
        ```json
        {
          "error": "잘못된 작업 요청입니다 (승인 또는 거절)."
        }
        ```
    *   **`404 Not Found`**: 해당 ID의 요청을 찾을 수 없거나 이미 처리됨
        ```json
        {
          "message": "요청을 찾을 수 없거나 이미 처리되었습니다."
        }
        ```
    *   **`401 Unauthorized` / `403 Forbidden`**: 인증 실패
    *   **`500 Internal Server Error`**: 데이터베이스 오류
*   **추가 동작**: 성공적인 처리 시, 웹소켓을 통해 관리자에게 `update_user_list` 이벤트가 전송됩니다.
