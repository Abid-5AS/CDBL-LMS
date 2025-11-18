import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";

// Database name
const DB_NAME = "cdbl_leave.db";

// Encryption key management
const ENCRYPTION_KEY = "cdbl_leave_encryption_key";

async function getOrCreateEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY);
  if (!key) {
    // Generate a random key for encryption
    key = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await SecureStore.setItemAsync(ENCRYPTION_KEY, key);
  }
  return key;
}

// Initialize database
export async function initDatabase() {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable foreign keys
    await db.execAsync("PRAGMA foreign_keys = ON;");

    // Create tables
    await db.execAsync(`
      -- User profile table
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        department TEXT,
        role TEXT,
        last_synced_at INTEGER
      );

      -- Leave balances table
      CREATE TABLE IF NOT EXISTS leave_balances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leave_type TEXT NOT NULL,
        total_days REAL NOT NULL,
        used_days REAL DEFAULT 0,
        pending_days REAL DEFAULT 0,
        available_days REAL NOT NULL,
        year INTEGER NOT NULL,
        last_synced_at INTEGER,
        UNIQUE(leave_type, year)
      );

      -- Leave applications table
      CREATE TABLE IF NOT EXISTS leave_applications (
        id TEXT PRIMARY KEY,
        leave_type TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        days_requested REAL NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        applied_on TEXT,
        approved_by TEXT,
        approved_on TEXT,
        rejection_reason TEXT,
        is_synced INTEGER DEFAULT 0,
        local_created_at INTEGER NOT NULL,
        server_id TEXT,
        last_modified_at INTEGER NOT NULL
      );

      -- Sync queue table for offline operations
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT,
        is_processed INTEGER DEFAULT 0
      );

      -- Accrual history table
      CREATE TABLE IF NOT EXISTS accrual_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leave_type TEXT NOT NULL,
        accrued_days REAL NOT NULL,
        accrual_date TEXT NOT NULL,
        accrual_month TEXT NOT NULL,
        year INTEGER NOT NULL,
        last_synced_at INTEGER
      );

      -- Holidays table
      CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        is_optional INTEGER DEFAULT 0,
        year INTEGER NOT NULL,
        last_synced_at INTEGER,
        UNIQUE(date, year)
      );

      -- App settings table
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_leave_apps_status ON leave_applications(status);
      CREATE INDEX IF NOT EXISTS idx_leave_apps_synced ON leave_applications(is_synced);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_processed ON sync_queue(is_processed);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
    `);

    console.log("✅ Database initialized successfully");
    return db;
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

// Database instance
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await initDatabase();
  }
  return dbInstance;
}

// User profile operations
export async function saveUserProfile(profile: {
  employeeId: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
}) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO user_profile (employee_id, name, email, department, role, last_synced_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      profile.employeeId,
      profile.name,
      profile.email,
      profile.department || "",
      profile.role || "",
      Date.now(),
    ]
  );
}

export async function getUserProfile() {
  const db = await getDatabase();
  return await db.getFirstAsync("SELECT * FROM user_profile LIMIT 1");
}

