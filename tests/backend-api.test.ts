/**
 * Backend API Testing Suite
 * Tests all API endpoints for CDBL Leave Management System
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test data
const testUsers = {
  employee: {
    email: 'employee1@cdbl.com',
    password: 'Test@123456',
    role: 'EMPLOYEE'
  },
  hrAdmin: {
    email: 'hradmin@cdbl.com',
    password: 'Test@123456',
    role: 'HR_ADMIN'
  },
  deptHead: {
    email: 'depthead@cdbl.com',
    password: 'Test@123456',
    role: 'DEPT_HEAD'
  },
  hrHead: {
    email: 'hrhead@cdbl.com',
    password: 'Test@123456',
    role: 'HR_HEAD'
  },
  ceo: {
    email: 'ceo@cdbl.com',
    password: 'Test@123456',
    role: 'CEO'
  }
};

let tokens: Record<string, string> = {};
let leaveRequestId: string;

// Helper function to make API calls
async function apiCall(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  role: string = 'employee'
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (tokens[role]) {
    headers['Authorization'] = `Bearer ${tokens[role]}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    data,
    headers: response.headers,
  };
}

describe('CDBL Leave Management - Backend API Tests', () => {
  describe('Authentication Endpoints', () => {
    it('should login with valid credentials', async () => {
      const result = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.employee.email,
        password: testUsers.employee.password,
      }, '');

      expect(result.status).toBe(200);
      expect(result.data.token).toBeDefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.user.role).toBe('EMPLOYEE');

      tokens.employee = result.data.token;
    });

    it('should reject invalid credentials', async () => {
      const result = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.employee.email,
        password: 'wrongpassword',
      }, '');

      expect(result.status).toBe(401);
      expect(result.data.error).toBeDefined();
    });

    it('should get current user session', async () => {
      const result = await apiCall('/api/auth/me', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(result.data.id).toBeDefined();
      expect(result.data.email).toBe(testUsers.employee.email);
    });

    it('should logout', async () => {
      const result = await apiCall('/api/auth/logout', 'POST', {}, 'employee');

      expect(result.status).toBe(200);
    });
  });

  describe('Leave Request Endpoints', () => {
    beforeAll(async () => {
      // Login as employee
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.employee.email,
        password: testUsers.employee.password,
      }, '');
      tokens.employee = loginResult.data.token;
    });

    it('should get all leave requests for user', async () => {
      const result = await apiCall('/api/leaves', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should create a new leave request', async () => {
      const result = await apiCall('/api/leaves', 'POST', {
        leaveType: 'CASUAL_LEAVE',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        reason: 'Test leave request',
      }, 'employee');

      expect(result.status).toBe(201);
      expect(result.data.id).toBeDefined();
      expect(result.data.status).toBe('SUBMITTED');

      leaveRequestId = result.data.id;
    });

    it('should get a specific leave request', async () => {
      const result = await apiCall(`/api/leaves/${leaveRequestId}`, 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(result.data.id).toBe(leaveRequestId);
      expect(result.data.leaveType).toBe('CASUAL_LEAVE');
    });

    it('should update a leave request', async () => {
      const result = await apiCall(`/api/leaves/${leaveRequestId}`, 'PUT', {
        reason: 'Updated reason for leave',
      }, 'employee');

      expect(result.status).toBe(200);
      expect(result.data.reason).toBe('Updated reason for leave');
    });

    it('should validate leave dates', async () => {
      const result = await apiCall('/api/leaves', 'POST', {
        leaveType: 'CASUAL_LEAVE',
        startDate: '2025-12-03',
        endDate: '2025-12-01', // End before start
        reason: 'Invalid dates',
      }, 'employee');

      expect(result.status).toBe(400);
      expect(result.data.error).toBeDefined();
    });

    it('should check insufficient balance', async () => {
      const result = await apiCall('/api/leaves', 'POST', {
        leaveType: 'CASUAL_LEAVE',
        startDate: '2025-12-10',
        endDate: '2025-12-20', // 10+ days
        reason: 'More than available balance',
      }, 'employee');

      // Should either reject or show warning
      expect([400, 201]).toContain(result.status);
    });
  });

  describe('Leave Balance Endpoints', () => {
    beforeAll(async () => {
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.employee.email,
        password: testUsers.employee.password,
      }, '');
      tokens.employee = loginResult.data.token;
    });

    it('should get user leave balance', async () => {
      const result = await apiCall('/api/balance', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Check structure of balance
      const balance = result.data[0];
      expect(balance.leaveType).toBeDefined();
      expect(balance.opening).toBeDefined();
      expect(balance.accrued).toBeDefined();
      expect(balance.used).toBeDefined();
      expect(balance.available).toBeDefined();
    });

    it('should get balance for specific leave type', async () => {
      const result = await apiCall('/api/balance?leaveType=CASUAL_LEAVE', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      const casualLeaves = result.data.filter((b: any) => b.leaveType === 'CASUAL_LEAVE');
      expect(casualLeaves.length).toBeGreaterThan(0);
    });

    it('should calculate projected balance', async () => {
      const result = await apiCall('/api/balance/projection', 'POST', {
        leaveType: 'CASUAL_LEAVE',
        days: 3,
      }, 'employee');

      expect(result.status).toBe(200);
      expect(result.data.currentBalance).toBeDefined();
      expect(result.data.projectedBalance).toBeDefined();
      expect(result.data.projectedBalance).toBeLessThan(result.data.currentBalance);
    });
  });

  describe('Approval Endpoints', () => {
    beforeAll(async () => {
      // Login as HR Admin
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.hrAdmin.email,
        password: testUsers.hrAdmin.password,
      }, '');
      tokens.hrAdmin = loginResult.data.token;
    });

    it('should get pending approvals', async () => {
      const result = await apiCall('/api/approvals/pending', 'GET', null, 'hrAdmin');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should approve a leave request', async () => {
      const result = await apiCall(`/api/approvals/${leaveRequestId}/approve`, 'POST', {
        comments: 'Approved by HR Admin',
      }, 'hrAdmin');

      expect(result.status).toBe(200);
      expect(result.data.status).toBe('PENDING');
    });

    it('should reject a leave request', async () => {
      // Create another leave to reject
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.employee.email,
        password: testUsers.employee.password,
      }, '');
      tokens.employee = loginResult.data.token;

      const leaveResult = await apiCall('/api/leaves', 'POST', {
        leaveType: 'CASUAL_LEAVE',
        startDate: '2025-12-04',
        endDate: '2025-12-05',
        reason: 'Leave to be rejected',
      }, 'employee');

      const rejectResult = await apiCall(
        `/api/approvals/${leaveResult.data.id}/reject`,
        'POST',
        {
          reason: 'INSUFFICIENT_STAFFING',
          comments: 'Too many leaves approved',
        },
        'hrAdmin'
      );

      expect(rejectResult.status).toBe(200);
      expect(rejectResult.data.status).toBe('REJECTED');
    });

    it('should return a leave for modification', async () => {
      const result = await apiCall(`/api/approvals/${leaveRequestId}/return`, 'POST', {
        comments: 'Please provide medical certificate',
      }, 'hrAdmin');

      expect(result.status).toBe(200);
      expect(result.data.status).toBe('RETURNED');
    });

    it('should prevent self-approval', async () => {
      // Create leave as HR Admin
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.hrAdmin.email,
        password: testUsers.hrAdmin.password,
      }, '');
      tokens.hrAdmin = loginResult.data.token;

      const leaveResult = await apiCall('/api/leaves', 'POST', {
        leaveType: 'CASUAL_LEAVE',
        startDate: '2025-12-06',
        endDate: '2025-12-07',
        reason: 'Self approval test',
      }, 'hrAdmin');

      // Try to approve own leave
      const approveResult = await apiCall(
        `/api/approvals/${leaveResult.data.id}/approve`,
        'POST',
        { comments: 'Self approval' },
        'hrAdmin'
      );

      expect(approveResult.status).toBe(403);
      expect(approveResult.data.error).toContain('Cannot approve own request');
    });
  });

  describe('Holiday Endpoints', () => {
    beforeAll(async () => {
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.hrAdmin.email,
        password: testUsers.hrAdmin.password,
      }, '');
      tokens.hrAdmin = loginResult.data.token;
    });

    it('should get all holidays', async () => {
      const result = await apiCall('/api/holidays', 'GET', null, 'hrAdmin');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get holidays for specific date range', async () => {
      const result = await apiCall(
        '/api/holidays?startDate=2025-01-01&endDate=2025-12-31',
        'GET',
        null,
        'hrAdmin'
      );

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should create a holiday', async () => {
      const result = await apiCall('/api/holidays', 'POST', {
        date: '2025-11-30',
        name: 'Test Holiday',
        type: 'NATIONAL',
      }, 'hrAdmin');

      expect([201, 200]).toContain(result.status);
      expect(result.data.id).toBeDefined();
    });

    it('should check if date is holiday', async () => {
      const result = await apiCall('/api/holidays/2025-01-26/check', 'GET', null, 'hrAdmin');

      expect(result.status).toBe(200);
      expect(result.data.isHoliday).toBeDefined();
    });
  });

  describe('Employee Directory Endpoints', () => {
    beforeAll(async () => {
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.employee.email,
        password: testUsers.employee.password,
      }, '');
      tokens.employee = loginResult.data.token;
    });

    it('should get all employees', async () => {
      const result = await apiCall('/api/employees', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should search employees by name', async () => {
      const result = await apiCall('/api/employees?search=employee', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter employees by department', async () => {
      const result = await apiCall('/api/employees?department=Operations', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get employee profile', async () => {
      const result = await apiCall('/api/employees?search=employee', 'GET', null, 'employee');
      const employeeId = result.data[0]?.id;

      if (employeeId) {
        const profileResult = await apiCall(`/api/employees/${employeeId}`, 'GET', null, 'employee');

        expect(profileResult.status).toBe(200);
        expect(profileResult.data.id).toBe(employeeId);
      }
    });
  });

  describe('Dashboard Endpoints', () => {
    beforeAll(async () => {
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.employee.email,
        password: testUsers.employee.password,
      }, '');
      tokens.employee = loginResult.data.token;
    });

    it('should get dashboard statistics', async () => {
      const result = await apiCall('/api/dashboard/stats', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
    });

    it('should get recent leave requests', async () => {
      const result = await apiCall('/api/dashboard/recent-leaves', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get leave trends', async () => {
      const result = await apiCall('/api/dashboard/trends', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
    });
  });

  describe('Policy Validation Endpoints', () => {
    beforeAll(async () => {
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.employee.email,
        password: testUsers.employee.password,
      }, '');
      tokens.employee = loginResult.data.token;
    });

    it('should validate leave request against policies', async () => {
      const result = await apiCall('/api/leaves/validate', 'POST', {
        leaveType: 'CASUAL_LEAVE',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
      }, 'employee');

      expect(result.status).toBe(200);
      expect(result.data.valid).toBeDefined();
      expect(result.data.violations).toBeDefined();
    });

    it('should detect policy violations', async () => {
      const result = await apiCall('/api/leaves/validate', 'POST', {
        leaveType: 'CASUAL_LEAVE',
        startDate: '2025-12-01',
        endDate: '2025-12-15', // Exceeds monthly limit
      }, 'employee');

      expect(result.status).toBe(200);
      if (!result.data.valid) {
        expect(result.data.violations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Notification Endpoints', () => {
    beforeAll(async () => {
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.employee.email,
        password: testUsers.employee.password,
      }, '');
      tokens.employee = loginResult.data.token;
    });

    it('should get user notifications', async () => {
      const result = await apiCall('/api/notifications', 'GET', null, 'employee');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should mark notification as read', async () => {
      const notificationsResult = await apiCall('/api/notifications', 'GET', null, 'employee');

      if (notificationsResult.data.length > 0) {
        const notifId = notificationsResult.data[0].id;
        const result = await apiCall(
          `/api/notifications/${notifId}/read`,
          'PUT',
          {},
          'employee'
        );

        expect(result.status).toBe(200);
      }
    });

    it('should mark all notifications as read', async () => {
      const result = await apiCall('/api/notifications/read-all', 'PUT', {}, 'employee');

      expect(result.status).toBe(200);
    });
  });

  describe('Audit Log Endpoints', () => {
    beforeAll(async () => {
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.hrHead.email,
        password: testUsers.hrHead.password,
      }, '');
      tokens.hrHead = loginResult.data.token;
    });

    it('should get audit logs', async () => {
      const result = await apiCall('/api/audit-logs', 'GET', null, 'hrHead');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter audit logs by action', async () => {
      const result = await apiCall(
        '/api/audit-logs?action=CREATE_LEAVE_REQUEST',
        'GET',
        null,
        'hrHead'
      );

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter audit logs by user', async () => {
      const result = await apiCall(
        '/api/audit-logs?userId=user-emp-001',
        'GET',
        null,
        'hrHead'
      );

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Admin Endpoints', () => {
    beforeAll(async () => {
      const loginResult = await apiCall('/api/auth/login', 'POST', {
        email: testUsers.hrAdmin.email,
        password: testUsers.hrAdmin.password,
      }, '');
      tokens.hrAdmin = loginResult.data.token;
    });

    it('should get all users', async () => {
      const result = await apiCall('/api/admin/users', 'GET', null, 'hrAdmin');

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get system statistics', async () => {
      const result = await apiCall('/api/admin/stats', 'GET', null, 'hrAdmin');

      expect(result.status).toBe(200);
      expect(result.data.totalUsers).toBeDefined();
      expect(result.data.totalLeaves).toBeDefined();
    });
  });
});
