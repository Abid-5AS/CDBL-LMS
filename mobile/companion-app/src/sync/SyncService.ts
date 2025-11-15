/**
 * Sync Service
 *
 * Manages offline sync between local SQLite and backend server
 */

import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import {
  SyncUploadRequest,
  SyncUploadResponse,
  SyncDownloadResponse,
  LeaveApplicationResponse,
  LeaveBalanceResponse,
  UserProfileResponse,
} from '../api/types';
import { networkMonitor } from './NetworkMonitor';
import { conflictResolver, SyncConflict } from './ConflictResolver';
import {
  getSyncQueue,
  markSyncItemProcessed,
  markSyncItemFailed,
  getLastSyncTime,
  updateLastSyncTime,
} from '../database';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncResult {
  status: SyncStatus;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: string[];
  lastSyncTime?: string;
}

type SyncListener = (result: SyncResult) => void;

class SyncService {
  private isSyncing: boolean = false;
  private syncListeners: Set<SyncListener> = new Set();
  private retryAttempts: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  constructor() {
    // Listen for network changes and auto-sync
    networkMonitor.addListener((isConnected) => {
      if (isConnected) {
        console.log('[SyncService] Network connected, triggering sync');
        this.sync();
      }
    });
  }

  /**
   * Main sync method - orchestrates upload and download
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return {
        status: 'idle',
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: ['Sync already in progress'],
      };
    }

    // Check network connectivity
    const isConnected = await networkMonitor.getConnectionStatus();
    if (!isConnected) {
      return {
        status: 'error',
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: ['No network connection'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      status: 'syncing',
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Phase 1: Upload local changes
      const uploadResult = await this.uploadChanges();
      result.uploaded = uploadResult.uploaded;
      result.conflicts = uploadResult.conflicts;
      result.errors.push(...uploadResult.errors);

      // Phase 2: Download server changes
      const downloadResult = await this.downloadChanges();
      result.downloaded = downloadResult.downloaded;
      result.errors.push(...downloadResult.errors);

      // Update last sync time
      const now = new Date().toISOString();
      await updateLastSyncTime(now);
      result.lastSyncTime = now;

      result.status = result.errors.length > 0 ? 'error' : 'success';
    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
      result.status = 'error';
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isSyncing = false;
      this.notifyListeners(result);
    }

    return result;
  }

  /**
   * Upload local changes to server
   */
  private async uploadChanges(): Promise<{
    uploaded: number;
    conflicts: number;
    errors: string[];
  }> {
    const result = { uploaded: 0, conflicts: 0, errors: [] as string[] };

    try {
      // Get pending sync items from queue
      const syncQueue = await getSyncQueue();

      if (syncQueue.length === 0) {
        console.log('[SyncService] No pending changes to upload');
        return result;
      }

      console.log(`[SyncService] Uploading ${syncQueue.length} changes`);

      // Build upload request
      const operations = syncQueue.map((item) => ({
        id: item.id,
        operation: item.operation as 'create' | 'update' | 'delete',
        entity: item.entity_type as 'leave_application' | 'profile',
        data: item.data,
        timestamp: item.created_at,
      }));

      const uploadRequest: SyncUploadRequest = { operations };

      // Send to server
      const response = await apiClient.post<SyncUploadResponse>(
        API_ENDPOINTS.SYNC.UPLOAD,
        uploadRequest
      );

      if (response.success && response.data) {
        result.uploaded = response.data.processed;
        result.conflicts = response.data.conflicts.length;

        // Mark processed items as complete
        for (const op of operations) {
          await markSyncItemProcessed(op.id);
        }

        // Handle conflicts
        if (response.data.conflicts.length > 0) {
          await this.handleConflicts(response.data.conflicts);
        }
      }
    } catch (error) {
      console.error('[SyncService] Upload failed:', error);
      result.errors.push('Failed to upload changes');
    }

    return result;
  }

