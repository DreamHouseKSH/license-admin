import React, { useEffect, useState, useCallback, useRef } from 'react'; // useRef 추가
import axios from 'axios';
import { fetchEventSource } from '@microsoft/fetch-event-source'; // 라이브러리 임포트

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
  const [allUsers, setAllUsers] = useState([]);
  const [computerId, setComputerId] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [registerComputerId, setRegisterComputerId] = useState('');
  const [registrationResult, setRegistrationResult] = useState(null);

  // JWT 인증 및 관리자 상태
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!accessToken);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminActionError, setAdminActionError] = useState('');

  // SSE 연결 제어를 위한 AbortController 참조
  const ctrl = useRef(null); // useRef 사용


  // --- API 호출 함수 ---

  // 관리자 로그아웃 (useCallback으로 감싸기)
   const handleAdminLogout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setAdminUsername('');
    setAdminPassword('');
    setAllUsers([]);
    setLoginError('');
    setAdminActionError('');
    // SSE 연결 중단
    if (ctrl.current) {
      ctrl.current.abort();
      ctrl.current = null; // 참조 초기화
      console.log("SSE stream aborted on logout.");
    }
  }, []); // 빈 의존성 배열

  // 관리자: 모든 사용자 목록 가져오기
  const fetchAllUsers = useCallback(async () => {
    if (!accessToken) return;
    setAdminActionError('');
    try {
      console.log("Fetching all users...");
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${accessToken}` }
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
  }, [accessToken, handleAdminLogout]); // handleAdminLogout 의존성 추가

  // 관리자: 요청 처리 (승인/거절)
  const handleAction = async (id, action) => {
    if (!accessToken) return;
    setAdminActionError('');
    try {
      await axios.post(`${API_URL}/admin/action/${id}`,
        { action: action },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      // SSE가 업데이트하므로 여기서 fetchAllUsers 호출 불필요
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
       // SSE가 업데이트하므로 여기서 fetchAllUsers 호출 불필요
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
    // AbortController 인스턴스 생성
    ctrl.current = new AbortController();

    if (isLoggedIn && accessToken) { // accessToken도 확인
      // 로그인 시 사용자 목록 즉시 로드
      fetchAllUsers();

      // SSE 연결 설정 (fetchEventSource 사용)
      console.log("Connecting to SSE stream with fetchEventSource...");
      fetchEventSource(`${API_URL}/stream`, {
        headers: { // 헤더에 Authorization 추가
          'Authorization': `Bearer ${accessToken}`
        },
        signal: ctrl.current.signal, // AbortController의 signal 전달
        onopen(response) {
          if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
            console.log("SSE connection established"); // 연결 성공
            setAdminActionError(''); // 이전 오류 메시지 제거
            return; // 연결 유지
          } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
             console.error("SSE Client-side error:", response.status, response.statusText);
             setAdminActionError("실시간 업데이트 연결 실패 (클라이언트 오류).");
             handleAdminLogout(); // 인증 문제 등으로 간주하고 로그아웃
             throw new Error(`Client error: ${response.status}`); // 에러 발생시켜 onclose 트리거
          } else {
             console.error("SSE Server-side error:", response.status, response.statusText);
             setAdminActionError("실시간 업데이트 연결 실패 (서버 오류).");
             throw new Error(`Server error: ${response.status}`); // 에러 발생시켜 onclose 트리거
          }
        },
        onmessage(event) {
          // 'update' 타입의 이벤트만 처리 (백엔드에서 type='update'로 발행)
          if (event.event === 'update') {
             console.log("SSE update event received:", event.data);
             fetchAllUsers(); // 사용자 목록 새로고침
          } else {
             console.log("SSE message received (other type):", event);
          }
        },
        onerror(err) {
          console.error("SSE Error:", err);
          setAdminActionError("실시간 업데이트 연결 오류 발생.");
          // 라이브러리가 자동으로 재연결 시도할 수 있음. 필요시 여기서 연결 중단.
          // throw err; // 에러를 다시 던져서 연결 중단 및 onclose 호출
        },
        onclose() {
           console.log("SSE connection closed.");
           // 서버가 연결을 닫았거나 에러 발생 시. 필요시 재연결 로직 추가 가능.
           // 단, 로그아웃 시에는 ctrl.current.abort()로 닫히므로 여기서 특별한 처리 불필요.
        }
      });

    } else {
       // 로그아웃 상태이거나 토큰이 없으면 연결 시도 안 함
       if (ctrl.current) {
         ctrl.current.abort(); // 혹시 모를 이전 연결 중단
         ctrl.current = null;
       }
    }

    // 컴포넌트 언마운트 시 또는 isLoggedIn/accessToken 변경 시 정리 함수
    return () => {
      console.log("Cleaning up SSE connection...");
      if (ctrl.current) {
        ctrl.current.abort(); // AbortController를 사용하여 연결 중단
        ctrl.current = null;
      }
    };
  }, [isLoggedIn, accessToken, fetchAllUsers, handleAdminLogout]); // accessToken 의존성 추가


  // --- 렌더링 ---
  // ... (나머지 렌더링 코드는 이전과 동일) ...
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
