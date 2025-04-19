import React, { useState, useMemo } from 'react';
// import Statistics from './Statistics'; // Statistics 컴포넌트 제거
import MonthlyChart from './MonthlyChart'; // MonthlyChart 컴포넌트 임포트
import Filters from './Filters';
import UserTable from './UserTable';
import { processRequest, deleteUser } from '../services/api';

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get the last day of a month
const getLastDayOfMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// onLogout prop 제거
function AdminPanel({ users, /* onLogout, */ adminActionError, setAdminActionError, handleAdminLogout }) {
  // 필터링 상태 관리 및 기본값 설정
  const [statusFilter, setStatusFilter] = useState('Pending');

  const getInitialStartDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3); // 3달 전
    date.setDate(1); // 해당 월의 1일로 설정
    return formatDate(date);
  };

  const getInitialEndDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 현재 월 (1-12)
    const lastDay = getLastDayOfMonth(year, month);
    return formatDate(new Date(year, month - 1, lastDay)); // 현재 월의 마지막 날
  };

  const [startDateFilter, setStartDateFilter] = useState(getInitialStartDate);
  const [endDateFilter, setEndDateFilter] = useState(getInitialEndDate);

  // 필터링된 사용자 목록 생성
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (statusFilter !== 'All' && user.status !== statusFilter) {
        return false;
      }
      // 연/월 기반 필터링 로직으로 변경
      try {
        if (!user.request_timestamp) return false; // 타임스탬프 없으면 필터링 (혹은 다른 처리)

        const requestYearMonth = user.request_timestamp.substring(0, 7); // "YYYY-MM"

        if (startDateFilter) {
          const startFilterYearMonth = startDateFilter.substring(0, 7); // "YYYY-MM"
          if (requestYearMonth < startFilterYearMonth) {
            return false;
          }
        }
        if (endDateFilter) {
          const endFilterYearMonth = endDateFilter.substring(0, 7); // "YYYY-MM"
          if (requestYearMonth > endFilterYearMonth) {
            return false;
          }
        }
      } catch (e) {
        console.error("연/월 필터링 오류:", e);
      }
      return true;
    });
  }, [users, statusFilter, startDateFilter, endDateFilter]);

  // 통계 계산
  const statistics = useMemo(() => {
    const total = users.length;
    const pending = users.filter(u => u.status === 'Pending').length;
    const approved = users.filter(u => u.status === 'Approved').length;
    const rejected = users.filter(u => u.status === 'Rejected').length;
    return { total, pending, approved, rejected };
  }, [users]);

  // 액션 핸들러 (API 호출)
  const handleActionClick = async (id, action) => {
    setAdminActionError(''); // 이전 오류 초기화
    try {
      await processRequest(id, action);
      // 성공 시 웹소켓이 목록을 업데이트하므로 별도 처리 불필요
    } catch (error) {
      // API 서비스에서 오류 처리 및 로그아웃 로직이 있으므로 여기서는 상태만 업데이트
      if (error.response && error.response.data && error.response.data.message) {
        setAdminActionError(error.response.data.message);
      } else if (error.response && error.response.data && error.response.data.error) {
         setAdminActionError(error.response.data.error);
      } else {
        setAdminActionError(`작업(${action}) 처리 중 오류 발생`);
      }
       // 인증 오류 시 handleAdminLogout은 api.js 또는 useSocket 훅에서 호출됨
    }
  };

  // 삭제 핸들러 (API 호출)
  const handleDeleteClick = async (id) => {
     if (!window.confirm(`사용자 ID ${id}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    setAdminActionError('');
    try {
      await deleteUser(id);
      // 성공 시 웹소켓이 목록을 업데이트하므로 별도 처리 불필요
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setAdminActionError(error.response.data.message);
      } else if (error.response && error.response.data && error.response.data.error) {
         setAdminActionError(error.response.data.error);
      } else {
        setAdminActionError(`사용자 ID ${id} 삭제 중 오류 발생`);
      }
      // 인증 오류 시 handleAdminLogout은 api.js 또는 useSocket 훅에서 호출됨
    }
  };


  return (
    <div>
      {/* 로그인 상태 표시 및 로그아웃 버튼 제거됨 */}

      {/* MonthlyChart 제거됨 */}

      <Filters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        startDateFilter={startDateFilter}
        setStartDateFilter={setStartDateFilter}
        endDateFilter={endDateFilter}
        setEndDateFilter={setEndDateFilter}
      />

      <h3 className="text-xl font-bold mb-4 text-gray-700">등록된 사용자 (필터링됨: {filteredUsers.length} / 총: {users.length})</h3>
      {adminActionError && (
        <p className="text-red-600 text-sm mb-4 text-center">{adminActionError}</p>
      )}
      <UserTable
        users={filteredUsers}
        onAction={handleActionClick}
        onDelete={handleDeleteClick}
      />
    </div>
  );
}

export default AdminPanel;