  /**
   * Download server changes to local
   */
  private async downloadChanges(): Promise<{
    downloaded: number;
    errors: string[];
  }> {
    const result = { downloaded: 0, errors: [] as string[] };

    try {
      // Get last sync time
      const lastSync = await getLastSyncTime();
      const params = lastSync ? { since: lastSync } : undefined;

      console.log('[SyncService] Downloading changes since:', lastSync || 'beginning');

      // Fetch from server
      const response = await apiClient.get<SyncDownloadResponse>(
        API_ENDPOINTS.SYNC.DOWNLOAD,
        params
      );

      if (response.success && response.data) {
        const { leaveApplications, balances, profile } = response.data;

        // Update local database with server data
        if (leaveApplications) {
          await this.updateLeaveApplications(leaveApplications);
          result.downloaded += leaveApplications.length;
        }

        if (balances) {
          await this.updateBalances(balances);
          result.downloaded += balances.length;
        }

        if (profile) {
          await this.updateProfile(profile);
          result.downloaded += 1;
        }
      }
    } catch (error) {
      console.error('[SyncService] Download failed:', error);
      result.errors.push('Failed to download changes');
    }

    return result;
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflicts(conflicts: Array<{ id: string; reason: string; serverData: any }>) {
    console.log(`[SyncService] Handling ${conflicts.length} conflicts`);

    for (const conflict of conflicts) {
      try {
        // For now, use server-wins strategy
        // In a real app, you might want to show UI for user to resolve
        const resolution = conflictResolver.resolve(
          {
            id: conflict.id,
            entity: 'leave_application',
            localData: {},
            serverData: conflict.serverData,
            localTimestamp: new Date().toISOString(),
            serverTimestamp: new Date().toISOString(),
          },
          'server-wins'
        );

        if (resolution.resolution === 'accept-server') {
          // Update local with server data
          // This would call appropriate database update method
          console.log(`[SyncService] Accepting server data for ${conflict.id}`);
        }
      } catch (error) {
        console.error(`[SyncService] Failed to resolve conflict for ${conflict.id}:`, error);
      }
    }
  }

  /**
   * Update leave applications in local database
   */
  private async updateLeaveApplications(applications: LeaveApplicationResponse[]) {
    const {
      createLeaveApplication,
      updateLeaveApplication,
    } = await import('../database');

    for (const app of applications) {
      try {
        // Check if exists, then update or create
        // For simplicity, we'll use create which handles upsert
        await createLeaveApplication({
          id: app.id,
          leave_type: app.leaveType,
          start_date: app.startDate,
          end_date: app.endDate,
          reason: app.reason,
          working_days: app.workingDays,
          status: app.status,
          half_day: app.halfDay ? 1 : 0,
          applied_date: app.appliedDate,
          approver_comments: app.approverComments,
          created_at: app.appliedDate,
          updated_at: app.updatedAt,
          synced: 1,
        });
      } catch (error) {
        console.error(`[SyncService] Failed to update application ${app.id}:`, error);
      }
    }
  }

  /**
   * Update balances in local database
   */
  private async updateBalances(balances: LeaveBalanceResponse[]) {
    const { updateLeaveBalance } = await import('../database');

    for (const balance of balances) {
      try {
        await updateLeaveBalance(balance.id, {
          total_days: balance.totalDays,
          used_days: balance.usedDays,
          pending_days: balance.pendingDays,
          available_days: balance.availableDays,
        });
      } catch (error) {
        console.error(`[SyncService] Failed to update balance ${balance.id}:`, error);
      }
    }
  }

  /**
   * Update profile in local database
   */
  private async updateProfile(profile: UserProfileResponse) {
    const { updateUserProfile } = await import('../database');

    try {
      await updateUserProfile({
        name: profile.name,
        phone_number: profile.phoneNumber,
      });
    } catch (error) {
      console.error('[SyncService] Failed to update profile:', error);
    }
  }

  /**
   * Add listener for sync events
   */
  addListener(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of sync result
   */
  private notifyListeners(result: SyncResult) {
    this.syncListeners.forEach((listener) => {
      try {
        listener(result);
      } catch (error) {
        console.error('[SyncService] Listener error:', error);
      }
    });
  }

  /**
   * Get current sync status
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<string | null> {
    return await getLastSyncTime();
  }
}

export const syncService = new SyncService();
