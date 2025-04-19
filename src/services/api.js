import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Axios 인스턴스 생성 (선택 사항: 기본 URL, 타임아웃 등 설정 가능)
const apiClient = axios.create({
  baseURL: API_URL,
});

// 요청 인터셉터 (선택 사항: 모든 요청에 JWT 토큰 자동 추가)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- API 호출 함수들 ---

// 등록 요청
export const registerComputer = async (computerId) => {
  const response = await apiClient.post('/register', { computer_id: computerId });
  return response.data; // 성공 시 { message: "..." } 반환 예상
};

// 상태 확인
export const validateComputer = async (computerId) => {
  const response = await apiClient.post('/validate', { computer_id: computerId });
  return response.data; // 성공 시 { status: "..." } 반환 예상
};

// 관리자 로그인
export const loginAdmin = async (username, password) => {
  const response = await apiClient.post('/admin/login', { username, password });
  return response.data; // 성공 시 { accessToken: "..." } 반환 예상
};

// 전체 사용자 목록 조회
export const getAllUsers = async () => {
  // 인터셉터가 토큰을 추가하므로 헤더 명시 불필요
  const response = await apiClient.get('/admin/users');
  return response.data || []; // 데이터 없으면 빈 배열 반환
};

// 요청 처리 (승인/거절)
export const processRequest = async (id, action) => {
  const response = await apiClient.post(`/admin/action/${id}`, { action });
  return response.data; // 성공 시 { message: "..." } 반환 예상
};

// 사용자 삭제
export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/admin/user/${id}`);
  return response.data; // 성공 시 { message: "..." } 반환 예상
};

// 기본 apiClient 객체도 export (필요시 직접 사용)
export default apiClient;
