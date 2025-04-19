import React from 'react';

function Statistics({ stats }) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-lg font-semibold mb-2 text-gray-700">통계</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div><span className="block text-xs text-gray-500">총 사용자</span><span className="text-xl font-bold text-gray-800">{stats.total}</span></div>
        <div><span className="block text-xs text-gray-500">대기중</span><span className="text-xl font-bold text-yellow-600">{stats.pending}</span></div>
        <div><span className="block text-xs text-gray-500">승인됨</span><span className="text-xl font-bold text-green-600">{stats.approved}</span></div>
        <div><span className="block text-xs text-gray-500">거절됨</span><span className="text-xl font-bold text-red-600">{stats.rejected}</span></div>
      </div>
    </div>
  );
}

export default Statistics;
