import { useState, useEffect } from 'react';
import { queueOfflineAction } from '@/lib/offline/storage';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchWithOfflineSupport = async (url: string, options: RequestInit) => {
    if (!isOnline) {
      await queueOfflineAction(url, options.method || 'GET', options.body);
      setPendingCount(prev => prev + 1);
      return { offline: true, queued: true };
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    } catch (error) {
      // Network error - queue for later
      await queueOfflineAction(url, options.method || 'GET', options.body);
      setPendingCount(prev => prev + 1);
      return { offline: true, queued: true };
    }
  };

  return { isOnline, pendingCount, fetchWithOfflineSupport };
}
