import React, { useState } from 'react';
import { validateComputer } from '../services/api'; // API 서비스 임포트
import { translateStatus } from '../utils/helpers'; // 헬퍼 함수 임포트

function ValidationPracticeForm() {
  const [computerId, setComputerId] = useState(''); // 상태 확인용
  const [validationResult, setValidationResult] = useState(null);

  const handleValidate = async (e) => {
     e.preventDefault();
    if (!computerId) {
      setValidationResult({ error: '확인할 컴퓨터 ID를 입력해주세요.' });
      return;
    }
    setValidationResult(null);
    try {
      const data = await validateComputer(computerId);
      setValidationResult({ status: translateStatus(data.status) });
    } catch (error) {
      console.error("상태 확인 오류:", error);
      if (error.response && error.response.status === 404) {
        setValidationResult({ status: translateStatus('Not Found') });
      } else {
        setValidationResult({ error: '상태 확인 중 오류가 발생했습니다.' });
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">상태 확인 (연습용)</h3>
       <form onSubmit={handleValidate}>
          <div className="mb-4">
            <label htmlFor="checkComputerId" className="block text-sm font-medium text-gray-600 mb-1">
              컴퓨터 ID:
            </label>
            <input
              type="text"
              id="checkComputerId"
              value={computerId}
              onChange={(e) => setComputerId(e.target.value)}
              placeholder="확인할 컴퓨터 ID 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            상태 확인
          </button>
          {validationResult && (
            <div className={`mt-4 p-2 rounded-md text-sm text-center ${validationResult.error ? 'bg-red-100 text-red-700' : validationResult.status === '승인됨' ? 'bg-green-100 text-green-700' : validationResult.status === '거절됨' ? 'bg-red-100 text-red-700' : validationResult.status === '대기중' ? 'bg-yellow-100 text-yellow-700' : validationResult.status === '찾을 수 없음' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
              {validationResult.error ? `오류: ${validationResult.error}` : `상태: ${validationResult.status}`}
            </div>
          )}
       </form>
    </div>
  );
}

export default ValidationPracticeForm;
