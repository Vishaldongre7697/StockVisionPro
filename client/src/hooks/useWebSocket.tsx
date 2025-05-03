import { useState, useEffect, useCallback, useRef } from 'react';

type MessageHandler = (data: any) => void;

interface UseWebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export default function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onOpen,
    onClose,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageHandlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }
    
    if (isConnecting) {
      return; // Already connecting
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Get the base URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      
      // For Replit environment, use the current host with /ws path
      // Also handle potential subdomain hosts in Replit
      const wsUrl = `${protocol}//${host}/ws`;
      
      // Set a longer timeout for connection
      const connectionTimeout = setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket connection timeout, closing socket');
          socketRef.current?.close();
        }
      }, 10000);
      
      // Log the connection attempt
      console.log(`Attempting WebSocket connection to: ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connection established');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        
        // Send a ping immediately to test the connection
        socket.send(JSON.stringify({ type: 'ping' }));
        
        if (onOpen) onOpen();
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setIsConnecting(false);
        if (onClose) onClose();
        
        // Attempt to reconnect if not at max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`Reconnecting (attempt ${reconnectAttemptsRef.current} of ${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setConnectionError('Maximum reconnect attempts reached. Please refresh the page.');
        }
      };
      
      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionError('WebSocket connection error. Please try again later.');
        if (onError) onError(event);
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);
          
          if (message.type === 'heartbeat') {
            console.log('Received heartbeat from server');
            // Send ping to keep connection alive
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'ping' }));
            }
          } else if (message.type === 'pong') {
            console.log('Received pong from server');
          } else if (message.type === 'stock_update' && message.symbol) {
            // Handle stock updates
            handleTypedMessage(message);
          } else {
            console.log('Received unhandled WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnecting(false);
      setConnectionError('Failed to establish WebSocket connection');
    }
  }, [isConnecting, maxReconnectAttempts, onClose, onError, onOpen, reconnectInterval]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);
  
  // Subscribe to a stock symbol
  const subscribeToSymbol = useCallback((symbol: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Will subscribe when connected.');
      connect(); // Attempt to connect if not already
      return;
    }
    
    socketRef.current.send(JSON.stringify({
      type: 'subscribe',
      symbol
    }));
  }, [connect]);
  
  // Unsubscribe from a stock symbol
  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    socketRef.current.send(JSON.stringify({
      type: 'unsubscribe',
      symbol
    }));
  }, []);
  
  // Register a handler for a specific message type and symbol
  const registerHandler = useCallback((symbol: string, handler: MessageHandler) => {
    if (!messageHandlersRef.current.has(symbol)) {
      messageHandlersRef.current.set(symbol, new Set());
      // Subscribe to this symbol
      subscribeToSymbol(symbol);
    }
    
    const handlers = messageHandlersRef.current.get(symbol);
    handlers?.add(handler);
    
    // Return unregister function
    return () => {
      const handlers = messageHandlersRef.current.get(symbol);
      if (handlers) {
        handlers.delete(handler);
        
        if (handlers.size === 0) {
          messageHandlersRef.current.delete(symbol);
          unsubscribeFromSymbol(symbol);
        }
      }
    };
  }, [subscribeToSymbol, unsubscribeFromSymbol]);
  
  // Handle typed messages (with a type and symbol)
  const handleTypedMessage = useCallback((message: any) => {
    const { type, symbol, data } = message;
    
    if (type === 'stock_update' && symbol) {
      const handlers = messageHandlersRef.current.get(symbol);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error('Error in stock update handler:', error);
          }
        });
      }
    }
  }, []);
  
  // Set up ping interval to keep connection alive
  useEffect(() => {
    if (isConnected && socketRef.current) {
      const pingIntervalId = setInterval(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'ping' }));
          console.log('Sent ping to server');
        }
      }, 30000); // Send ping every 30 seconds
      
      return () => {
        clearInterval(pingIntervalId);
      };
    }
  }, [isConnected]);
  
  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    registerHandler
  };
}
