import { useState, useEffect, useCallback } from 'react';
import { getLeaveBalances, saveLeaveBalances } from '../database';

export interface LeaveBalance {
  id: number;
  leave_type: string;
  total_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
  year: number;
  last_synced_at: number | null;
}

export function useLeaveBalances(year?: number) {
  const currentYear = year || new Date().getFullYear();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const fetchBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLeaveBalances(currentYear);
      setBalances(data as LeaveBalance[]);

      // Get last synced time from the first balance
      if (data.length > 0) {
        const syncTime = (data[0] as LeaveBalance).last_synced_at;
        setLastSynced(syncTime ? new Date(syncTime) : null);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching leave balances:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const updateBalances = useCallback(
    async (
      newBalances: Array<{
        leaveType: string;
        total: number;
        used: number;
        pending: number;
        available: number;
        year: number;
      }>
    ) => {
      try {
        await saveLeaveBalances(newBalances);
        await fetchBalances();
        return { success: true };
      } catch (err) {
        console.error('Error updating leave balances:', err);
        return { success: false, error: err };
      }
    },
    [fetchBalances]
  );

  const getBalanceByType = useCallback(
    (leaveType: string): LeaveBalance | undefined => {
      return balances.find((b) => b.leave_type === leaveType);
    },
    [balances]
  );

  const getTotalAvailable = useCallback((): number => {
    return balances.reduce((sum, b) => sum + b.available_days, 0);
  }, [balances]);

  const getTotalUsed = useCallback((): number => {
    return balances.reduce((sum, b) => sum + b.used_days, 0);
  }, [balances]);

  const refresh = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    isLoading,
    error,
    lastSynced,
    updateBalances,
    getBalanceByType,
    getTotalAvailable,
    getTotalUsed,
    refresh,
  };
}
