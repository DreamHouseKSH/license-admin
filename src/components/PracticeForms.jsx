import React, { useState } from 'react';
import { registerComputer, validateComputer } from '../services/api'; // API 서비스 임포트
import { translateStatus } from '../utils/helpers'; // 헬퍼 함수 임포트

function PracticeForms() {
  const [computerId, setComputerId] = useState(''); // 상태 확인용
  const [validationResult, setValidationResult] = useState(null);
  const [registerComputerId, setRegisterComputerId] = useState(''); // 등록 요청용
  const [registrationResult, setRegistrationResult] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerComputerId) {
      setRegistrationResult({ error: '등록할 컴퓨터 ID를 입력해주세요.' });
      return;
    }
    setRegistrationResult(null);
    try {
      const data = await registerComputer(registerComputerId);
      setRegistrationResult({ success: data.message });
      setRegisterComputerId('');
    } catch (error) {
      console.error("등록 요청 오류:", error);
      if (error.response && error.response.data && error.response.data.error) {
         setRegistrationResult({ error: error.response.data.error });
      } else if (error.response && error.response.data && error.response.data.message) {
         setRegistrationResult({ success: error.response.data.message });
      } else {
        setRegistrationResult({ error: '등록 요청 중 오류가 발생했습니다.' });
      }
    }
  };

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
    <div className="w-full max-w-md grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {/* 연습용 등록 요청 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">등록 요청 (연습용)</h3>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label htmlFor="registerComputerId" className="block text-sm font-medium text-gray-600 mb-1">
              컴퓨터 ID:
            </label>
            <input
              type="text"
              id="registerComputerId"
              value={registerComputerId}
              onChange={(e) => setRegisterComputerId(e.target.value)}
              placeholder="등록할 컴퓨터 ID 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            요청
          </button>
          {registrationResult && (
            <div className={`mt-4 p-2 rounded-md text-sm text-center ${registrationResult.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {registrationResult.error ? `오류: ${registrationResult.error}` : registrationResult.success}
            </div>
          )}
        </form>
      </div>

      {/* 연습용 상태 확인 */}
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
    </div>
  );
}

export default PracticeForms;
