import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  pendingActions: {
    key: number;
    value: {
      id?: number;
      url: string;
      method: string;
      body: any;
      timestamp: number;
      retryCount: number;
    };
  };
  cachedLeaves: {
    key: string;
    value: {
      id: string;
      data: any;
      cachedAt: number;
    };
  };
}

export async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  return openDB<OfflineDB>('cdbl-lms-offline', 1, {
    upgrade(db: IDBPDatabase<OfflineDB>) {
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cachedLeaves')) {
        db.createObjectStore('cachedLeaves', { keyPath: 'id' });
      }
    },
  });
}

export async function queueOfflineAction(url: string, method: string, body: any) {
  const db = await getDB();
  await db.add('pendingActions', {
    url,
    method,
    body,
    timestamp: Date.now(),
    retryCount: 0,
  });

  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in await navigator.serviceWorker.ready) {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore - sync types might be missing
    await registration.sync.register('sync-leaves');
  }
}

export async function cacheLeaveData(id: string, data: any) {
  const db = await getDB();
  await db.put('cachedLeaves', {
    id,
    data,
    cachedAt: Date.now(),
  });
}

export async function getCachedLeave(id: string) {
  const db = await getDB();
  return db.get('cachedLeaves', id);
}
