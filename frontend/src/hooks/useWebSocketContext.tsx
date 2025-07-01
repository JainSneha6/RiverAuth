import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket } from './useWebSocket';

interface WebSocketContextType {
  send: (data: unknown) => void;
  isConnected: boolean;
  lastMessage: string | null;
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
  const websocketData = useWebSocket(url);

  return (
    <WebSocketContext.Provider value={websocketData}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
