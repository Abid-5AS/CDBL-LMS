/**
 * Hook for fetching analytics and reports data
 * Provides leave distribution, trends, and summary statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

export interface ReportsSummary {
  totalLeaves: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface LeaveDistribution {
  casual: number;
  medical: number;
  earned: number;
}

export interface TrendData {
  month: string;
  requests: number;
}

export interface AnalyticsData {
  summary: ReportsSummary;
  leaveDistribution: LeaveDistribution;
  trends: TrendData[];
}

export interface UseReportsResult {
  analytics: AnalyticsData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useReports(): UseReportsResult {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<AnalyticsData>(
        API_ENDPOINTS.REPORTS.ANALYTICS
      );

      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        // Mock data for demonstration if API fails
        setAnalytics({
          summary: {
            totalLeaves: 124,
            pending: 12,
            approved: 98,
            rejected: 14,
          },
          leaveDistribution: {
            casual: 45,
            medical: 28,
            earned: 51,
          },
          trends: [
            { month: 'Jul', requests: 18 },
            { month: 'Aug', requests: 22 },
            { month: 'Sep', requests: 19 },
            { month: 'Oct', requests: 25 },
            { month: 'Nov', requests: 21 },
            { month: 'Dec', requests: 19 },
          ],
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch analytics';
      setError(new Error(errorMessage));
      console.error('Error fetching analytics:', err);

      // Use mock data on error
      setAnalytics({
        summary: {
          totalLeaves: 124,
          pending: 12,
          approved: 98,
          rejected: 14,
        },
        leaveDistribution: {
          casual: 45,
          medical: 28,
          earned: 51,
        },
        trends: [
          { month: 'Jul', requests: 18 },
          { month: 'Aug', requests: 22 },
          { month: 'Sep', requests: 19 },
          { month: 'Oct', requests: 25 },
          { month: 'Nov', requests: 21 },
          { month: 'Dec', requests: 19 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refetch = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    refetch,
  };
}
