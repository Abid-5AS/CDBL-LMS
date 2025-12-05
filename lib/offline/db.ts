import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface LeaveManagementDB extends DBSchema {
  'leave-drafts': {
    key: string;
    value: {
      id: string;
      type: string;
      startDate: Date;
      endDate: Date;
      reason: string;
      createdAt: Date;
    };
  };
  'sync-queue': {
    key: number;
    value: {
      id?: number;
      action: 'CREATE_LEAVE' | 'CANCEL_LEAVE' | 'APPROVE_LEAVE';
      payload: any;
      createdAt: Date;
    };
    indexes: { 'by-date': Date };
  };
  'user-cache': {
    key: string;
    value: any;
  };
}

const DB_NAME = 'cdbl-lms-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LeaveManagementDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<LeaveManagementDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('leave-drafts')) {
          db.createObjectStore('leave-drafts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync-queue')) {
          const store = db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
          store.createIndex('by-date', 'createdAt');
        }
        if (!db.objectStoreNames.contains('user-cache')) {
          db.createObjectStore('user-cache');
        }
      },
    });
  }
  return dbPromise;
};

export const saveDraft = async (draft: any) => {
  const db = await initDB();
  await db.put('leave-drafts', {
    ...draft,
    id: draft.id || crypto.randomUUID(),
    createdAt: new Date(),
  });
};

export const getDrafts = async () => {
  const db = await initDB();
  return db.getAll('leave-drafts');
};

export const deleteDraft = async (id: string) => {
  const db = await initDB();
  await db.delete('leave-drafts', id);
};

export const queueSyncAction = async (action: 'CREATE_LEAVE' | 'CANCEL_LEAVE' | 'APPROVE_LEAVE', payload: any) => {
  const db = await initDB();
  await db.add('sync-queue', {
    action,
    payload,
    createdAt: new Date(),
  });
};

export const getSyncQueue = async () => {
  const db = await initDB();
  return db.getAllFromIndex('sync-queue', 'by-date');
};

export const removeSyncItem = async (id: number) => {
  const db = await initDB();
  await db.delete('sync-queue', id);
};

export const cacheUserData = async (key: string, data: any) => {
  const db = await initDB();
  await db.put('user-cache', data, key);
};

export const getCachedUserData = async (key: string) => {
  const db = await initDB();
  return db.get('user-cache', key);
};
