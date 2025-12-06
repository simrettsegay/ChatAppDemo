import { createContext, useContext, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import config from '../config/index';

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user?.accessToken) {
      // Initialize socket connection with auth token
      socketRef.current = io(config.api.baseUrl.replace('/api', ''), {
        path: '/socket.io',
        auth: {
          token: user.accessToken,
        },
        transports: ['websocket'],
        withCredentials: true,
      });

      // Connection established
      socketRef.current.on('connect', () => {
        // Connection established
      });

      // Handle connection errors
      socketRef.current.on('connect_error', () => {
        // Handle connection errors silently
      });

      // Clean up on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user?.accessToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
