import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// 백엔드 API 주소 - .env 파일 또는 환경 변수에서 가져옵니다.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // 기본값 설정 (개발용)

// 날짜 포맷 함수 (간단 예시)
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

export default function App() {
  // --- 상태 관리 ---
  const [allUsers, setAllUsers] = useState([]); // 관리자: 전체 사용자 목록
  const [computerId, setComputerId] = useState(''); // 검증용 Computer ID 입력
  const [validationResult, setValidationResult] = useState(null); // 검증 결과
  const [registerComputerId, setRegisterComputerId] = useState(''); // 등록 요청용 Computer ID 입력
  const [registrationResult, setRegistrationResult] = useState(null); // 등록 요청 결과

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
      console.log("Fetching all users..."); // SSE 디버깅용 로그
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAllUsers(res.data || []);
    } catch (error) {
      console.error("전체 사용자 목록 가져오기 오류:", error);
      setAllUsers([]);
      if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('인증 실패 또는 토큰 만료. 다시 로그인해주세요.');
        handleAdminLogout(); // handleAdminLogout을 직접 호출
      } else {
        setAdminActionError('사용자 목록을 가져오는데 실패했습니다.');
      }
    }
  }, [accessToken]); // handleAdminLogout 의존성 제거

  // 관리자: 요청 처리 (승인/거절)
  const handleAction = async (id, action) => {
    if (!accessToken) return;
    setAdminActionError('');
    try {
      await axios.post(`${API_URL}/admin/action/${id}`,
        { action: action },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      // fetchAllUsers(); // SSE가 업데이트하므로 여기서 호출 제거 가능 (선택 사항)
    } catch (error) {
      console.error(`작업 처리 오류 (${action}, ID: ${id}):`, error);
       if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('인증 실패 또는 토큰 만료. 다시 로그인해주세요.');
        handleAdminLogout(); // handleAdminLogout을 직접 호출
      } else if (error.response && error.response.status === 404) {
         setAdminActionError(`요청 ID ${id}를 찾을 수 없거나 이미 처리되었습니다.`);
      } else {
        setAdminActionError(`요청 ID ${id}에 대한 작업(${action}) 처리에 실패했습니다.`);
      }
    }
  };

  // 관리자: 사용자 삭제
  const handleDelete = async (id) => {
    if (!accessToken) return;
    if (!window.confirm(`사용자 ID ${id}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    setAdminActionError('');
    try {
      await axios.delete(`${API_URL}/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      // fetchAllUsers(); // SSE가 업데이트하므로 여기서 호출 제거 가능 (선택 사항)
    } catch (error) {
      console.error(`사용자 삭제 오류 (ID: ${id}):`, error);
       if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('인증 실패 또는 토큰 만료. 다시 로그인해주세요.');
        handleAdminLogout(); // handleAdminLogout을 직접 호출
      } else if (error.response && error.response.status === 404) {
         setAdminActionError(`사용자 ID ${id}를 찾을 수 없습니다.`);
      } else {
        setAdminActionError(`사용자 ID ${id} 삭제에 실패했습니다.`);
      }
    }
  };

  // 관리자 로그인
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

  // 관리자 로그아웃
  const handleAdminLogout = useCallback(() => { // useCallback으로 감싸기 (useEffect 의존성 문제 방지)
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setAdminUsername('');
    setAdminPassword('');
    setAllUsers([]);
    setLoginError('');
    setAdminActionError('');
  }, []); // 빈 의존성 배열

  // 연습용: 등록 요청
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

  // 연습용: 상태 확인
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
      setValidationResult({ status: res.data.status });
    } catch (error) {
      console.error("상태 확인 오류:", error);
      if (error.response && error.response.status === 404) {
        setValidationResult({ status: 'Not Found' });
      } else {
        setValidationResult({ error: '상태 확인 중 오류가 발생했습니다.' });
      }
    }
  };


  // --- useEffect 훅 ---
  useEffect(() => {
    let eventSource = null; // EventSource 인스턴스 저장 변수

    if (isLoggedIn) {
      // 로그인 시 사용자 목록 즉시 로드
      fetchAllUsers();

      // SSE 연결 설정
      console.log("Connecting to SSE stream..."); // SSE 디버깅용 로그
      // EventSource는 GET 요청만 지원하며, JWT 토큰을 헤더에 직접 넣을 수 없음.
      // 토큰을 쿼리 파라미터로 전달 (백엔드에서 처리 필요) 또는 다른 인증 방식 고려 필요.
      // 여기서는 일단 토큰 없이 연결 시도 (백엔드 /stream 엔드포인트가 인증을 요구하지 않는다고 가정)
      // 또는, 백엔드 /stream 엔드포인트에서 쿠키 기반 인증 등을 사용하도록 수정 필요.
      // **임시 방편: 토큰 없이 연결** (실제 운영 시 보안 강화 필요)
      eventSource = new EventSource(`${API_URL}/stream`);

      // 'update' 타입의 메시지 수신 리스너
      eventSource.addEventListener('update', (event) => {
        console.log("SSE update event received:", event.data); // SSE 디버깅용 로그
        // 메시지 수신 시 사용자 목록 새로고침
        fetchAllUsers();
      });

      // 오류 처리 리스너
      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        // 오류 발생 시 연결을 닫을 수 있음 (필요에 따라 재연결 로직 추가 가능)
        eventSource.close();
        setAdminActionError("실시간 업데이트 연결 오류 발생."); // 사용자에게 알림
      };

    } else {
      // 로그아웃 시 기존 EventSource 연결 닫기
      if (eventSource) {
        console.log("Closing SSE stream..."); // SSE 디버깅용 로그
        eventSource.close();
      }
    }

    // 컴포넌트 언마운트 시 또는 isLoggedIn 변경 시 정리 함수
    return () => {
      if (eventSource) {
        console.log("Closing SSE stream on unmount/logout..."); // SSE 디버깅용 로그
        eventSource.close();
      }
    };
  }, [isLoggedIn, fetchAllUsers, handleAdminLogout]); // handleAdminLogout 추가


  // --- 렌더링 ---
  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center space-y-8">

      {/* --- 랜딩 페이지 내용 --- */}
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">라이선스 관리 시스템</h1>
        {!isLoggedIn && (
          <p className="text-lg text-gray-600 mb-8">
            관리자 로그인을 통해 등록된 라이선스를 확인하고 관리할 수 있습니다.
          </p>
        )}
      </div>

      {/* --- 연습용 기능 섹션 (항상 보임) --- */}
      <div className="w-full max-w-md grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* 연습용 등록 요청 */}
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

          {/* 연습용 상태 확인 */}
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
                  <div className={`mt-4 p-2 rounded-md text-sm text-center ${validationResult.error ? 'bg-red-100 text-red-700' : validationResult.status === 'Approved' ? 'bg-green-100 text-green-700' : validationResult.status === 'Rejected' ? 'bg-red-100 text-red-700' : validationResult.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : validationResult.status === 'Not Found' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                    {validationResult.error ? `오류: ${validationResult.error}` : `상태: ${validationResult.status}`}
                  </div>
                )}
             </form>
          </div>
      </div>


      {/* --- 관리자 섹션 (로그인 폼 또는 관리 패널) --- */}
      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">관리자 패널</h2>

        {!isLoggedIn ? (
          // --- 관리자 로그인 폼 ---
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
          // --- 관리자 기능 UI (로그인 시 보임) ---
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
