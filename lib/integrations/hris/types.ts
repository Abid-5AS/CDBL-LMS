/**
 * HRIS Integration Types
 * Defines interfaces for HRIS data synchronization
 */

export interface HRISEmployee {
  empCode: string;
  name: string;
  email: string;
  department?: string;
  joinDate?: Date;
  retirementDate?: Date;
  deptHeadEmpCode?: string;
  status: 'active' | 'terminated' | 'on_leave';
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSynced: number;
  recordsFailed: number;
  recordsSkipped: number;
  conflicts: ConflictInfo[];
  errors: string[];
  duration: number; // milliseconds
}

export interface ConflictInfo {
  empCode: string;
  type: 'duplicate' | 'mismatch' | 'missing';
  field?: string;
  hrisValue: any;
  systemValue: any;
}

export interface HRISProvider {
  name: string;
  sync(): Promise<HRISEmployee[]>;
  validate(data: HRISEmployee): boolean;
  test(): Promise<boolean>;
}

export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ConflictResolution = 'keep_hris' | 'keep_system' | 'merge' | 'skip';
