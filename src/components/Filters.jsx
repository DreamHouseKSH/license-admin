import React from 'react';

function Filters({ statusFilter, setStatusFilter, startDateFilter, setStartDateFilter, endDateFilter, setEndDateFilter }) {
  return (
    <div className="mb-4 flex flex-wrap gap-4 items-end">
      <div>
        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-600 mb-1">상태 필터:</label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="Pending">대기중</option>
          <option value="Approved">승인됨</option>
          <option value="Rejected">거절됨</option>
          <option value="All">전체</option>
        </select>
      </div>
      <div>
        <label htmlFor="startDateFilter" className="block text-sm font-medium text-gray-600 mb-1">요청 시작일:</label>
        <input
          type="date"
          id="startDateFilter"
          value={startDateFilter}
          onChange={(e) => setStartDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="endDateFilter" className="block text-sm font-medium text-gray-600 mb-1">요청 종료일:</label>
        <input
          type="date"
          id="endDateFilter"
          value={endDateFilter}
          onChange={(e) => setEndDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}

export default Filters;
