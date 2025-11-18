import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import { LeaveApplicationResponse } from '../api/types';
import {
  getLeaveApplications,
  saveLeaveApplication,
  updateLeaveApplication,
} from '../database';

export interface LeaveApplication {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string;
  applied_on: string | null;
  approved_by: string | null;
  approved_on: string | null;
  rejection_reason: string | null;
  is_synced: number;
  local_created_at: number;
  server_id: string | null;
  last_modified_at: number;
}

export function useLeaveApplications(filter?: { status?: string }) {
  const [localApplications, setLocalApplications] = useState<LeaveApplication[]>([]);
  const [remoteApplications, setRemoteApplications] =
    useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const filterStatus = filter?.status?.toLowerCase();

  const loadLocalApplications = useCallback(
    async (options?: { suppressLoading?: boolean }) => {
      if (!options?.suppressLoading) {
        setIsLoading(true);
      }

      try {
        setError(null);
        const data = await getLeaveApplications(
          filterStatus ? { status: filterStatus } : undefined
        );
        setLocalApplications(data as LeaveApplication[]);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching leave applications:', err);
      } finally {
        if (!options?.suppressLoading) {
          setIsLoading(false);
        }
      }
    },
    [filterStatus]
  );

  const normalizeApplication = useCallback(
    (application: LeaveApplicationResponse): LeaveApplication => {
      const normalizedStatus =
        application.status?.toLowerCase() ?? 'pending';
      return {
        id: application.id,
      leave_type:
        application.leaveType ??
        application.leave_type ??
        'Casual Leave',
      start_date:
        application.startDate ??
        application.start_date ??
        '',
      end_date:
        application.endDate ??
        application.end_date ??
        '',
      days_requested:
        application.workingDays ??
        application.daysRequested ??
        0,
      reason: application.reason ?? '',
      status: normalizedStatus,
      applied_on: application.appliedDate ?? null,
      approved_by:
        normalizedStatus === 'approved'
          ? application.approverComments ?? null
          : null,
      approved_on: application.updatedAt ?? null,
      rejection_reason:
        normalizedStatus === 'rejected'
          ? application.approverComments ?? null
          : null,
      is_synced: 1,
      local_created_at: Date.now(),
      server_id: application.id,
      last_modified_at: Date.now(),
    };
    },
    []
  );

  const fetchApplicationsFromServer = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Check if user is authenticated before making API call
      const authStoreModule = await import('../store/authStore');
      const user = authStoreModule.useAuthStore.getState().user;
      if (!user) {
        console.log('[useLeaveApplications] User not authenticated, skipping server fetch');
        setIsRefreshing(false);
        return;
      }

      setError(null);
      const response = await apiClient.get<LeaveApplicationResponse[]>(
        API_ENDPOINTS.LEAVES.LIST
      );

      const rawList = Array.isArray(response.data)
        ? response.data
        : response.data?.leaves ?? [];

      const normalized = rawList.map(normalizeApplication);
      setRemoteApplications(normalized);
    } catch (err) {
      const error = err as Error;
      // Don't treat 401 as an error that should be displayed to user, it's expected when not logged in
      if (error.message && error.message.includes('401')) {
        console.log('[useLeaveApplications] Not authenticated, using local data only');
      } else {
        setError(error);
        console.error('Error fetching leave applications from server:', error);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [normalizeApplication]);

  useEffect(() => {
    loadLocalApplications();
    fetchApplicationsFromServer();
  }, [loadLocalApplications, fetchApplicationsFromServer]);

  const createApplication = useCallback(
    async (application: {
      leaveType: string;
      startDate: string;
      endDate: string;
      daysRequested: number;
      reason: string;
      status?: string;
    }) => {
      try {
        const id = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await saveLeaveApplication({
          id,
          ...application,
        });
        await loadLocalApplications({ suppressLoading: true });
        return { success: true, id };
      } catch (err) {
        console.error('Error creating leave application:', err);
        return { success: false, error: err };
      }
    },
    [loadLocalApplications]
  );

  const updateApplication = useCallback(
    async (
      id: string,
      updates: {
        status?: string;
        serverId?: string;
        isSynced?: boolean;
      }
    ) => {
      try {
        await updateLeaveApplication(id, updates);
        await loadLocalApplications({ suppressLoading: true });
        return { success: true };
      } catch (err) {
        console.error('Error updating leave application:', err);
        return { success: false, error: err };
      }
    },
    [loadLocalApplications]
  );

  const refresh = useCallback(async () => {
    await loadLocalApplications();
    await fetchApplicationsFromServer();
  }, [loadLocalApplications, fetchApplicationsFromServer]);

  const mergedApplications = useMemo(() => {
    const remoteIds = new Set(remoteApplications.map((app) => app.id));
    const dedupedLocal = localApplications.filter(
      (app) => !remoteIds.has(app.id)
    );
    return [...remoteApplications, ...dedupedLocal];
  }, [localApplications, remoteApplications]);

  const filteredApplications = useMemo(() => {
    if (!filterStatus) {
      return mergedApplications;
    }
    return mergedApplications.filter(
      (app) => app.status === filterStatus
    );
  }, [mergedApplications, filterStatus]);

  return {
    applications: filteredApplications,
    isLoading,
    isRefreshing,
    error,
    createApplication,
    updateApplication,
    refresh,
  };
}
