import React, { useState, useCallback, useEffect } from 'react';
import { useSocket } from './hooks/useSocket'; // 웹소켓 훅 임포트
import { getAllUsers } from './services/api'; // API 서비스 임포트
import LandingIntro from './components/LandingIntro';
import PracticeForms from './components/PracticeForms';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

function App() {
  // --- 상태 관리 ---
  const [allUsers, setAllUsers] = useState([]); // 전체 사용자 목록
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!accessToken);
  const [adminActionError, setAdminActionError] = useState(''); // 웹소켓/API 오류 메시지

  // --- 콜백 함수 ---
  const handleAdminLogout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setAllUsers([]);
    setAdminActionError('');
    // 웹소켓 연결 해제는 useSocket 훅 내부에서 처리됨
  }, []);

  const fetchAllUsersCallback = useCallback(async () => {
    // fetchAllUsers 함수를 useCallback으로 감싸서 useSocket 훅에 전달
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) return;
    setAdminActionError('');
    try {
      console.log("Fetching all users via callback...");
      const data = await getAllUsers(); // 분리된 API 함수 사용
      setAllUsers(data);
    } catch (error) {
      console.error("전체 사용자 목록 가져오기 오류 (Callback):", error);
      setAllUsers([]);
      if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        setAdminActionError('인증 실패 또는 토큰 만료. 다시 로그인해주세요.');
        handleAdminLogout();
      } else {
        setAdminActionError('사용자 목록을 가져오는데 실패했습니다.');
      }
    }
  }, [handleAdminLogout]); // accessToken 의존성 제거

  // 로그인 성공 시 처리
  const handleLoginSuccess = (token) => {
    setAccessToken(token);
    localStorage.setItem('accessToken', token);
    setIsLoggedIn(true);
    setAdminActionError(''); // 로그인 성공 시 오류 초기화
  };

  // 로그인 실패 시 처리 (AdminLogin 컴포넌트 내부에서도 처리하지만, App 레벨에서도 필요시 처리)
  const handleLoginError = (errorMessage) => {
    // App 레벨에서 추가적인 오류 처리 로직 (예: 알림 표시)
    console.error("Login Error received in App:", errorMessage);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
  };

  // 웹소켓 연결 오류 시 처리
  const handleSocketError = (errorMessage) => {
    setAdminActionError(errorMessage);
    // 필요시 여기서 로그아웃 처리 등 추가 가능
    // if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
    //    handleAdminLogout();
    // }
  };

  // --- 웹소켓 훅 사용 ---
  useSocket(isLoggedIn, accessToken, fetchAllUsersCallback, handleSocketError);

  // --- 초기 사용자 목록 로드 (로그인 상태 복원 시) ---
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      console.log("Initial fetch of users on component mount/login restore.");
      fetchAllUsersCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, accessToken]); // fetchAllUsersCallback은 useCallback으로 메모이즈되어 의존성 불필요


  // --- 렌더링 ---
  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center space-y-8">
      {/* 랜딩 페이지 소개 (로그아웃 시에만 보이도록 조건 추가 가능) */}
      {!isLoggedIn && <LandingIntro />}

      {/* 연습용 폼 (항상 표시) */}
      <PracticeForms />

      {/* 관리자 섹션 */}
      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">관리자 패널</h2>
        {!isLoggedIn ? (
          <AdminLogin onLoginSuccess={handleLoginSuccess} onLoginError={handleLoginError} />
        ) : (
          <AdminPanel
            users={allUsers}
            onLogout={handleAdminLogout}
            adminActionError={adminActionError}
            setAdminActionError={setAdminActionError} // 오류 메시지 설정 함수 전달
            handleAdminLogout={handleAdminLogout} // 로그아웃 함수 전달 (API 오류 시 호출용)
          />
        )}
      </div>
    </div>
  );
}

export default App; // 기본 export 추가
