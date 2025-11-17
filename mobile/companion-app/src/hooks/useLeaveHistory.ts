/**
 * Hook for fetching leave history from the API
 * Uses React Query pattern with manual state management
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import { LeaveApplicationResponse } from '../api/types';

export interface UseLeaveHistoryResult {
  data: LeaveApplicationResponse[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLeaveHistory(): UseLeaveHistoryResult {
  const [data, setData] = useState<LeaveApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaveHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from API
      const response = await apiClient.get<LeaveApplicationResponse[]>(
        API_ENDPOINTS.LEAVES.LIST
      );

      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch leave history');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch leave history';
      setError(new Error(errorMessage));
      console.error('Error fetching leave history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  const refetch = useCallback(async () => {
    await fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
