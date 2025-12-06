import { useState, useEffect, useCallback } from 'react';

type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'invisible';

interface UserStatusOptions {
  initialStatus?: UserStatus;
  onStatusChange?: (status: UserStatus) => void;
}

export function useUserStatus(_userId: string, options: UserStatusOptions = {}) {
  const { initialStatus = 'offline', onStatusChange } = options;
  const [status, setStatus] = useState<UserStatus>(initialStatus);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('online');
      onStatusChange?.('online');
      setLastSeen(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
      onStatusChange?.('offline');
      setLastSeen(new Date());
    };

    // Set initial state
    setIsOnline(navigator.onLine);
    setStatus(navigator.onLine ? 'online' : 'offline');
    setLastSeen(new Date());

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  // Update user activity
  const updateStatus = useCallback((newStatus: UserStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
    setLastSeen(new Date());
  }, [onStatusChange]);

  // Simulate user activity (e.g., typing, idle, etc.)
  const setUserActive = useCallback(() => {
    if (status === 'offline') return;
    setStatus('online');
    setLastSeen(new Date());
  }, [status]);

  // Simulate user away status when inactive
  useEffect(() => {
    if (!isOnline) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleActivity = () => {
      setUserActive();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (status !== 'offline') {
          setStatus('away');
        }
      }, 5 * 60 * 1000); // 5 minutes of inactivity
    };

    // Initial setup
    handleActivity();

    // Add event listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [isOnline, setUserActive, status]);

  return {
    status,
    isOnline,
    lastSeen,
    updateStatus,
    setUserActive,
  };
}
