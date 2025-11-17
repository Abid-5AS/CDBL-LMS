/**
 * Hook for fetching team statistics and overview
 * Used by managers, HR, and CEO
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import { TeamStatsResponse, TeamMemberOnLeave } from '../api/types';

export interface UseTeamStatsResult {
  stats: TeamStatsResponse | null;
  teamOnLeave: TeamMemberOnLeave[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTeamStats(): UseTeamStatsResult {
  const [stats, setStats] = useState<TeamStatsResponse | null>(null);
  const [teamOnLeave, setTeamOnLeave] = useState<TeamMemberOnLeave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeamStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both stats and team on leave in parallel
      const [statsResponse, teamResponse] = await Promise.all([
        apiClient.get<TeamStatsResponse>(API_ENDPOINTS.MANAGER.TEAM_OVERVIEW),
        apiClient.get<TeamMemberOnLeave[]>(API_ENDPOINTS.MANAGER.TEAM_ON_LEAVE),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (teamResponse.success && teamResponse.data) {
        setTeamOnLeave(teamResponse.data);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch team stats';
      setError(new Error(errorMessage));
      console.error('Error fetching team stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamStats();
  }, [fetchTeamStats]);

  const refetch = useCallback(async () => {
    await fetchTeamStats();
  }, [fetchTeamStats]);

  return {
    stats,
    teamOnLeave,
    isLoading,
    error,
    refetch,
  };
}
