import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// 백엔드 API 주소 - .env 파일 또는 환경 변수에서 가져옵니다. (Force re-deploy)
// 예: VITE_API_URL=http://LicMngServer.dahangis.co.kr
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // 기본값 설정 (개발용)

export default function App() {
  // --- 상태 관리 ---
  const [pending, setPending] = useState([]);
  const [computerId, setComputerId] = useState(''); // Computer ID 입력 상태
  const [validationResult, setValidationResult] = useState(null); // 검증 결과 상태

  // JWT 인증 및 관리자 상태
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null); // 로컬 스토리지에서 토큰 로드 시도
  const [isLoggedIn, setIsLoggedIn] = useState(!!accessToken); // 토큰 유무로 로그인 상태 결정
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminActionError, setAdminActionError] = useState(''); // 관리자 작업 오류 메시지


  // --- API 호출 함수 ---

  // 관리자: 보류 중인 요청 가져오기 (useCallback으로 메모이제이션)
  const fetchPending = useCallback(async () => {
    if (!accessToken) return; // 토큰 없으면 실행 안함
    setAdminActionError(''); // 이전 오류 메시지 초기화
    try {
      const res = await axios.get(`${API_URL}/admin/requests`, {
        headers: { Authorization: `Bearer ${accessToken}` } // JWT 토큰 헤더 추가
      });
      setPending(res.data || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setPending([]); // 오류 발생 시 빈 배열로 설정
      if (error.response && (error.response.status === 401 || error.response.status === 422)) { // 422: Unprocessable Entity (토큰 만료/무효 등)
        setAdminActionError('Authentication failed or token expired. Please log in again.');
        handleAdminLogout(); // 자동 로그아웃 처리
      } else {
        setAdminActionError('Failed to fetch pending requests.');
      }
    }
  }, [accessToken]); // accessToken 의존성 추가

  // 관리자: 요청 처리 (승인/거절)
  const handleAction = async (id, action) => {
    if (!accessToken) return;
    setAdminActionError('');
    try {
      await axios.post(`${API_URL}/admin/action/${id}`,
        { action: action }, // 요청 본문
        { headers: { Authorization: `Bearer ${accessToken}` } } // JWT 토큰 헤더 추가
      );
      fetchPending(); // 목록 새로고침
    } catch (error) {
      console.error(`Error processing action ${action} for ${id}:`, error);
       if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('Authentication failed or token expired. Please log in again.');
        handleAdminLogout(); // 자동 로그아웃 처리
      } else if (error.response && error.response.status === 404) {
         setAdminActionError(`Request ${id} not found or already processed.`);
      } else {
        setAdminActionError(`Failed to process action ${action} for request ${id}.`);
      }
    }
  };

  // 관리자 로그인 시도 함수
  const handleAdminLogin = async (e) => {
    e.preventDefault(); // 폼 기본 제출 방지
    setLoginError(''); // 이전 오류 초기화
    try {
      const res = await axios.post(`${API_URL}/admin/login`, {
        username: adminUsername,
        password: adminPassword,
      });
      const token = res.data.access_token;
      setAccessToken(token);
      localStorage.setItem('accessToken', token); // 토큰 로컬 스토리지에 저장
      setIsLoggedIn(true);
      setAdminPassword(''); // 보안을 위해 비밀번호 필드 초기화
    } catch (error) {
      console.error("Admin login failed:", error);
      if (error.response && error.response.status === 401) {
        setLoginError('Invalid username or password.');
      } else {
        setLoginError('Login failed. Could not connect to the server or other error.');
      }
      setAccessToken(null);
      localStorage.removeItem('accessToken'); // 실패 시 토큰 제거
      setIsLoggedIn(false);
    }
  };

  // 관리자 로그아웃 함수
  const handleAdminLogout = () => {
    setAccessToken(null);
    localStorage.removeItem('accessToken'); // 로컬 스토리지에서 토큰 제거
    setIsLoggedIn(false);
    setAdminUsername(''); // 상태 초기화
    setAdminPassword('');
    setPending([]);
    setLoginError('');
    setAdminActionError('');
  };


  // 공개: Computer ID 검증
  const handleValidate = async () => {
    if (!computerId) {
      setValidationResult({ error: 'Please enter a Computer ID.' });
      return;
    }
    setValidationResult(null); // 이전 결과 초기화
    try {
      const res = await axios.post(`${API_URL}/validate`, {
        computer_id: computerId,
      });
      setValidationResult({ status: res.data.status });
    } catch (error) {
      console.error("Validation error:", error);
      if (error.response && error.response.status === 404) {
        setValidationResult({ status: 'Not Found' });
      } else {
        setValidationResult({ error: 'An error occurred during validation.' });
      }
    }
  };


  // --- useEffect 훅 ---
  // 컴포넌트 마운트 시 또는 로그인 상태 변경 시 보류 목록 가져오기
  useEffect(() => {
    if (isLoggedIn) { // 로그인 상태일 때만 fetchPending 호출
      fetchPending();
    }
  }, [isLoggedIn, fetchPending]); // isLoggedIn과 fetchPending 의존성 추가


  // --- 렌더링 ---
  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center space-y-8">

      {/* --- 라이선스 검증 섹션 (항상 보임) --- */}
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">License Validator</h1>

        <div className="mb-4">
          <label htmlFor="computerId" className="block text-sm font-medium text-gray-600 mb-1">
            Computer ID:
          </label>
          <input
            type="text"
            id="computerId"
            value={computerId}
            onChange={(e) => setComputerId(e.target.value)}
            placeholder="Enter Computer ID to validate"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleValidate}
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
        >
          Validate
        </button>

        {validationResult && (
          <div className={`mt-4 p-3 rounded-md text-center ${validationResult.error ? 'bg-red-100 text-red-700' : validationResult.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {validationResult.error ? (
              <p>Error: {validationResult.error}</p>
            ) : (
              <p>Status: <span className="font-semibold">{validationResult.status}</span></p>
            )}
          </div>
        )}
      </div>

      {/* --- 관리자 섹션 --- */}
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Admin Panel</h2>

        {!isLoggedIn ? (
          // --- 관리자 로그인 폼 ---
          <form onSubmit={handleAdminLogin}>
            <div className="mb-4">
              <label htmlFor="adminUser" className="block text-sm font-medium text-gray-600 mb-1">Username:</label>
              <input
                type="text"
                id="adminUser"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                autoComplete="username" // 자동 완성 추가
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="adminPass" className="block text-sm font-medium text-gray-600 mb-1">Password:</label>
              <input
                type="password"
                id="adminPass"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                autoComplete="current-password" // 자동 완성 추가
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {loginError && (
              <p className="text-red-600 text-sm mb-4 text-center">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Admin Login
            </button>
          </form>
        ) : (
          // --- 관리자 기능 UI (로그인 시 보임) ---
          <div>
            <div className="flex justify-between items-center mb-4">
              {/* 로그인된 사용자 이름 표시는 JWT 페이로드에 사용자 정보가 있다면 가능 */}
              <p className="text-green-600 font-semibold">Admin Logged In</p>
              <button
                onClick={handleAdminLogout}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Logout
              </button>
            </div>

            <h3 className="text-xl font-bold mb-4 text-gray-700">Pending Requests</h3>
            {adminActionError && (
              <p className="text-red-600 text-sm mb-4 text-center">{adminActionError}</p>
            )}
            {pending.length > 0 ? (
              <ul className="space-y-3">
                {pending.map((item) => ( // item.id 를 key로 사용
                  <li
                    key={item.id}
                    className="p-3 bg-gray-50 rounded border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center"
                  >
                    <div className="mb-2 sm:mb-0">
                      <span className="font-medium text-gray-800 block">ID: {item.id}</span>
                      <span className="text-gray-600 block">Computer ID: {item.computer_id}</span>
                      <span className="text-xs text-gray-500 block">Requested: {new Date(item.request_timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAction(item.id, 'Approve')}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'Reject')}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">No pending requests.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
