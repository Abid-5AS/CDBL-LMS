/**
 * Hook for managing leave approvals
 * Fetches pending approvals and provides approve/reject mutations
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import {
  PendingApprovalResponse,
  ApprovalDecisionRequest,
  ApprovalDecisionResponse,
} from '../api/types';

export interface UseApprovalsResult {
  approvals: PendingApprovalResponse[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  approveLeave: (id: string, comment?: string) => Promise<boolean>;
  rejectLeave: (id: string, comment?: string) => Promise<boolean>;
  isProcessing: boolean;
}

export function useApprovals(): UseApprovalsResult {
  const [approvals, setApprovals] = useState<PendingApprovalResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<PendingApprovalResponse[]>(
        API_ENDPOINTS.APPROVALS.PENDING
      );

      if (response.success && response.data) {
        setApprovals(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch approvals');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch approvals';
      setError(new Error(errorMessage));
      console.error('Error fetching approvals:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const refetch = useCallback(async () => {
    await fetchApprovals();
  }, [fetchApprovals]);

  const processDecision = useCallback(
    async (id: string, status: 'APPROVED' | 'REJECTED', comment?: string): Promise<boolean> => {
      try {
        setIsProcessing(true);

        const payload: ApprovalDecisionRequest = {
          status,
          comment,
        };

        const response = await apiClient.post<ApprovalDecisionResponse>(
          API_ENDPOINTS.APPROVALS.DECISION(id),
          payload
        );

        if (response.success) {
          // Remove the approved/rejected item from the list
          setApprovals((prev) => prev.filter((approval) => approval.id !== id));
          return true;
        } else {
          throw new Error(response.message || 'Decision failed');
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to process decision';
        console.error('Error processing decision:', err);
        throw new Error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const approveLeave = useCallback(
    async (id: string, comment?: string): Promise<boolean> => {
      return processDecision(id, 'APPROVED', comment);
    },
    [processDecision]
  );

  const rejectLeave = useCallback(
    async (id: string, comment?: string): Promise<boolean> => {
      return processDecision(id, 'REJECTED', comment);
    },
    [processDecision]
  );

  return {
    approvals,
    isLoading,
    error,
    refetch,
    approveLeave,
    rejectLeave,
    isProcessing,
  };
}
