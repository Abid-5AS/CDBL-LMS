import { useState, useEffect, useCallback } from 'react';
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
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLeaveApplications(filter);
      setApplications(data as LeaveApplication[]);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching leave applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter?.status]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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
        await fetchApplications();
        return { success: true, id };
      } catch (err) {
        console.error('Error creating leave application:', err);
        return { success: false, error: err };
      }
    },
    [fetchApplications]
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
        await fetchApplications();
        return { success: true };
      } catch (err) {
        console.error('Error updating leave application:', err);
        return { success: false, error: err };
      }
    },
    [fetchApplications]
  );

  const refresh = useCallback(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    isLoading,
    error,
    createApplication,
    updateApplication,
    refresh,
  };
}
