import { getSyncQueue, removeSyncItem } from './db';
import { toast } from 'sonner';

export class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    toast.success('You are back online. Syncing data...');
    this.processQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
    toast.warning('You are offline. Changes will be saved locally.');
  };

  public async processQueue() {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    const queue = await getSyncQueue();

    if (queue.length === 0) {
      this.isSyncing = false;
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      try {
        await this.performAction(item.action, item.payload);
        if (item.id) await removeSyncItem(item.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        failCount++;
      }
    }

    this.isSyncing = false;

    if (successCount > 0) {
      toast.success(`Synced ${successCount} items successfully.`);
    }
    if (failCount > 0) {
      toast.error(`Failed to sync ${failCount} items. Will retry later.`);
    }
  }

  private async performAction(action: string, payload: any) {
    let url = '';
    let method = 'POST';

    switch (action) {
      case 'CREATE_LEAVE':
        url = '/api/leaves';
        break;
      case 'CANCEL_LEAVE':
        url = `/api/leaves/${payload.id}/cancel`;
        break;
      case 'APPROVE_LEAVE':
        url = `/api/leaves/${payload.id}/approve`;
        break;
      case 'REJECT_LEAVE':
        url = `/api/leaves/${payload.id}/reject`;
        break;
      case 'FORWARD_LEAVE':
        url = `/api/leaves/${payload.id}/forward`;
        break;
      case 'RETURN_LEAVE':
        url = `/api/leaves/${payload.id}/return`;
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    let body: any;
    const headers: Record<string, string> = {};

    // Check if payload contains a File object (for CREATE_LEAVE with certificate)
    const hasFile = payload.certificate instanceof File || (payload.file instanceof File);

    if (hasFile) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key === 'file' ? 'certificate' : key, value);
        } else {
          formData.append(key, String(value));
        }
      });
      body = formData;
      // Content-Type header is automatically set for FormData
    } else {
      body = JSON.stringify(payload);
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
  }
}

export const syncManager = new SyncManager();
