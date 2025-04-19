import React from 'react';

function Header() {
  return (
    <header className="w-full bg-white shadow-md py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        {/* 로고 또는 제목 영역 */}
        <div className="text-xl font-bold text-gray-800">
          License Manager Admin
        </div>

        {/* 메뉴 영역 (추후 사용) */}
        <nav>
          {/* 메뉴 항목들이 여기에 추가될 수 있습니다. */}
          {/* 예: <a href="#" className="text-gray-600 hover:text-gray-800 ml-4">메뉴1</a> */}
        </nav>
      </div>
    </header>
  );
}

export default Header;
