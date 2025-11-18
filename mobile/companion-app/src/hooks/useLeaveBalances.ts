import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import { LeaveBalanceResponse } from '../api/types';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLocalBalances = useCallback(
    async (options?: { suppressLoading?: boolean }) => {
      if (!options?.suppressLoading) {
        setIsLoading(true);
      }
      try {
        setError(null);
        const data = await getLeaveBalances(currentYear);
        setBalances(data as LeaveBalance[]);

        if (data.length > 0) {
          const syncTime = (data[0] as LeaveBalance).last_synced_at;
          setLastSynced(syncTime ? new Date(syncTime) : null);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching leave balances:', err);
      } finally {
        if (!options?.suppressLoading) {
          setIsLoading(false);
        }
      }
    },
    [currentYear]
  );

  const fetchBalancesFromServer = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Check if user is authenticated before making API call
      const authStoreModule = await import('../store/authStore');
      const user = authStoreModule.useAuthStore.getState().user;
      if (!user) {
        console.log('[useLeaveBalances] User not authenticated, skipping server fetch');
        setIsRefreshing(false);
        return;
      }

      setError(null);
      const response = await apiClient.get<any>(
        API_ENDPOINTS.BALANCE.GET
      );

      // Handle /api/balance/mine response format
      // Response can be either:
      // 1. { year: 2025, balances: [...] } - detailed format with opening, accrued, used, closing
      // 2. { year: 2025, EARNED: 34, CASUAL: 9, MEDICAL: 12 } - simple format
      const year = response.data?.year ?? currentYear;
      let balances: any[] = [];

      if (Array.isArray(response.data?.balances)) {
        // Detailed format with balance objects
        balances = response.data.balances.map((balance: any) => ({
          leaveType: balance.type ?? 'Unknown',
          total: (balance.opening ?? 0) + (balance.accrued ?? 0),
          used: balance.used ?? 0,
          pending: 0,
          available: balance.closing ?? 0,
          year: year,
        }));
      } else if (response.data) {
        // Simple format with balance types as keys
        const types = ['EARNED', 'CASUAL', 'MEDICAL', 'EL', 'CL', 'ML'];
        balances = types
          .filter((type) => typeof response.data[type] === 'number')
          .map((type) => ({
            leaveType: type,
            total: response.data[type],
            used: 0, // Simple format doesn't include breakdown
            pending: 0,
            available: response.data[type],
            year: year,
          }));
      }

      if (balances.length > 0) {
        await saveLeaveBalances(balances);
        setLastSynced(new Date());
        await loadLocalBalances({ suppressLoading: true });
      }
    } catch (err) {
      const error = err as Error;
      // Don't treat 401 as an error that should be displayed to user, it's expected when not logged in
      if (error.message && error.message.includes('401')) {
        console.log('[useLeaveBalances] Not authenticated, using local data only');
      } else {
        setError(error);
        console.error('Error syncing leave balances:', error);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [currentYear, loadLocalBalances]);

  useEffect(() => {
    loadLocalBalances();
    fetchBalancesFromServer();
  }, [loadLocalBalances, fetchBalancesFromServer]);

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
        await loadLocalBalances();
        return { success: true };
      } catch (err) {
        console.error('Error updating leave balances:', err);
        return { success: false, error: err };
      }
    },
    [loadLocalBalances]
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

  const refresh = useCallback(async () => {
    await fetchBalancesFromServer();
  }, [fetchBalancesFromServer]);

  return {
    balances,
    isLoading,
    error,
    lastSynced,
    isRefreshing,
    updateBalances,
    getBalanceByType,
    getTotalAvailable,
    getTotalUsed,
    refresh,
  };
}