// Leave balance operations
export async function saveLeaveBalances(
  balances: Array<{
    leaveType: string;
    total: number;
    used: number;
    pending: number;
    available: number;
    year: number;
  }>
) {
  const db = await getDatabase();
  for (const balance of balances) {
    await db.runAsync(
      `INSERT OR REPLACE INTO leave_balances 
       (leave_type, total_days, used_days, pending_days, available_days, year, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        balance.leaveType,
        balance.total,
        balance.used,
        balance.pending,
        balance.available,
        balance.year,
        Date.now(),
      ]
    );
  }
}

export async function getLeaveBalances(
  year: number = new Date().getFullYear()
) {
  const db = await getDatabase();
  return await db.getAllAsync(
    "SELECT * FROM leave_balances WHERE year = ? ORDER BY leave_type",
    [year]
  );
}

// Leave application operations
export async function saveLeaveApplication(application: {
  id: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  daysRequested?: number;
  reason?: string;
  status?: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  days_requested?: number;
  half_day?: number;
  applied_date?: string;
  approver_comments?: string;
  created_at?: string;
  updated_at?: string;
  synced?: number;
}) {
  const db = await getDatabase();
  const now = Date.now();

  // Support both camelCase and snake_case field names
  const leaveType = application.leaveType || application.leave_type || 'Casual Leave';
  const startDate = application.startDate || application.start_date || '';
  const endDate = application.endDate || application.end_date || '';
  const daysRequested = application.daysRequested || application.days_requested || 0;
  const reason = application.reason || '';
  const status = application.status || 'draft';
  const appliedOn = application.applied_date || application.created_at || new Date().toISOString();
  const approverComments = application.approver_comments || '';
  const localCreatedAt = application.created_at ? new Date(application.created_at).getTime() : now;
  const lastModifiedAt = application.updated_at ? new Date(application.updated_at).getTime() : now;
  const isSynced = application.synced !== undefined ? application.synced : 0;
  const halfDay = application.half_day || 0;

  await db.runAsync(
    `INSERT OR REPLACE INTO leave_applications
     (id, leave_type, start_date, end_date, days_requested, reason, status, applied_on, approver_comments,
      local_created_at, last_modified_at, half_day, is_synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      application.id,
      leaveType,
      startDate,
      endDate,
      daysRequested,
      reason,
      status,
      appliedOn,
      approverComments,
      localCreatedAt,
      lastModifiedAt,
      halfDay,
      isSynced
    ]
  );

  // Add to sync queue
  await addToSyncQueue(
    "CREATE",
    "leave_application",
    application.id,
    JSON.stringify(application)
  );
}

export async function getLeaveApplications(filter?: { status?: string }) {
  const db = await getDatabase();
  if (filter?.status) {
    return await db.getAllAsync(
      "SELECT * FROM leave_applications WHERE status = ? ORDER BY local_created_at DESC",
      [filter.status]
    );
  }
  return await db.getAllAsync(
    "SELECT * FROM leave_applications ORDER BY local_created_at DESC"
  );
}

export async function updateLeaveApplication(
  id: string,
  updates: {
    status?: string;
    serverId?: string;
    isSynced?: boolean;
    leave_type?: string;
    start_date?: string;
    end_date?: string;
    days_requested?: number;
    reason?: string;
    half_day?: number;
    applied_date?: string;
    approver_comments?: string;
    created_at?: string;
    updated_at?: string;
    synced?: number;
  }
) {
  const db = await getDatabase();
  const fields = [];
  const values = [];

  if (updates.status) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  if (updates.serverId) {
    fields.push("server_id = ?");
    values.push(updates.serverId);
  }
  if (updates.isSynced !== undefined) {
    fields.push("is_synced = ?");
    values.push(updates.isSynced ? 1 : 0);
  }
  if (updates.leave_type) {
    fields.push("leave_type = ?");
    values.push(updates.leave_type);
  }
  if (updates.start_date) {
    fields.push("start_date = ?");
    values.push(updates.start_date);
  }
  if (updates.end_date) {
    fields.push("end_date = ?");
    values.push(updates.end_date);
  }
  if (updates.days_requested !== undefined) {
    fields.push("days_requested = ?");
    values.push(updates.days_requested);
  }
  if (updates.reason) {
    fields.push("reason = ?");
    values.push(updates.reason);
  }
  if (updates.half_day !== undefined) {
    fields.push("half_day = ?");
    values.push(updates.half_day);
  }
  if (updates.applied_date) {
    fields.push("applied_on = ?");
    values.push(updates.applied_date);
  }
  if (updates.approver_comments) {
    fields.push("approver_comments = ?");
    values.push(updates.approver_comments);
  }
  if (updates.created_at) {
    fields.push("local_created_at = ?");
    values.push(updates.created_at);
  }
  if (updates.updated_at) {
    fields.push("last_modified_at = ?");
    values.push(updates.updated_at);
  }
  if (updates.synced !== undefined) {
    fields.push("is_synced = ?");
    values.push(updates.synced);
  }

  fields.push("last_modified_at = ?");
  values.push(Date.now());
  values.push(id);

  await db.runAsync(
    `UPDATE leave_applications SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

// Sync queue operations
export async function addToSyncQueue(
  operationType: string,
  entityType: string,
  entityId: string,
  payload: string
) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sync_queue (operation_type, entity_type, entity_id, payload, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [operationType, entityType, entityId, payload, Date.now()]
  );
}

export async function getPendingSyncItems() {
  const db = await getDatabase();
  return await db.getAllAsync(
    "SELECT * FROM sync_queue WHERE is_processed = 0 ORDER BY created_at ASC"
  );
}

export async function markSyncItemProcessed(
  id: number,
  success: boolean,
  error?: string
) {
  const db = await getDatabase();
  if (success) {
    await db.runAsync("UPDATE sync_queue SET is_processed = 1 WHERE id = ?", [
      id,
    ]);
  } else {
    await db.runAsync(
      "UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?",
      [error || "Unknown error", id]
    );
  }
}

// App settings operations
export async function saveSetting(key: string, value: string) {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)",
    [key, value, Date.now()]
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    [key]
  );
  return result?.value || null;
}

/**
 * Get the last sync time from the database
 * Returns the most recent last_synced_at from user_profile table
 */
export async function getLastSyncTime(): Promise<string | null> {
  const db = await getDatabase();
  try {
    const result = await db.getFirstAsync<{ last_synced_at: number }>(
      "SELECT last_synced_at FROM user_profile ORDER BY last_synced_at DESC LIMIT 1"
    );
    if (result && result.last_synced_at) {
      return new Date(result.last_synced_at).toISOString();
    }
    return null;
  } catch (error) {
    console.error("Error getting last sync time:", error);
    return null;
  }
}

/**
 * Update the last sync time in the database
 */
export async function updateLastSyncTime(): Promise<void> {
  const db = await getDatabase();
  try {
    await db.runAsync(
      "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)",
      ["last_sync", Date.now().toString(), Date.now()]
    );
  } catch (error) {
    console.error("Error updating last sync time:", error);
  }
}

/**
 * Mark sync item as failed with error
 */
export async function markSyncItemFailed(
  id: number,
  error: string
): Promise<void> {
  const db = await getDatabase();
  try {
    await db.runAsync(
      "UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?",
      [error, id]
    );
  } catch (err) {
    console.error("Error marking sync item failed:", err);
  }
}


// Clear all data (for logout)
export async function clearAllData() {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM user_profile;
    DELETE FROM leave_balances;
    DELETE FROM leave_applications;
    DELETE FROM sync_queue;
    DELETE FROM accrual_history;
    DELETE FROM holidays;
    DELETE FROM app_settings;
  `);
}
