// 날짜 포맷 함수
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  } catch (error) {
    console.error("날짜 포맷 오류:", dateString, error);
    return dateString;
  }
}

// 상태 값 한국어 변환 맵
const statusMap = {
  'Approved': '승인됨',
  'Rejected': '거절됨',
  'Pending': '대기중',
  'Not Found': '찾을 수 없음'
};

// 상태 값 한국어 변환 함수
export function translateStatus(status) {
  return statusMap[status] || status;
}
