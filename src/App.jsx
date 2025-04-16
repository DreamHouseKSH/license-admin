import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// 백엔드 API 주소 - .env 파일 또는 환경 변수에서 가져옵니다.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // 기본값 설정 (개발용)

// 날짜 포맷 함수 (간단 예시)
function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    // 로케일과 옵션을 사용하여 더 보기 좋게 포맷 가능
    return date.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return dateString; // 오류 시 원본 반환
  }
}

export default function App() {
  // --- 상태 관리 ---
  const [allUsers, setAllUsers] = useState([]); // 전체 사용자 목록 상태 추가
  const [computerId, setComputerId] = useState(''); // Computer ID 입력 상태 (검증용)
  const [validationResult, setValidationResult] = useState(null); // 검증 결과 상태

  // JWT 인증 및 관리자 상태
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!accessToken);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminActionError, setAdminActionError] = useState('');


  // --- API 호출 함수 ---

  // 관리자: 모든 사용자 목록 가져오기
  const fetchAllUsers = useCallback(async () => {
    if (!accessToken) return;
    setAdminActionError('');
    try {
      const res = await axios.get(`${API_URL}/admin/users`, { // 새 API 엔드포인트 사용
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAllUsers(res.data || []);
    } catch (error) {
      console.error("Error fetching all users:", error);
      setAllUsers([]);
      if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('Authentication failed or token expired. Please log in again.');
        handleAdminLogout();
      } else {
        setAdminActionError('Failed to fetch user list.');
      }
    }
  }, [accessToken]); // handleAdminLogout을 의존성 배열에서 제거 (내부에서 호출되므로)

  // 관리자: 요청 처리 (승인/거절) - 기존 함수 유지
  const handleAction = async (id, action) => {
    if (!accessToken) return;
    setAdminActionError('');
    try {
      await axios.post(`${API_URL}/admin/action/${id}`,
        { action: action },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      fetchAllUsers(); // 전체 목록 새로고침으로 변경
    } catch (error) {
      console.error(`Error processing action ${action} for ${id}:`, error);
       if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('Authentication failed or token expired. Please log in again.');
        handleAdminLogout();
      } else if (error.response && error.response.status === 404) {
         setAdminActionError(`Request ${id} not found or already processed.`);
      } else {
        setAdminActionError(`Failed to process action ${action} for request ${id}.`);
      }
    }
  };

  // 관리자: 사용자 삭제 함수 추가
  const handleDelete = async (id) => {
    if (!accessToken) return;
    // 사용자에게 삭제 확인 (선택 사항)
    if (!window.confirm(`Are you sure you want to delete user ID ${id}? This action cannot be undone.`)) {
      return;
    }
    setAdminActionError('');
    try {
      await axios.delete(`${API_URL}/admin/user/${id}`, { // 새 API 엔드포인트 및 DELETE 메서드 사용
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchAllUsers(); // 전체 목록 새로고침
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
       if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('Authentication failed or token expired. Please log in again.');
        handleAdminLogout();
      } else if (error.response && error.response.status === 404) {
         setAdminActionError(`User ${id} not found.`);
      } else {
        setAdminActionError(`Failed to delete user ${id}.`);
      }
    }
  };


  // 관리자 로그인 시도 함수
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await axios.post(`${API_URL}/admin/login`, {
        username: adminUsername,
        password: adminPassword,
      });
      const token = res.data.access_token;
      setAccessToken(token);
      localStorage.setItem('accessToken', token);
      setIsLoggedIn(true);
      setAdminPassword('');
    } catch (error) {
      console.error("Admin login failed:", error);
      if (error.response && error.response.status === 401) {
        setLoginError('Invalid username or password.');
      } else {
        setLoginError('Login failed. Could not connect to the server or other error.');
      }
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      setIsLoggedIn(false);
    }
  };

  // 관리자 로그아웃 함수
  const handleAdminLogout = () => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setAdminUsername('');
    setAdminPassword('');
    setAllUsers([]); // 사용자 목록 초기화
    setLoginError('');
    setAdminActionError('');
  };


  // 공개: Computer ID 검증 (랜딩 페이지에서는 제거하거나 다른 위치로 이동 가능)
  const handleValidate = async () => {
    // 이 기능은 랜딩 페이지 컨셉과 맞지 않을 수 있으므로 주석 처리하거나 필요시 유지
    /*
    if (!computerId) {
      setValidationResult({ error: 'Please enter a Computer ID.' });
      return;
    }
    setValidationResult(null);
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
    */
  };


  // --- useEffect 훅 ---
  // 컴포넌트 마운트 시 또는 로그인 상태 변경 시 사용자 목록 가져오기
  useEffect(() => {
    if (isLoggedIn) {
      fetchAllUsers(); // 전체 사용자 목록 가져오기로 변경
    }
  }, [isLoggedIn, fetchAllUsers]); // fetchAllUsers 의존성 추가


  // --- 렌더링 ---
  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">

      {/* --- 랜딩 페이지 내용 (로그인 안했을 때) --- */}
      {!isLoggedIn && (
        <div className="w-full max-w-2xl text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">라이선스 관리 시스템</h1>
          <p className="text-lg text-gray-600 mb-8">
            관리자 로그인을 통해 등록된 라이선스를 확인하고 관리할 수 있습니다.
          </p>
          {/* 여기에 추가적인 랜딩 페이지 요소 (이미지, 기능 소개 등) 추가 가능 */}
        </div>
      )}

      {/* --- 관리자 섹션 (로그인 폼 또는 관리 패널) --- */}
      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Admin Panel</h2>

        {!isLoggedIn ? (
          // --- 관리자 로그인 폼 ---
          <form onSubmit={handleAdminLogin} className="max-w-sm mx-auto">
            <div className="mb-4">
              <label htmlFor="adminUser" className="block text-sm font-medium text-gray-600 mb-1">Username:</label>
              <input
                type="text"
                id="adminUser"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                autoComplete="username"
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
                autoComplete="current-password"
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
            <div className="flex justify-between items-center mb-6">
              <p className="text-green-600 font-semibold">Admin Logged In</p>
              <button
                onClick={handleAdminLogout}
                className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Logout
              </button>
            </div>

            <h3 className="text-xl font-bold mb-4 text-gray-700">Registered Users</h3>
            {adminActionError && (
              <p className="text-red-600 text-sm mb-4 text-center">{adminActionError}</p>
            )}
            {/* 사용자 목록 테이블 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Computer ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved/Rejected</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.length > 0 ? (
                    allUsers.map((user) => (
                      <tr key={user.id} className={
                        user.status === 'Approved' ? 'bg-green-50' :
                        user.status === 'Rejected' ? 'bg-red-50' :
                        user.status === 'Pending' ? 'bg-yellow-50' : ''
                      }>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.computer_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            user.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.request_timestamp)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.approval_timestamp)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{user.notes || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                          {user.status === 'Pending' && ( // Pending 상태일 때만 승인/거절 표시 (선택 사항)
                            <>
                              <button
                                onClick={() => handleAction(user.id, 'Approve')}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(user.id, 'Reject')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                           {/* 항상 삭제 버튼 표시 */}
                           <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 기존 라이선스 검증 UI (필요시 복구 또는 다른 위치로 이동) */}
      {/*
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md mt-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">License Validator</h1>
         ... (검증 UI 코드) ...
      </div>
       */}
    </div>
  );
}
