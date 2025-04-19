import React, { useState } from 'react';
import { registerComputer } from '../services/api'; // API 서비스 임포트

function RegistrationPracticeForm() {
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
         // 200 OK 이면서 message가 있는 경우 (이미 등록됨)
         setRegistrationResult({ success: error.response.data.message });
      } else {
        setRegistrationResult({ error: '등록 요청 중 오류가 발생했습니다.' });
      }
    }
  };

  return (
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
  );
}

export default RegistrationPracticeForm;
