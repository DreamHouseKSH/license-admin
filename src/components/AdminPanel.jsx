import React, { useState, useMemo } from 'react';
import Statistics from './Statistics';
import Filters from './Filters';
import UserTable from './UserTable';
import { processRequest, deleteUser } from '../services/api'; // API 서비스 임포트

function AdminPanel({ users, onLogout, adminActionError, setAdminActionError, handleAdminLogout }) {
  // 필터링 상태 관리
  const [statusFilter, setStatusFilter] = useState('Pending'); // 기본값 'Pending'
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // 필터링된 사용자 목록 생성
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (statusFilter !== 'All' && user.status !== statusFilter) {
        return false;
      }
      try {
        const requestDate = new Date(user.request_timestamp);
        if (startDateFilter && requestDate < new Date(startDateFilter)) {
          return false;
        }
        if (endDateFilter) {
            const endDate = new Date(endDateFilter);
            endDate.setHours(23, 59, 59, 999);
            if (requestDate > endDate) {
                return false;
            }
        }
      } catch (e) {
        console.error("날짜 필터링 오류:", e);
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
      <div className="flex justify-between items-center mb-6">
        <p className="text-green-600 font-semibold">관리자 로그인됨</p>
        <button
          onClick={onLogout} // 상위 컴포넌트의 로그아웃 함수 호출
          className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          로그아웃
        </button>
      </div>

      <Statistics stats={statistics} />

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
