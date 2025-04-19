import React from 'react';

function Filters({ statusFilter, setStatusFilter, startDateFilter, setStartDateFilter, endDateFilter, setEndDateFilter }) {
  return (
    // items-end 제거하고 items-center 추가, gap 증가
    <div className="mb-6 flex flex-wrap gap-6 items-center">
      {/* 각 필터 항목을 인라인 블록처럼 배치 */}
      <div className="flex items-center">
        <label htmlFor="statusFilter" className="text-sm font-medium text-gray-600 mr-2">상태:</label> {/* mb-1 제거, mr-2 추가 */}
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-32 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm" // 너비(w-32), 패딩(py-1), 폰트 크기(text-sm) 조정
        >
          <option value="Pending">대기중</option>
          <option value="Approved">승인됨</option>
          <option value="Rejected">거절됨</option>
          <option value="All">전체</option>
          <option value="All">전체</option>
          <option value="All">전체</option>
        </select>
      </div>
      {/* 검색 기간 그룹 */}
      <div className="flex items-center gap-2"> {/* gap-2 추가 */}
        <label className="text-sm font-medium text-gray-600">검색 기간:</label>
        {/* 시작 연/월 */}
        <div className="flex items-center">
          <select
            value={startDateFilter ? startDateFilter.substring(0, 4) : ''}
          onChange={(e) => {
            const year = e.target.value;
            const month = startDateFilter ? startDateFilter.substring(5, 7) : '01'; // 기존 월 유지 또는 1월
            setStartDateFilter(year && month ? `${year}-${month}-01` : ''); // YYYY-MM-01 형식으로 설정
          }}
            className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm mr-1"
          >
            <option value="">년도</option>
          {/* 예시: 최근 5년 + 현재 년도 */}
          {[...Array(5)].map((_, i) => {
            const year = new Date().getFullYear() - i;
            return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          <select
            value={startDateFilter ? startDateFilter.substring(5, 7) : ''}
          onChange={(e) => {
            const month = e.target.value;
            const year = startDateFilter ? startDateFilter.substring(0, 4) : new Date().getFullYear().toString(); // 기존 연도 유지 또는 현재 연도
            setStartDateFilter(year && month ? `${year}-${month}-01` : ''); // YYYY-MM-01 형식으로 설정
          }}
            className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">월</option>
          {[...Array(12)].map((_, i) => {
            const month = String(i + 1).padStart(2, '0');
              return <option key={month} value={month}>{i + 1}월</option>;
            })}
          </select>
        </div>
        <span className="text-gray-500 mx-1">~</span> {/* 구분자 '~' 추가 */}
        {/* 종료 연/월 */}
        <div className="flex items-center">
           <select
            value={endDateFilter ? endDateFilter.substring(0, 4) : ''}
          onChange={(e) => {
            const year = e.target.value;
            const month = endDateFilter ? endDateFilter.substring(5, 7) : '12'; // 기존 월 유지 또는 12월
            // 해당 월의 마지막 날짜 계산
            const lastDay = year && month ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
            setEndDateFilter(year && month ? `${year}-${month}-${String(lastDay).padStart(2, '0')}` : ''); // YYYY-MM-마지막날 형식
          }}
            className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm mr-1"
          >
            <option value="">년도</option>
             {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          <select
            value={endDateFilter ? endDateFilter.substring(5, 7) : ''}
          onChange={(e) => {
            const month = e.target.value;
            const year = endDateFilter ? endDateFilter.substring(0, 4) : new Date().getFullYear().toString(); // 기존 연도 유지 또는 현재 연도
            const lastDay = year && month ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
            setEndDateFilter(year && month ? `${year}-${month}-${String(lastDay).padStart(2, '0')}` : ''); // YYYY-MM-마지막날 형식
          }}
            className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">월</option>
            {[...Array(12)].map((_, i) => {
              const month = String(i + 1).padStart(2, '0');
              return <option key={month} value={month}>{i + 1}월</option>;
            })}
          </select>
        </div>
      </div>
    </div>
  );
}

export default Filters;
