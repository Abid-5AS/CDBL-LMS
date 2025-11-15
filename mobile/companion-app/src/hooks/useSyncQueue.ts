import { useState, useEffect, useCallback } from 'react';
import {
  getPendingSyncItems,
  markSyncItemProcessed,
  addToSyncQueue,
} from '../database';

export interface SyncQueueItem {
  id: number;
  operation_type: string;
  entity_type: string;
  entity_id: string;
  payload: string;
  created_at: number;
  retry_count: number;
  last_error: string | null;
  is_processed: number;
}

export function useSyncQueue() {
  const [pendingItems, setPendingItems] = useState<SyncQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchPendingItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPendingSyncItems();
      setPendingItems(data as SyncQueueItem[]);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching sync queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingItems();
  }, [fetchPendingItems]);

  const addItem = useCallback(
    async (
      operationType: string,
      entityType: string,
      entityId: string,
      payload: any
    ) => {
      try {
        await addToSyncQueue(
          operationType,
          entityType,
          entityId,
          JSON.stringify(payload)
        );
        await fetchPendingItems();
        return { success: true };
      } catch (err) {
        console.error('Error adding to sync queue:', err);
        return { success: false, error: err };
      }
    },
    [fetchPendingItems]
  );

  const markProcessed = useCallback(
    async (id: number, success: boolean, error?: string) => {
      try {
        await markSyncItemProcessed(id, success, error);
        await fetchPendingItems();
        return { success: true };
      } catch (err) {
        console.error('Error marking sync item processed:', err);
        return { success: false, error: err };
      }
    },
    [fetchPendingItems]
  );

  const processSyncQueue = useCallback(
    async (
      syncHandler: (item: SyncQueueItem) => Promise<{ success: boolean; error?: string }>
    ) => {
      if (isSyncing || pendingItems.length === 0) {
        return { success: true, processedCount: 0 };
      }

      setIsSyncing(true);
      let processedCount = 0;

      try {
        for (const item of pendingItems) {
          try {
            const result = await syncHandler(item);
            await markProcessed(item.id, result.success, result.error);
            if (result.success) {
              processedCount++;
            }
          } catch (err) {
            await markProcessed(item.id, false, (err as Error).message);
          }
        }

        return { success: true, processedCount };
      } catch (err) {
        console.error('Error processing sync queue:', err);
        return { success: false, error: err, processedCount };
      } finally {
        setIsSyncing(false);
        await fetchPendingItems();
      }
    },
    [pendingItems, isSyncing, markProcessed, fetchPendingItems]
  );

  const hasPendingItems = useCallback((): boolean => {
    return pendingItems.length > 0;
  }, [pendingItems]);

  const getPendingCount = useCallback((): number => {
    return pendingItems.length;
  }, [pendingItems]);

  const refresh = useCallback(() => {
    fetchPendingItems();
  }, [fetchPendingItems]);

  return {
    pendingItems,
    isLoading,
    error,
    isSyncing,
    addItem,
    markProcessed,
    processSyncQueue,
    hasPendingItems,
    getPendingCount,
    refresh,
  };
}
