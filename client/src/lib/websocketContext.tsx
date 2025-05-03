import React, { createContext, useContext, useEffect, useState } from 'react';
import useWebSocket from '@/hooks/useWebSocket';

interface WebSocketContextProps {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  registerHandler: (symbol: string, handler: (data: any) => void) => () => void;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
}

const WebSocketContext = createContext<WebSocketContextProps | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize WebSocket connection
  const { 
    isConnected, 
    isConnecting, 
    connectionError,
    connect,
    registerHandler,
    subscribeToSymbol,
    unsubscribeFromSymbol
  } = useWebSocket({
    onOpen: () => {
      console.log('Global WebSocket connection established');
      setIsInitialized(true);
    },
    onClose: () => {
      console.log('Global WebSocket connection closed');
      setIsInitialized(false);
    },
    onError: (error) => {
      console.error('Global WebSocket error:', error);
    },
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  });
  
  // Ensure connection on first mount
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect();
    }
  }, [connect, isConnected, isConnecting]);
  
  // Log connection errors
  useEffect(() => {
    if (connectionError) {
      console.warn('WebSocket connection error:', connectionError);
    }
  }, [connectionError]);
  
  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        isConnecting,
        connectionError,
        registerHandler,
        subscribeToSymbol,
        unsubscribeFromSymbol
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
