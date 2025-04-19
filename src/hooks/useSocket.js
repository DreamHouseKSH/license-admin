import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useSocket(isLoggedIn, accessToken, onUserListUpdate, onConnectError) {
  const socketRef = useRef(null);

  // 연결 해제 함수 (useCallback 사용)
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log("Disconnecting WebSocket...");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      // 이미 연결되어 있으면 중복 연결 방지
      if (socketRef.current) return;

      console.log("Connecting to WebSocket...");
      socketRef.current = io(API_URL, {
        auth: {
          token: accessToken
        },
        // 재연결 시도 비활성화 (선택 사항)
        // reconnection: false,
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket connected:', socketRef.current.id);
        if (onConnectError) onConnectError(''); // 연결 성공 시 오류 메시지 초기화
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        // 필요시 여기서 추가 처리
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err.message);
        if (onConnectError) onConnectError(`실시간 연결 오류: ${err.message}`);
        // 인증 오류 시 로그아웃 처리 등은 App.jsx에서 handleAdminLogout 호출로 처리
      });

      // 'update_user_list' 이벤트 수신
      socketRef.current.on('update_user_list', (data) => {
        console.log('WebSocket update_user_list event received:', data);
        if (onUserListUpdate) {
          onUserListUpdate(); // 콜백 함수 호출하여 목록 새로고침
        }
      });

    } else {
      // 로그아웃 상태이거나 토큰 없으면 연결 해제
      disconnectSocket();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log("Cleaning up WebSocket connection (useSocket)...");
      disconnectSocket();
    };
  }, [isLoggedIn, accessToken, onUserListUpdate, onConnectError, disconnectSocket]); // 의존성 배열 업데이트

  // 연결 해제 함수 반환 (필요시 외부에서 사용)
  return { disconnectSocket };
}
