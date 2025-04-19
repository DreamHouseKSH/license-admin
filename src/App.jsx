import React, { useState, useCallback, useEffect, useMemo } from 'react'; // useMemo 추가
import { useSocket } from './hooks/useSocket';
import { getAllUsers } from './services/api';
import LandingIntro from './components/LandingIntro';
import PracticeForms from './components/PracticeForms';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer'; // Footer 임포트

function App() {
  // --- 상태 관리 ---
  const [allUsers, setAllUsers] = useState([]);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!accessToken);
  const [adminActionError, setAdminActionError] = useState('');

  // --- 콜백 함수 ---
  const handleAdminLogout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    setAllUsers([]);
    setAdminActionError('');
  }, []);

  const fetchAllUsersCallback = useCallback(async () => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) return;
    setAdminActionError('');
    try {
      console.log("Fetching all users via callback...");
      const data = await getAllUsers();
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
  }, [handleAdminLogout]);

  const handleLoginSuccess = (token) => {
    setAccessToken(token);
    localStorage.setItem('accessToken', token);
    setIsLoggedIn(true);
    setAdminActionError('');
  };

  const handleLoginError = (errorMessage) => {
    console.error("Login Error received in App:", errorMessage);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
  };

  const handleSocketError = (errorMessage) => {
    setAdminActionError(errorMessage);
  };

  // --- 웹소켓 훅 사용 ---
  useSocket(isLoggedIn, accessToken, fetchAllUsersCallback, handleSocketError);

  // --- 초기 사용자 목록 로드 ---
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      console.log("Initial fetch of users on component mount/login restore.");
      fetchAllUsersCallback();
    }
  }, [isLoggedIn, accessToken, fetchAllUsersCallback]); // fetchAllUsersCallback 의존성 추가

  // --- 통계 계산 (Footer로 전달) ---
  const statistics = useMemo(() => {
    const total = allUsers.length;
    const pending = allUsers.filter(u => u.status === 'Pending').length;
    const approved = allUsers.filter(u => u.status === 'Approved').length;
    const rejected = allUsers.filter(u => u.status === 'Rejected').length;
    return { total, pending, approved, rejected };
  }, [allUsers]);


  // --- 렌더링 ---
   return (
    <div className="min-h-screen flex flex-col"> {/* p-6, items-center, space-y-8 제거 */}
      {/* 메인 콘텐츠 영역 (flex-grow 추가) */}
      <div className="flex-grow p-6 bg-gray-100 flex flex-col items-center space-y-8"> {/* 기존 스타일 이 div로 이동 */}
        {/* 랜딩 페이지 소개 */}
        {!isLoggedIn && <LandingIntro />}

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
            setAdminActionError={setAdminActionError}
            handleAdminLogout={handleAdminLogout}
          />
        )}
      </div>

        {/* 연습용 폼 (아래로 이동) */}
        <PracticeForms />
      </div> {/* flex-grow div 닫기 */}

      {/* 푸터 추가 (flex-grow 밖으로 이동) */}
      <Footer stats={statistics} />
    </div>
  );
}

export default App;
