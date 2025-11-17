/**
 * API Request/Response Types
 */

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    employeeId: string;
    department: string;
    role: string;
  };
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// User Profile
export interface UserProfileResponse {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  role: string;
  joinDate?: string;
  phoneNumber?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phoneNumber?: string;
}

// Leave Balances
export interface LeaveBalanceResponse {
  id: string;
  leaveType: string;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  year: number;
}

// Leave Applications
export interface LeaveApplicationRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  workingDays: number;
  halfDay?: boolean;
}

export interface LeaveApplicationResponse {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  workingDays: number;
  status: 'pending' | 'approved' | 'rejected';
  halfDay: boolean;
  appliedDate: string;
  approverComments?: string;
  updatedAt: string;
}

// Sync Operations
export interface SyncUploadRequest {
  operations: Array<{
    id: string;
    operation: 'create' | 'update' | 'delete';
    entity: 'leave_application' | 'profile';
    data: any;
    timestamp: string;
  }>;
}

export interface SyncUploadResponse {
  processed: number;
  failed: number;
  conflicts: Array<{
    id: string;
    reason: string;
    serverData: any;
  }>;
}

export interface SyncDownloadRequest {
  since?: string; // ISO timestamp
}

export interface SyncDownloadResponse {
  leaveApplications: LeaveApplicationResponse[];
  balances: LeaveBalanceResponse[];
  profile?: UserProfileResponse;
  lastSyncTime: string;
}

// Holidays
export interface HolidayResponse {
  id: string;
  name: string;
  date: string;
  type: 'public' | 'optional';
}

// Notifications
export interface NotificationRegisterRequest {
  deviceToken: string;
  platform: 'ios' | 'android';
}

export interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: any;
  createdAt: string;
  read: boolean;
}

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Error Response
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Approval Requests/Responses
export interface PendingApprovalResponse {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  appliedDate: string;
  halfDay: boolean;
}

export interface ApprovalDecisionRequest {
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
}

export interface ApprovalDecisionResponse {
  success: boolean;
  message: string;
}

// Team Stats
export interface TeamStatsResponse {
  totalEmployees: number;
  onLeaveToday: number;
  pendingApprovals: number;
  approvedThisMonth: number;
}

export interface TeamMemberOnLeave {
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
}
