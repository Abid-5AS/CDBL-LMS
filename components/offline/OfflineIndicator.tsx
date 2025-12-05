'use client';

import { useOffline } from '@/hooks/useOffline';
import { Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OfflineIndicator() {
  const { isOnline, pendingCount } = useOffline();

  // Only show if offline or if there are pending actions syncing back
  if (isOnline && pendingCount === 0) return null;

  return (
    <Alert className={`fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 shadow-lg transition-all duration-300 ${isOnline ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center gap-3">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-yellow-600" />
        )}
        <AlertDescription className={isOnline ? 'text-green-700' : 'text-yellow-700'}>
          {isOnline 
            ? `Back online! Syncing ${pendingCount} pending action${pendingCount !== 1 ? 's' : ''}...`
            : "You're offline. Changes will sync when you're back online."
          }
        </AlertDescription>
      </div>
    </Alert>
  );
}
