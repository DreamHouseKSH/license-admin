import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSocket } from './hooks/useSocket';
import { getAllUsers } from './services/api';
import LandingIntro from './components/LandingIntro';
// import PracticeForms from './components/PracticeForms'; // 제거
import RegistrationPracticeForm from './components/RegistrationPracticeForm'; // 추가
import ValidationPracticeForm from './components/ValidationPracticeForm'; // 추가
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import Header from './components/Header'; // Header 임포트
import MonthlyChart from './components/MonthlyChart';

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
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* 메인 콘텐츠 영역 (flex-grow 유지, 내부 flex 비율 적용 위해 space-y-8 제거, items-stretch 추가 고려) */}
      <div className="flex-grow p-6 pb-24 bg-gray-100 flex flex-col items-stretch"> {/* space-y-8 제거, items-stretch 추가 */}
        {/* 랜딩 페이지 소개 (로그아웃 시) */}
        {!isLoggedIn && (
          <div className="flex-grow flex items-center justify-center"> {/* 랜딩/로그인 폼 영역 */}
            <LandingIntro />
          </div>
        )}

        {/* 로그인 폼 (로그아웃 시) */}
        {!isLoggedIn && (
           <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md mx-auto"> {/* 로그인 폼 중앙 배치 */}
             <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">관리자 로그인</h2>
             <AdminLogin onLoginSuccess={handleLoginSuccess} onLoginError={handleLoginError} />
           </div>
        )}

        {/* --- 로그인 상태 레이아웃 --- */}
        {/* 1층: 그래프 섹션 (flex-grow 비율 1) */}
        {isLoggedIn && (
          <div className="w-full bg-white p-4 rounded-lg shadow-md flex-[1]"> {/* flex-grow: 1 (비율 10%) */}
            <MonthlyChart users={allUsers} />
          </div>
        )}

        {/* 2층: 관리자 패널 및 연습 폼 (flex-grow 비율 9) */}
        {isLoggedIn && (
          <div className="w-full flex justify-between items-stretch gap-8 flex-[9] overflow-hidden"> {/* flex-grow: 9 (비율 90%), overflow-hidden 추가 */}
            {/* 왼쪽 연습 폼 (너비 w-1/5) */}
            <div className="flex-shrink-0 w-1/5">
               <RegistrationPracticeForm />
            </div>

            {/* 중앙 관리자 섹션 (너비 w-3/5) */}
            <div className="w-3/5 bg-white p-8 rounded-lg shadow-md flex flex-col"> {/* flex flex-col 추가 */}
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-700 flex-shrink-0">관리자 패널</h2>
              {/* AdminPanel 내용이 남은 공간 채우도록 */}
              <div className="flex-grow overflow-auto"> {/* 내용 스크롤 가능하도록 */}
                 <AdminPanel
                    users={allUsers}
                    onLogout={handleAdminLogout}
                    adminActionError={adminActionError}
                    setAdminActionError={setAdminActionError}
                    handleAdminLogout={handleAdminLogout}
                  />
              </div>
            </div>

            {/* 오른쪽 연습 폼 (너비 w-1/5) */}
            <div className="flex-shrink-0 w-1/5">
              <ValidationPracticeForm />
            </div>
          </div>
        )}
        {/* --- 로그인 상태 레이아웃 끝 --- */}

      </div> {/* flex-grow div 닫기 */}

      {/* 푸터 추가 (flex-grow 밖으로 이동) */}
      <Footer stats={statistics} />
    </div>
    // 불필요한 코드 제거됨
  );
}

export default App;
