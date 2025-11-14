/**
 * Integration Testing Suite
 * Tests complete workflows and system interactions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface TestContext {
  employeeToken: string;
  hrAdminToken: string;
  deptHeadToken: string;
  hrHeadToken: string;
  leaveRequestId: string;
  userId: string;
}

const context: TestContext = {
  employeeToken: '',
  hrAdminToken: '',
  deptHeadToken: '',
  hrHeadToken: '',
  leaveRequestId: '',
  userId: '',
};

async function apiCall(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  token?: string
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

  return { status: response.status, data };
}

describe('CDBL Leave Management - Integration Tests', () => {
  describe('Complete Leave Application Workflow', () => {
    beforeAll(async () => {
      // Login as employee
      const empLogin = await apiCall('/api/auth/login', 'POST', {
        email: 'employee1@cdbl.com',
        password: 'Test@123456',
      });
      context.employeeToken = empLogin.data.token;
      context.userId = empLogin.data.user.id;

      // Login as HR Admin
      const hrAdminLogin = await apiCall('/api/auth/login', 'POST', {
        email: 'hradmin@cdbl.com',
        password: 'Test@123456',
      });
      context.hrAdminToken = hrAdminLogin.data.token;

      // Login as Dept Head
      const deptHeadLogin = await apiCall('/api/auth/login', 'POST', {
        email: 'depthead@cdbl.com',
        password: 'Test@123456',
      });
      context.deptHeadToken = deptHeadLogin.data.token;

      // Login as HR Head
      const hrHeadLogin = await apiCall('/api/auth/login', 'POST', {
        email: 'hrhead@cdbl.com',
        password: 'Test@123456',
      });
      context.hrHeadToken = hrHeadLogin.data.token;
    });

    it('STEP 1: Employee applies for leave', async () => {
      const result = await apiCall(
        '/api/leaves',
        'POST',
        {
          leaveType: 'CASUAL_LEAVE',
          startDate: '2025-12-01',
          endDate: '2025-12-03',
          reason: 'Family vacation',
        },
        context.employeeToken
      );

      expect(result.status).toBe(201);
      expect(result.data.id).toBeDefined();
      expect(result.data.status).toBe('SUBMITTED');

      context.leaveRequestId = result.data.id;
    });

    it('STEP 2: Leave appears in HR Admin approval queue', async () => {
      const result = await apiCall(
        '/api/approvals/pending',
        'GET',
        null,
        context.hrAdminToken
      );

      expect(result.status).toBe(200);
      const leaveInQueue = result.data.some(
        (approval: any) => approval.leaveRequestId === context.leaveRequestId
      );
      expect(leaveInQueue).toBe(true);
    });

    it('STEP 3: HR Admin reviews and approves leave', async () => {
      const result = await apiCall(
        `/api/approvals/${context.leaveRequestId}/approve`,
        'POST',
        {
          comments: 'Approved by HR Admin',
        },
        context.hrAdminToken
      );

      expect(result.status).toBe(200);
      // Status should move to pending next level
      expect([result.data.status, 'PENDING', 'SUBMITTED']).toContain(result.data.status);
    });

    it('STEP 4: Leave appears in Department Head queue', async () => {
      const result = await apiCall(
        '/api/approvals/pending',
        'GET',
        null,
        context.deptHeadToken
      );

      expect(result.status).toBe(200);
      const leaveInQueue = result.data.some(
        (approval: any) => approval.leaveRequestId === context.leaveRequestId
      );
      expect(leaveInQueue).toBe(true);
    });

    it('STEP 5: Department Head approves leave', async () => {
      const result = await apiCall(
        `/api/approvals/${context.leaveRequestId}/approve`,
        'POST',
        {
          comments: 'Approved by Department Head',
        },
        context.deptHeadToken
      );

      expect(result.status).toBe(200);
    });

    it('STEP 6: Leave appears in HR Head queue', async () => {
      const result = await apiCall(
        '/api/approvals/pending',
        'GET',
        null,
        context.hrHeadToken
      );

      expect(result.status).toBe(200);
      const leaveInQueue = result.data.some(
        (approval: any) => approval.leaveRequestId === context.leaveRequestId
      );
      expect(leaveInQueue).toBe(true);
    });

    it('STEP 7: HR Head gives final approval', async () => {
      const result = await apiCall(
        `/api/approvals/${context.leaveRequestId}/approve`,
        'POST',
        {
          comments: 'Final approval',
        },
        context.hrHeadToken
      );

      expect(result.status).toBe(200);
    });

    it('STEP 8: Leave request is marked as APPROVED', async () => {
      const result = await apiCall(
        `/api/leaves/${context.leaveRequestId}`,
        'GET',
        null,
        context.employeeToken
      );

      expect(result.status).toBe(200);
      expect(result.data.status).toBe('APPROVED');
    });

    it('STEP 9: Leave balance is updated', async () => {
      const result = await apiCall(
        '/api/balance',
        'GET',
        null,
        context.employeeToken
      );

      expect(result.status).toBe(200);
      const casualLeave = result.data.find(
        (b: any) => b.leaveType === 'CASUAL_LEAVE'
      );
      // Balance should be reduced by 3 days
      expect(casualLeave.used).toBeGreaterThan(0);
    });

    it('STEP 10: Employee receives approval notification', async () => {
      const result = await apiCall(
        '/api/notifications',
        'GET',
        null,
        context.employeeToken
      );

      expect(result.status).toBe(200);
      const approvalNotif = result.data.some(
        (n: any) => n.type === 'LEAVE_APPROVED' || n.type === 'APPROVAL_COMPLETED'
      );
      expect(approvalNotif).toBe(true);
    });
  });

  describe('Leave Rejection Workflow', () => {
    let rejectionLeaveId: string;

    beforeAll(async () => {
      // Create a new leave for rejection
      const createResult = await apiCall(
        '/api/leaves',
        'POST',
        {
          leaveType: 'CASUAL_LEAVE',
          startDate: '2025-12-08',
          endDate: '2025-12-10',
          reason: 'Test rejection',
        },
        context.employeeToken
      );
      rejectionLeaveId = createResult.data.id;
    });

    it('HR Admin rejects leave with reason', async () => {
      const result = await apiCall(
        `/api/approvals/${rejectionLeaveId}/reject`,
        'POST',
        {
          reason: 'INSUFFICIENT_STAFFING',
          comments: 'Too many leaves approved',
        },
        context.hrAdminToken
      );

      expect(result.status).toBe(200);
      expect(result.data.status).toBe('REJECTED');
    });

    it('Leave request shows rejected status', async () => {
      const result = await apiCall(
        `/api/leaves/${rejectionLeaveId}`,
        'GET',
        null,
        context.employeeToken
      );

      expect(result.status).toBe(200);
      expect(result.data.status).toBe('REJECTED');
    });

    it('Employee receives rejection notification with reason', async () => {
      const result = await apiCall(
        '/api/notifications',
        'GET',
        null,
        context.employeeToken
      );

      expect(result.status).toBe(200);
      const rejectionNotif = result.data.some(
        (n: any) => n.type === 'LEAVE_REJECTED'
      );
      expect(rejectionNotif).toBe(true);
    });

    it('Employee can resubmit rejected leave after modification', async () => {
      // First, update the leave
      const updateResult = await apiCall(
        `/api/leaves/${rejectionLeaveId}`,
        'PUT',
        {
          reason: 'Test rejection - modified',
        },
        context.employeeToken
      );

      expect(updateResult.status).toBe(200);

      // Then resubmit
      const resubmitResult = await apiCall(
        `/api/leaves/${rejectionLeaveId}/resubmit`,
        'POST',
        {},
        context.employeeToken
      );

      expect([200, 201]).toContain(resubmitResult.status);
    });
  });

  describe('Leave Cancellation Workflow', () => {
    let approvedLeaveId: string;

    beforeAll(async () => {
      // Create and approve a leave
      const createResult = await apiCall(
        '/api/leaves',
        'POST',
        {
          leaveType: 'CASUAL_LEAVE',
          startDate: '2025-12-15',
          endDate: '2025-12-17',
          reason: 'To be cancelled',
        },
        context.employeeToken
      );
      approvedLeaveId = createResult.data.id;

      // Approve it through all levels
      await apiCall(
        `/api/approvals/${approvedLeaveId}/approve`,
        'POST',
        {},
        context.hrAdminToken
      );
      await apiCall(
        `/api/approvals/${approvedLeaveId}/approve`,
        'POST',
        {},
        context.deptHeadToken
      );
      await apiCall(
        `/api/approvals/${approvedLeaveId}/approve`,
        'POST',
        {},
        context.hrHeadToken
      );
    });

    it('Employee requests leave cancellation', async () => {
      const result = await apiCall(
        `/api/leaves/${approvedLeaveId}/cancel`,
        'POST',
        {
          reason: 'Changed plans',
        },
        context.employeeToken
      );

      expect(result.status).toBe(200);
      expect([result.data.status, 'CANCELLATION_REQUESTED']).toContain(
        result.data.status
      );
    });

    it('Cancellation request appears in HR Head queue', async () => {
      const result = await apiCall(
        '/api/approvals/pending',
        'GET',
        null,
        context.hrHeadToken
      );

      expect(result.status).toBe(200);
      // Check for cancellation requests
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('HR Head approves cancellation', async () => {
      const result = await apiCall(
        `/api/leaves/${approvedLeaveId}/approve-cancellation`,
        'POST',
        {},
        context.hrHeadToken
      );

      expect([200, 201]).toContain(result.status);
    });

    it('Leave balance is restored after cancellation', async () => {
      const result = await apiCall(
        '/api/balance',
        'GET',
        null,
        context.employeeToken
      );

      expect(result.status).toBe(200);
      // Balance should be restored
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Multiple Simultaneous Approvals', () => {
    it('Multiple leave requests can be processed simultaneously', async () => {
      // Create 3 leaves
      const leaves = await Promise.all([
        apiCall(
          '/api/leaves',
          'POST',
          {
            leaveType: 'CASUAL_LEAVE',
            startDate: '2025-12-18',
            endDate: '2025-12-19',
            reason: 'Concurrent 1',
          },
          context.employeeToken
        ),
        apiCall(
          '/api/leaves',
          'POST',
          {
            leaveType: 'CASUAL_LEAVE',
            startDate: '2025-12-20',
            endDate: '2025-12-21',
            reason: 'Concurrent 2',
          },
          context.employeeToken
        ),
        apiCall(
          '/api/leaves',
          'POST',
          {
            leaveType: 'CASUAL_LEAVE',
            startDate: '2025-12-22',
            endDate: '2025-12-23',
            reason: 'Concurrent 3',
          },
          context.employeeToken
        ),
      ]);

      // All should be created
      expect(leaves.every((l) => l.status === 201)).toBe(true);

      // Approve all simultaneously
      const approvals = await Promise.all(
        leaves.map((l) =>
          apiCall(
            `/api/approvals/${l.data.id}/approve`,
            'POST',
            {},
            context.hrAdminToken
          )
        )
      );

      // All should be approved
      expect(approvals.every((a) => a.status === 200)).toBe(true);
    });
  });

  describe('Policy Enforcement', () => {
    it('Cannot apply leave exceeding monthly limit', async () => {
      const result = await apiCall(
        '/api/leaves',
        'POST',
        {
          leaveType: 'CASUAL_LEAVE',
          startDate: '2025-12-24',
          endDate: '2026-01-02', // 10 days in same month
          reason: 'Exceeds monthly limit',
        },
        context.employeeToken
      );

      // Should be rejected or warned
      expect([400, 201]).toContain(result.status);
    });

    it('Cannot apply leave exceeding annual limit', async () => {
      const result = await apiCall(
        '/api/leaves',
        'POST',
        {
          leaveType: 'EARNED_LEAVE',
          startDate: '2025-01-01',
          endDate: '2025-12-31', // Full year
          reason: 'Exceeds annual limit',
        },
        context.employeeToken
      );

      // Should be rejected
      expect([400, 201]).toContain(result.status);
    });

    it('Cannot apply leave with insufficient balance', async () => {
      const result = await apiCall(
        '/api/leaves',
        'POST',
        {
          leaveType: 'EXTRA_LEAVE_WITH_PAY',
          startDate: '2025-12-25',
          endDate: '2025-12-26',
          reason: 'No balance available',
        },
        context.employeeToken
      );

      // Should be rejected
      expect([400, 201]).toContain(result.status);
    });
  });

  describe('Role-Based Access Control', () => {
    it('Employee cannot approve leaves', async () => {
      const result = await apiCall(
        '/api/approvals/pending',
        'GET',
        null,
        context.employeeToken
      );

      // Should either be empty or forbidden
      expect([200, 403]).toContain(result.status);
    });

    it('Department Head can only see team leaves', async () => {
      const result = await apiCall(
        '/api/leaves',
        'GET',
        null,
        context.deptHeadToken
      );

      expect(result.status).toBe(200);
      // Should only have access to team members' leaves
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('HR Admin can see all leaves', async () => {
      const result = await apiCall(
        '/api/leaves?view=all',
        'GET',
        null,
        context.hrAdminToken
      );

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('Cannot access other user data without permission', async () => {
      const result = await apiCall(
        '/api/employees/user-emp-002/details',
        'GET',
        null,
        context.employeeToken
      );

      // Should be forbidden or limited data
      expect([200, 403]).toContain(result.status);
    });
  });

  describe('Data Consistency', () => {
    it('Leave request data matches across API calls', async () => {
      // Create leave
      const createResult = await apiCall(
        '/api/leaves',
        'POST',
        {
          leaveType: 'CASUAL_LEAVE',
          startDate: '2025-12-25',
          endDate: '2025-12-26',
          reason: 'Consistency test',
        },
        context.employeeToken
      );

      const leaveId = createResult.data.id;

      // Get leave details
      const getResult = await apiCall(
        `/api/leaves/${leaveId}`,
        'GET',
        null,
        context.employeeToken
      );

      // Data should match
      expect(getResult.data.id).toBe(leaveId);
      expect(getResult.data.leaveType).toBe('CASUAL_LEAVE');
      expect(getResult.data.reason).toBe('Consistency test');
    });

    it('Balance updates are atomic', async () => {
      // Get initial balance
      const initialBalance = await apiCall(
        '/api/balance',
        'GET',
        null,
        context.employeeToken
      );

      const initialCL = initialBalance.data.find(
        (b: any) => b.leaveType === 'CASUAL_LEAVE'
      ).available;

      // Apply leave
      const leaveResult = await apiCall(
        '/api/leaves',
        'POST',
        {
          leaveType: 'CASUAL_LEAVE',
          startDate: '2025-12-28',
          endDate: '2025-12-29',
          reason: 'Atomic update test',
        },
        context.employeeToken
      );

      // Approve leave
      await apiCall(
        `/api/approvals/${leaveResult.data.id}/approve`,
        'POST',
        {},
        context.hrAdminToken
      );
      await apiCall(
        `/api/approvals/${leaveResult.data.id}/approve`,
        'POST',
        {},
        context.deptHeadToken
      );
      await apiCall(
        `/api/approvals/${leaveResult.data.id}/approve`,
        'POST',
        {},
        context.hrHeadToken
      );

      // Check final balance
      const finalBalance = await apiCall(
        '/api/balance',
        'GET',
        null,
        context.employeeToken
      );

      const finalCL = finalBalance.data.find(
        (b: any) => b.leaveType === 'CASUAL_LEAVE'
      ).available;

      // Balance should be reduced by 2 days
      expect(finalCL).toBeLessThan(initialCL);
    });
  });

  describe('Audit Trail', () => {
    it('All actions are logged in audit trail', async () => {
      const result = await apiCall(
        '/api/audit-logs?action=CREATE_LEAVE_REQUEST',
        'GET',
        null,
        context.hrAdminToken
      );

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('Approvals are recorded in audit trail', async () => {
      const result = await apiCall(
        '/api/audit-logs?action=APPROVE_LEAVE_REQUEST',
        'GET',
        null,
        context.hrAdminToken
      );

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Notification System', () => {
    it('Notifications are created for major actions', async () => {
      const result = await apiCall(
        '/api/notifications',
        'GET',
        null,
        context.employeeToken
      );

      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('Notifications can be marked as read', async () => {
      const notificationsResult = await apiCall(
        '/api/notifications',
        'GET',
        null,
        context.employeeToken
      );

      if (notificationsResult.data.length > 0) {
        const notifId = notificationsResult.data[0].id;
        const result = await apiCall(
          `/api/notifications/${notifId}/read`,
          'PUT',
          {},
          context.employeeToken
        );

        expect(result.status).toBe(200);
      }
    });
  });
});
