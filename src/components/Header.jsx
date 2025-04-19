import React from 'react';

// isLoggedIn과 onLogout props 추가
function Header({ isLoggedIn, onLogout }) {
  return (
    <header className="w-full bg-white shadow-md py-4 px-6">
      {/* container 제거하고 양쪽 끝 정렬 유지 */}
      <div className="flex justify-between items-center">
        {/* 로고 또는 제목 영역 */}
        <div className="text-xl font-bold text-gray-800">
          License Manager Admin
        </div>

        {/* 메뉴 영역 (로그인 상태 표시 및 로그아웃 버튼) */}
        <nav className="flex items-center">
          {isLoggedIn ? (
            <>
              <span className="text-green-600 font-semibold mr-4">관리자 로그인됨</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                로그아웃
              </button>
            </>
          ) : (
            // 로그아웃 상태일 때 표시할 내용 (옵션)
            null
          )}
          {/* 다른 메뉴 항목 추가 가능 */}
        </nav>
      </div>
    </header>
  );
}

export default Header;
