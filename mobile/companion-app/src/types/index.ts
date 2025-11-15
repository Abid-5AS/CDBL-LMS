// Core Leave Types
export type LeaveType =
  | "EARNED"
  | "CASUAL"
  | "MEDICAL"
  | "MATERNITY"
  | "PATERNITY"
  | "STUDY"
  | "SPECIAL"
  | "SPECIAL_DISABILITY"
  | "QUARANTINE"
  | "EXTRAWITHPAY"
  | "EXTRAWITHOUTPAY";

export type LeaveStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURNED"
  | "CANCELLATION_REQUESTED"
  | "RECALLED";

export type Gender = "MALE" | "FEMALE";

// Leave Request
export interface LeaveRequest {
  id: number;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  reason: string;
  status: LeaveStatus;
  certificatePath?: string;
  fitnessCertificatePath?: string;
  isModified: boolean;
  parentLeaveId?: number;
  isExtension: boolean;
  incidentDate?: Date;
  payCalculation?: {
    fullPayDays: number;
    halfPayDays: number;
    unPaidDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  serverId?: number;
}

// Balance
export interface Balance {
  type: LeaveType;
  year: number;
  opening: number;
  accrued: number;
  used: number;
  closing: number;
}

export interface BalanceMap {
  [key: string]: Balance;
}

// Holiday
export interface Holiday {
  date: Date;
  name: string;
  isOptional: boolean;
}

// Policy Configuration
export interface PolicyConfig {
  leaveType: LeaveType;
  maxDays?: number;
  minDays?: number;
  noticeDays?: number;
  carryLimit?: number;
  requiresCertificate?: boolean;
  certificateThreshold?: number;
  accrualRate?: number;
  description?: string;
}

// Validation Result
export interface ValidationResult {
  isValid: boolean;
  violations: Violation[];
  warnings: Warning[];
  suggestions: Suggestion[];
}

export interface Violation {
  code: string;
  message: string;
  severity: "ERROR" | "WARNING";
  ruleId: string;
}

export interface Warning {
  code: string;
  message: string;
  suggestion?: string;
}

export interface Suggestion {
  type:
    | "ALTERNATIVE_LEAVE_TYPE"
    | "SPLIT_REQUEST"
    | "CHANGE_DATES"
    | "CONVERSION";
  leaveType?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  workingDays?: number;
  reasoning: string;
  priority: number;
}

// Validation Context
export interface ValidationContext {
  leaveRequest: Partial<LeaveRequest>;
  currentBalance: BalanceMap;
  previousLeaves: LeaveRequest[];
  holidays: Holiday[];
  gender: Gender;
  policies: PolicyConfig[];
  currentDate: Date;
}

// Rule Definition
export interface Rule {
  id: string;
  name: string;
  description: string;
  leaveTypes: LeaveType[];
  priority: number;
  validate: (context: ValidationContext) => RuleResult;
  explain: (context: ValidationContext) => string;
}

export interface RuleResult {
  passed: boolean;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  code: string;
  suggestions?: Suggestion[];
}

// AI Types
export interface AIInsight {
  id: string;
  type: "PATTERN" | "SUGGESTION" | "WARNING" | "RECOMMENDATION";
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    label: string;
    route: string;
  };
  createdAt: Date;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AIContext {
  balances: BalanceMap;
  recentLeaves: LeaveRequest[];
  policies: PolicyConfig[];
  holidays: Holiday[];
}

// UI Types
export interface LeaveCardProps {
  leave: LeaveRequest;
  onPress?: () => void;
}

export interface BalanceCardProps {
  balance: Balance;
  policyConfig?: PolicyConfig;
}

export interface CalendarEvent {
  date: Date;
  type: "LEAVE" | "HOLIDAY";
  leaveType?: LeaveType;
  holidayName?: string;
  isOptional?: boolean;
}

// Sync Types
export interface SyncQueueItem {
  id: number;
  entityType: "LEAVE_REQUEST" | "BALANCE" | "HOLIDAY";
  entityId: number;
  operation: "CREATE" | "UPDATE" | "DELETE";
  payload: any;
  createdAt: Date;
  retryCount: number;
}

export interface SyncStatus {
  lastSyncAt?: Date;
  pendingCount: number;
  failedCount: number;
  isOnline: boolean;
}

// User Preferences
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: "en" | "bn";
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  aiEnabled: boolean;
  aiConsent: boolean;
}

// Analytics
export interface LeaveAnalytics {
  totalLeavesTaken: number;
  leavesByType: Record<LeaveType, number>;
  averageLeaveDuration: number;
  mostUsedLeaveType: LeaveType;
  peakMonths: number[];
  balanceUtilization: number;
}
