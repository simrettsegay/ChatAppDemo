import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketMessage {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface UseChatSocketProps {
  url?: string;
  roomId: string;
  userId: string;
  onMessage: (message: any) => void;
  onError?: (error: Event) => void;
  onStatusChange?: (isConnected: boolean) => void;
}

export function useChatSocket({
  url = 'http://localhost:5000',
  roomId,
  userId,
  onMessage,
  onError,
  onStatusChange,
}: UseChatSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isMounted = useRef(true);
  const isHandlingError = useRef(false);

  // Memoize the disconnect function with proper dependencies
  const disconnect = useCallback((reason?: string) => {
    console.log('Disconnecting socket', reason ? `: ${reason}` : '');
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      onStatusChange?.(false);
    }
  }, [onStatusChange]);

  // Connect function to establish socket connection
  const connect = useCallback((retrying = false) => {
    if (!isMounted.current) return;

    // Disconnect existing connection if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    try {
      // Initialize socket connection
      const socket = io(url, {
        withCredentials: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        autoConnect: true,
        query: { userId }
      });

      socketRef.current = socket;
      return socket;
    } catch (err) {
      console.error('Socket connection error:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(new ErrorEvent('connection-error', { error }));
      return null;
    }
  }, [url, userId, onError]);

  // Handle errors and reconnection
  const handleConnectError = useCallback((err: Error) => {
    if (isHandlingError.current || !isMounted.current) return;
    isHandlingError.current = true;
    
    try {
      console.error('Socket connection error:', err);
      
      // Only update error state if it's a new error
      setError(prevError => {
        const errorMessage = err?.message || 'Unknown error';
        if (prevError && 'message' in prevError && prevError.message === errorMessage) {
          return prevError; // Don't update if it's the same error
        }
        return err;
      });

      const errorEvent = new ErrorEvent('socket-error', {
        error: err,
        message: err.message
      });
      onError?.(errorEvent);

      // Set up reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        
        reconnectTimeout.current = setTimeout(() => {
          if (isMounted.current && socketRef.current) {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            socketRef.current.connect();
          }
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    } finally {
      // Reset the flag after a short delay to prevent infinite loops
      // but allow handling new errors
      setTimeout(() => {
        if (isMounted.current) {
          isHandlingError.current = false;
        }
      }, 1000);
    }
  }, [onError]);

  // Initialize socket connection
  useEffect(() => {
    isMounted.current = true;
    
    // Disconnect existing connection if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    try {
      // Initialize socket connection
      const socket = connect();
      if (!socket) return;

      // Connection established
      const onConnect = () => {
        if (!isMounted.current) return;
        console.log('Socket.IO connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        onStatusChange?.(true);
        
        // Join room if roomId is provided
        if (roomId) {
          socket.emit('join_conversation', roomId);
        }
      };

      // Handle incoming messages
      const onReceiveMessage = (message: SocketMessage) => {
        if (!isMounted.current) return;
        onMessage?.(message);
      };

      // Handle typing indicators
      const onUserTyping = (data: { userId: string; isTyping: boolean }) => {
        if (!isMounted.current) return;
        setIsTyping(prev => ({
          ...prev,
          [data.userId]: data.isTyping
        }));
      };

      // Handle disconnection
      const onDisconnect = (reason: string) => {
        if (!isMounted.current) return;
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        onStatusChange?.(false);
      };

      // Set up event listeners
      socket.on('connect', onConnect);
      socket.on('receive_message', onReceiveMessage);
      socket.on('user_typing', onUserTyping);
      socket.on('connect_error', handleConnectError);
      socket.on('disconnect', onDisconnect);

      // Store the socket in the ref
      socketRef.current = socket;

      // Cleanup function
      return () => {
        if (socketRef.current) {
          socket.off('connect', onConnect);
          socket.off('receive_message', onReceiveMessage);
          socket.off('user_typing', onUserTyping);
          socket.off('connect_error', handleConnectError);
          socket.off('disconnect', onDisconnect);
          socket.disconnect();
        }
      };

    } catch (err) {
      console.error('Error initializing socket:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(new ErrorEvent('initialization-error', { error }));
      return;
    }

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      isHandlingError.current = true; // Prevent any pending error handlers from running
      disconnect('Component unmounted');
    };
  }, [url, roomId, userId, onMessage, onError, onStatusChange, connect, disconnect]);

  // Send message
// In useChatSocket.ts, update the sendMessage function
const sendMessage = useCallback(async (messageData: any) => {
  return new Promise((resolve) => {
    if (!socketRef.current || !isConnected) {
      console.error('Socket not connected');
      resolve(false);
      return;
    }

    // Add a timeout for the message
    const timeout = setTimeout(() => {
      console.error('Message send timeout');
      resolve(false);
    }, 5000);

    socketRef.current.emit('send_message', messageData, (response: any) => {
      clearTimeout(timeout);
      if (response?.error) {
        console.error('Error sending message:', response.error);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}, [isConnected]);

  // Typing indicator
  const sendTypingIndicator = useCallback((typing: boolean) => {
    if (!socketRef.current || !roomId) return false;
    
    const event = typing ? 'typing' : 'stop_typing';
    socketRef.current.emit(event, {
      userId,
      conversationId: roomId
    });
    return true;
  }, [roomId, userId]);

  return {
    isConnected,
    error,
    sendMessage,
    sendTypingIndicator,
    isTyping,
    reconnect: () => {
      if (socketRef.current) {
        socketRef.current.connect();
      } else {
        connect();
      }
    },
    disconnect,
  };
}