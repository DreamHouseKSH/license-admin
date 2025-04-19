import React from 'react';
import { formatDate, translateStatus } from '../utils/helpers'; // 헬퍼 함수 임포트

function UserTable({ users, onAction, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">컴퓨터 ID</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청 시간</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인/거절 시간</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className={
                user.status === 'Approved' ? 'bg-green-50' :
                user.status === 'Rejected' ? 'bg-red-50' :
                user.status === 'Pending' ? 'bg-yellow-50' : ''
              }>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.computer_id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    user.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                    user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {translateStatus(user.status)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.request_timestamp)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(user.approval_timestamp)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.notes || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                  {user.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => onAction(user.id, 'Approve')} // 상위 컴포넌트의 함수 호출
                        className="text-indigo-600 hover:text-indigo-900"
                        title="승인"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => onAction(user.id, 'Reject')} // 상위 컴포넌트의 함수 호출
                        className="text-yellow-600 hover:text-yellow-900"
                        title="거절"
                      >
                        거절
                      </button>
                    </>
                  )}
                   <button
                    onClick={() => onDelete(user.id)} // 상위 컴포넌트의 함수 호출
                    className="text-red-600 hover:text-red-900"
                    title="삭제"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">조건에 맞는 사용자를 찾을 수 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;
