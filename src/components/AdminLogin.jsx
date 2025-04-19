import React, { useState } from 'react';
import { loginAdmin } from '../services/api'; // API 서비스 임포트

function AdminLogin({ onLoginSuccess, onLoginError }) {
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState(''); // 컴포넌트 내부 에러 상태

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(''); // 이전 오류 초기화
    try {
      const data = await loginAdmin(adminUsername, adminPassword);
      if (data.accessToken) {
        onLoginSuccess(data.accessToken); // 성공 시 토큰 전달
      } else {
        // API 호출은 성공했으나 토큰이 없는 경우 (이론상 발생하면 안됨)
        console.error("Login successful, but no access token received.");
        setLoginError('로그인 응답 오류.');
        if (onLoginError) onLoginError('로그인 응답 오류.');
      }
    } catch (error) {
      console.error("관리자 로그인 실패:", error);
      let errorMessage = '로그인 실패. 서버에 연결할 수 없거나 다른 오류가 발생했습니다.';
      if (error.response && error.response.status === 401) {
        errorMessage = '잘못된 사용자 이름 또는 비밀번호입니다.';
      }
      setLoginError(errorMessage);
      if (onLoginError) onLoginError(errorMessage); // 상위 컴포넌트로 오류 전달
    }
  };

  return (
    <form onSubmit={handleAdminLoginSubmit} className="max-w-sm mx-auto">
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
  );
}

export default AdminLogin;
