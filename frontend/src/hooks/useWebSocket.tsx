import { isNumber } from 'lodash';
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

  const getUserId = useCallback(() => {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString).id : null;
  }, []);

  // Function to retrieve and send pending data from localStorage
  const sendPendingData = useCallback(() => {
    const userId = getUserId();
    if (!userId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return; // Skip if no user_id or WebSocket not connected
    }

    const pendingDataString = localStorage.getItem('pendingWebSocketData');
    if (pendingDataString) {
      try {
        const pendingData = JSON.parse(pendingDataString) as unknown[];
        // Send each pending message with user_id
        pendingData.forEach((data) => {
          const dataWithUserId = {
            ...(typeof data === 'object' && data !== null ? data : {}),
            user_id: userId,
          };
          wsRef.current!.send(JSON.stringify(dataWithUserId));
          console.log('Sent pending data to WebSocket:', dataWithUserId);
        });
        // Clear pending data after sending
        localStorage.removeItem('pendingWebSocketData');
      } catch (err) {
        console.error('Error processing pending WebSocket data:', err);
      }
    }
  }, [getUserId]);

  const send = useCallback(
    (data: unknown) => {
      const userId = getUserId();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && userId) {
        // If user_id exists and WebSocket is connected, send immediately
        const dataWithUserId = {
          ...(typeof data === 'object' && data !== null ? data : {}),
          user_id: userId,
        };
        wsRef.current.send(JSON.stringify(dataWithUserId));
        console.log('Sent to WebSocket:', dataWithUserId);
      } else {
        // If no user_id or WebSocket not connected, store in localStorage
        console.warn('No user_id or WebSocket not connected, storing data:', data);
        const pendingDataString = localStorage.getItem('pendingWebSocketData');
        let pendingData: unknown[] = pendingDataString ? JSON.parse(pendingDataString) : [];
        pendingData.push(data);
        localStorage.setItem('pendingWebSocketData', JSON.stringify(pendingData));
      }
    },
    [getUserId]
  );

  // Monitor localStorage for user_id and send pending data when available
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user' && event.newValue) {
        console.log('User data updated in localStorage, checking for pending data');
        sendPendingData();
      }
    };

    // Listen for storage changes (in case user data is set in another tab/window)
    window.addEventListener('storage', handleStorageChange);

    // Check for user_id on mount or when WebSocket connects
    if (isConnected) {
      sendPendingData();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isConnected, sendPendingData]);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to:', url);
      setIsConnected(true);
      setError(null);
      // Attempt to send pending data when WebSocket connects
      sendPendingData();
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
  }, [url, sendPendingData]);

  return {
    send,
    isConnected,
    lastMessage,
    error,
  };
};