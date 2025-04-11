import React, { useEffect, useState } from 'react';
import axios from 'axios';

// 백엔드 API 주소 - .env 파일 또는 환경 변수에서 가져옵니다.
// 예: VITE_API_URL=http://LicMngServer.dahangis.co.kr
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // 기본값 설정 (개발용)

export default function App() {
  const [pending, setPending] = useState([]);
  const [computerId, setComputerId] = useState(''); // Computer ID 입력 상태
  const [validationResult, setValidationResult] = useState(null); // 검증 결과 상태

  const fetchPending = async () => {
    // 관리자 기능은 현재 백엔드 API(/admin/requests)와 맞지 않아 주석 처리 또는 수정 필요
    // 여기서는 validate 기능만 구현합니다.
    /*
    try {
      // 백엔드의 /admin/requests 엔드포인트와 Basic Auth 필요
      // const res = await axios.get(`${API_URL}/admin/requests`, { auth: { username: 'admin', password: 'password' } });
      // setPending(res.data || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setPending([]); // 오류 발생 시 빈 배열로 설정
    }
    */
  };

  const handleAction = async (id, action) => {
    // 관리자 기능은 현재 백엔드 API(/admin/action/<id>)와 맞지 않아 주석 처리 또는 수정 필요
    /*
    try {
      // 백엔드의 /admin/action/<id> 엔드포인트와 Basic Auth 필요
      // await axios.post(`${API_URL}/admin/action/${id}`, { action: action }, { auth: { username: 'admin', password: 'password' } });
      // fetchPending(); // 목록 새로고침
    } catch (error) {
      console.error(`Error processing action ${action} for ${id}:`, error);
    }
    */
  };

  // Validate 기능 함수
  const handleValidate = async () => {
    if (!computerId) {
      setValidationResult({ error: 'Please enter a Computer ID.' });
      return;
    }
    setValidationResult(null); // 이전 결과 초기화
    try {
      const res = await axios.post(`${API_URL}/validate`, {
        computer_id: computerId,
      });
      setValidationResult({ status: res.data.status });
    } catch (error) {
      console.error("Validation error:", error);
      if (error.response && error.response.status === 404) {
        setValidationResult({ status: 'Not Found' });
      } else {
        setValidationResult({ error: 'An error occurred during validation.' });
      }
    }
  };


  useEffect(() => {
    // fetchPending(); // 관리자 기능은 일단 비활성화
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">License Validator</h1>

        <div className="mb-4">
          <label htmlFor="computerId" className="block text-sm font-medium text-gray-600 mb-1">
            Computer ID:
          </label>
          <input
            type="text"
            id="computerId"
            value={computerId}
            onChange={(e) => setComputerId(e.target.value)}
            placeholder="Enter Computer ID to validate"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleValidate}
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
        >
          Validate
        </button>

        {validationResult && (
          <div className={`mt-4 p-3 rounded-md text-center ${validationResult.error ? 'bg-red-100 text-red-700' : validationResult.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {validationResult.error ? (
              <p>Error: {validationResult.error}</p>
            ) : (
              <p>Status: <span className="font-semibold">{validationResult.status}</span></p>
            )}
          </div>
        )}
      </div>

      {/* 기존 관리자 기능 UI (주석 처리 또는 필요시 복구) */}
      {/*
      <div className="w-full max-w-2xl mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-gray-700">Pending Requests</h2>
        {pending.length > 0 ? (
          <ul className="space-y-3">
            {pending.map((item, idx) => (
              <li
                key={idx} // 백엔드에서 실제 ID를 반환하면 그것을 key로 사용
                className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center"
              >
                <span className="text-gray-800">{item.computer_id || item}</span> // 백엔드 응답 형식에 따라 조정
                <div className="space-x-2">
                  <button
                    onClick={() => handleAction(item.id || item, 'Approve')} // 백엔드 응답 형식에 따라 조정
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id || item, 'Reject')} // 백엔드 응답 형식에 따라 조정
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No pending requests.</p>
        )}
      </div>
      */}
    </div>
  );
}
