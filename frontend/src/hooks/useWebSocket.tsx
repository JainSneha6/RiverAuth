import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketReturn {
  send: (data: unknown) => void;
  isConnected: boolean;
  lastMessage: string | null;
  error: string | null;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Retrieve user ID from localStorage
  const getUserId = useCallback(() => {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString).id : null;
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const userId = getUserId();
      // Ensure data is an object and add user_id
      console.log(userId)
      const dataWithUserId = {
        ...(typeof data === 'object' && data !== null ? data : {}),
        user_id: userId || 'anonymous', // Fallback to 'anonymous' if no user ID
      };
      wsRef.current.send(JSON.stringify(dataWithUserId));
      console.log('Sent to WebSocket:', dataWithUserId);
    } else {
      console.warn('WebSocket not connected, data dropped:', data);
    }
  }, [getUserId]);

  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to:', url);
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      console.log('Received from WebSocket:', event.data);
      setLastMessage(event.data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [url]);

  return {
    send,
    isConnected,
    lastMessage,
    error
  };
};