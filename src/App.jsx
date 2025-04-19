import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 날짜 포맷 함수
function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  } catch (error) {
    console.error("날짜 포맷 오류:", dateString, error);
    return dateString;
  }
}

// 상태 값 한국어 변환 함수
function translateStatus(status) {
  switch (status) {
    case 'Approved':
      return '승인됨';
    case 'Rejected':
      return '거절됨';
    case 'Pending':
      return '대기중';
    case 'Not Found':
      return '찾을 수 없음';
    default:
      return status; // 알 수 없는 상태는 그대로 표시
  }
}

export default function App() {
  const [allUsers, setAllUsers] = useState([]);
  const [computerId, setComputerId] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [registerComputerId, setRegisterComputerId] = useState('');
  const [registrationResult, setRegistrationResult] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!accessToken);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminActionError, setAdminActionError] = useState('');
  const socketRef = useRef(null);

  const handleAdminLogout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setAdminUsername('');
    setAdminPassword('');
    setAllUsers([]);
    setLoginError('');
    setAdminActionError('');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      console.log("WebSocket disconnected on logout.");
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) {
        console.log("fetchAllUsers: No access token found, aborting.");
        return;
    }
    setAdminActionError('');
    try {
      console.log("Fetching all users...");
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setAllUsers(res.data || []);
    } catch (error) {
      console.error("전체 사용자 목록 가져오기 오류:", error);
      setAllUsers([]);
      if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('인증 실패 또는 토큰 만료. 다시 로그인해주세요.');
        handleAdminLogout();
      } else {
        setAdminActionError('사용자 목록을 가져오는데 실패했습니다.');
      }
    }
  }, [handleAdminLogout]);

  const handleAction = async (id, action) => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) return;
    setAdminActionError('');
    try {
      await axios.post(`${API_URL}/admin/action/${id}`,
        { action: action },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
    } catch (error) {
      console.error(`작업 처리 오류 (${action}, ID: ${id}):`, error);
       if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('인증 실패 또는 토큰 만료. 다시 로그인해주세요.');
        handleAdminLogout();
      } else if (error.response && error.response.status === 404) {
         setAdminActionError(`요청 ID ${id}를 찾을 수 없거나 이미 처리되었습니다.`);
      } else {
        setAdminActionError(`요청 ID ${id}에 대한 작업(${action}) 처리에 실패했습니다.`);
      }
    }
  };

  const handleDelete = async (id) => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) return;
    if (!window.confirm(`사용자 ID ${id}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    setAdminActionError('');
    try {
      await axios.delete(`${API_URL}/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
    } catch (error) {
      console.error(`사용자 삭제 오류 (ID: ${id}):`, error);
       if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('인증 실패 또는 토큰 만료. 다시 로그인해주세요.');
        handleAdminLogout();
      } else if (error.response && error.response.status === 404) {
         setAdminActionError(`사용자 ID ${id}를 찾을 수 없습니다.`);
      } else {
        setAdminActionError(`사용자 ID ${id} 삭제에 실패했습니다.`);
      }
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await axios.post(`${API_URL}/admin/login`, {
        username: adminUsername,
        password: adminPassword,
      });
      const token = res.data.accessToken;
      if (token) {
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        setIsLoggedIn(true);
        setAdminPassword('');
      } else {
         console.error("Login successful, but no access token received in response.");
         setLoginError('로그인 응답 오류.');
         setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("관리자 로그인 실패:", error);
      if (error.response && error.response.status === 401) {
        setLoginError('잘못된 사용자 이름 또는 비밀번호입니다.');
      } else {
        setLoginError('로그인 실패. 서버에 연결할 수 없거나 다른 오류가 발생했습니다.');
      }
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      setIsLoggedIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerComputerId) {
      setRegistrationResult({ error: '등록할 컴퓨터 ID를 입력해주세요.' });
      return;
    }
    setRegistrationResult(null);
    try {
      const res = await axios.post(`${API_URL}/register`, {
        computer_id: registerComputerId,
      });
      setRegistrationResult({ success: res.data.message });
      setRegisterComputerId('');
    } catch (error) {
      console.error("등록 요청 오류:", error);
      if (error.response && error.response.data && error.response.data.error) {
         setRegistrationResult({ error: error.response.data.error });
      } else if (error.response && error.response.data && error.response.data.message) {
         setRegistrationResult({ success: error.response.data.message });
      }
      else {
        setRegistrationResult({ error: '등록 요청 중 오류가 발생했습니다.' });
      }
    }
  };

  const handleValidate = async (e) => {
     e.preventDefault();
    if (!computerId) {
      setValidationResult({ error: '확인할 컴퓨터 ID를 입력해주세요.' });
      return;
    }
    setValidationResult(null);
    try {
      const res = await axios.post(`${API_URL}/validate`, {
        computer_id: computerId,
      });
      // 상태 값 변환 적용
      setValidationResult({ status: translateStatus(res.data.status) });
    } catch (error) {
      console.error("상태 확인 오류:", error);
      if (error.response && error.response.status === 404) {
        setValidationResult({ status: translateStatus('Not Found') }); // '찾을 수 없음'
      } else {
        setValidationResult({ error: '상태 확인 중 오류가 발생했습니다.' });
      }
    }
  };


  // --- useEffect 훅 ---
  useEffect(() => {
    console.log(`useEffect 1 (isLoggedIn) triggered: isLoggedIn=${isLoggedIn}`);

    if (isLoggedIn) {
      fetchAllUsers();

      console.log("Connecting to WebSocket...");
      const currentToken = localStorage.getItem('accessToken');
      if (!currentToken) {
          console.error("Cannot connect to WebSocket: No access token found.");
          handleAdminLogout();
          return;
      }

      socketRef.current = io(API_URL, {
        auth: {
          token: currentToken
        },
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket connected:', socketRef.current.id);
        setAdminActionError('');
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err.message);
        setAdminActionError(`실시간 연결 오류: ${err.message}`);
        if (err.message.includes('Unauthorized') || err.message.includes('401')) {
           handleAdminLogout();
        }
      });

      socketRef.current.on('update_user_list', (data) => {
        console.log('WebSocket update_user_list event received:', data);
        fetchAllUsers();
      });

    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

    return () => {
      console.log("Cleaning up WebSocket connection (useEffect 1)...");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isLoggedIn, fetchAllUsers, handleAdminLogout]);


  useEffect(() => {
    console.log(`useEffect 2 (accessToken) triggered: accessToken=${!!accessToken}`);
    if (isLoggedIn && accessToken && allUsers.length === 0) {
        console.log("accessToken changed, attempting to fetch users again...");
        fetchAllUsers();
    }
  }, [accessToken, isLoggedIn, fetchAllUsers, allUsers.length]);


  // --- 렌더링 ---
   return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center space-y-8">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">라이선스 관리 시스템</h1>
        {!isLoggedIn && (
          <p className="text-lg text-gray-600 mb-8">
            관리자 로그인을 통해 등록된 라이선스를 확인하고 관리할 수 있습니다.
          </p>
        )}
      </div>
      <div className="w-full max-w-md grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">등록 요청 (연습용)</h3>
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label htmlFor="registerComputerId" className="block text-sm font-medium text-gray-600 mb-1">
                  컴퓨터 ID:
                </label>
                <input
                  type="text"
                  id="registerComputerId"
                  value={registerComputerId}
                  onChange={(e) => setRegisterComputerId(e.target.value)}
                  placeholder="등록할 컴퓨터 ID 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                요청
              </button>
              {registrationResult && (
                <div className={`mt-4 p-2 rounded-md text-sm text-center ${registrationResult.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {registrationResult.error ? `오류: ${registrationResult.error}` : registrationResult.success}
                </div>
              )}
            </form>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">상태 확인 (연습용)</h3>
             <form onSubmit={handleValidate}>
                <div className="mb-4">
                  <label htmlFor="checkComputerId" className="block text-sm font-medium text-gray-600 mb-1">
                    컴퓨터 ID:
                  </label>
                  <input
                    type="text"
                    id="checkComputerId"
                    value={computerId}
                    onChange={(e) => setComputerId(e.target.value)}
                    placeholder="확인할 컴퓨터 ID 입력"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  상태 확인
                </button>
                {validationResult && (
                  // 상태 값 한국어 변환 적용
                  <div className={`mt-4 p-2 rounded-md text-sm text-center ${validationResult.error ? 'bg-red-100 text-red-700' : validationResult.status === '승인됨' ? 'bg-green-100 text-green-700' : validationResult.status === '거절됨' ? 'bg-red-100 text-red-700' : validationResult.status === '대기중' ? 'bg-yellow-100 text-yellow-700' : validationResult.status === '찾을 수 없음' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                    {validationResult.error ? `오류: ${validationResult.error}` : `상태: ${validationResult.status}`}
                  </div>
                )}
             </form>
          </div>
      </div>
      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">관리자 패널</h2>
        {!isLoggedIn ? (
          <form onSubmit={handleAdminLogin} className="max-w-sm mx-auto">
             <div className="mb-4">
              <label htmlFor="adminUser" className="block text-sm font-medium text-gray-600 mb-1">사용자 이름:</label>
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
              <label htmlFor="adminPass" className="block text-sm font-medium text-gray-600 mb-1">비밀번호:</label>
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
              관리자 로그인
            </button>
          </form>
        ) : (
          <div>
             <div className="flex justify-between items-center mb-6">
              <p className="text-green-600 font-semibold">관리자 로그인됨</p>
              <button
                onClick={handleAdminLogout}
                className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                로그아웃
              </button>
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-700">등록된 사용자</h3>
            {adminActionError && (
              <p className="text-red-600 text-sm mb-4 text-center">{adminActionError}</p>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">컴퓨터 ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청 시간</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인/거절 시간</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
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
                          {/* 상태 값 한국어 변환 적용 */}
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            user.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {translateStatus(user.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.request_timestamp)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.approval_timestamp)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{user.notes || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                          {user.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleAction(user.id, 'Approve')}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="승인"
                              >
                                승인
                              </button>
                              <button
                                onClick={() => handleAction(user.id, 'Reject')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="거절"
                              >
                                거절
                              </button>
                            </>
                          )}
                           <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">사용자를 찾을 수 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
