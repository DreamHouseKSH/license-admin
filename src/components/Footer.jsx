import React from 'react';

function Footer({ stats }) {
  return (
    <footer className="w-full max-w-4xl mt-12 py-6 border-t border-gray-300 text-center text-gray-500 text-sm">
      <div className="mb-4">
        <h4 className="text-md font-semibold mb-2 text-gray-600">사용자 통계</h4>
        <div className="flex justify-center gap-6">
          <span>총: <strong className="text-gray-700">{stats.total}</strong></span>
          <span>대기중: <strong className="text-yellow-600">{stats.pending}</strong></span>
          <span>승인됨: <strong className="text-green-600">{stats.approved}</strong></span>
          <span>거절됨: <strong className="text-red-600">{stats.rejected}</strong></span>
        </div>
      </div>
      <p>&copy; {new Date().getFullYear()} License Manager. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
