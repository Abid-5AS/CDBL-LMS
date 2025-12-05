import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LeaveService } from '@/lib/services/leave.service';
import { ApprovalService } from '@/lib/services/approval.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    leaveRequest: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    approval: {
      create: vi.fn(),
      createMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    leaveBalance: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    balance: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

// Mock NotificationService
vi.mock('@/lib/services/notification.service', () => ({
  NotificationService: {
    notifyLeaveSubmitted: vi.fn(),
    notifyLeaveApproved: vi.fn(),
    notifyLeaveRejected: vi.fn(),
    notifyApprover: vi.fn(),
  },
}));

// Mock Webhook Events
vi.mock('@/lib/webhooks/events', () => ({
  notifyLeaveSubmitted: vi.fn(),
  notifyLeaveApproved: vi.fn(),
  notifyLeaveRejected: vi.fn(),
}));

// Mock WebhookService
vi.mock('@/lib/services/webhook.service', () => ({
  WebhookService: {
    dispatch: vi.fn(),
  },
}));

// Mock LeaveValidator
vi.mock('@/lib/services/leave-validator', () => ({
  LeaveValidator: {
    validateLeaveRequest: vi.fn().mockResolvedValue({ valid: true }),
    validateFileUpload: vi.fn().mockReturnValue({ valid: true }),
  },
}));

// Mock LeaveRepository
vi.mock('@/lib/repositories/leave.repository', () => ({
  LeaveRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

// Mock ApprovalRepository
vi.mock('@/lib/repositories/approval.repository', () => ({
  ApprovalRepository: {
    updateByLeaveAndApprover: vi.fn().mockResolvedValue(1),
    create: vi.fn(),
    findPendingForApprover: vi.fn(),
    findByApproverId: vi.fn(),
    getApproverStats: vi.fn(),
    getNextStep: vi.fn(),
  },
}));

// Mock CalendarService
vi.mock('@/lib/integrations/calendar/calendar-service', () => ({
  CalendarService: {
    syncLeaveEvent: vi.fn(),
  },
}));

// Mock Workflow
vi.mock('@/lib/workflow', () => ({
  getChainFor: vi.fn().mockReturnValue(['HR_ADMIN', 'DEPT_HEAD', 'HR_HEAD']),
  getStepForRole: vi.fn(),
  getNextRoleInChain: vi.fn().mockReturnValue('DEPT_HEAD'),
}));

import { LeaveRepository } from '@/lib/repositories/leave.repository';

describe('Leave Workflow Integration', () => {
  const mockUser = {
    id: 1,
    email: 'employee@test.com',
    role: 'EMPLOYEE',
    department: 'IT',
    joinDate: new Date('2020-01-01'),
    retirementDate: new Date('2050-01-01'),
  };

  const mockLeaveRequest = {
    id: 100,
    requesterId: 1,
    type: 'CASUAL',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-03'),
    workingDays: 3,
    reason: 'Vacation',
    status: 'SUBMITTED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBalance = {
    id: 1,
    userId: 1,
    year: 2025,
    type: 'CASUAL',
    opening: 10,
    accrued: 0,
    used: 0,
    closing: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a leave request successfully', async () => {
    // Setup mocks
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.leaveRequest.findFirst as any).mockResolvedValue(null); // No duplicate
    (LeaveRepository.create as any).mockResolvedValue(mockLeaveRequest);
    (prisma.approval.create as any).mockResolvedValue({ id: 1 });
    (prisma.user.findFirst as any).mockResolvedValue({ id: 2 }); // Approver

    // Execute
    const result = await LeaveService.createLeaveRequest(1, {
      type: 'CASUAL',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-03'),
      reason: 'Vacation',
    });



    // Verify
    expect(result).toMatchObject({ success: true });
    expect(result.data).toBeDefined();
    expect(LeaveRepository.create).toHaveBeenCalled();
    expect(prisma.approval.create).toHaveBeenCalled();
  });

  it('should approve a leave request and update balance on final approval', async () => {
    // Setup mocks for final approval
    const leaveId = 100;
    const approverId = 2; // HR Head
    
    (LeaveRepository.findById as any).mockResolvedValue(mockLeaveRequest);
    
    // Mock finding the pending approval
    (prisma.approval.findFirst as any).mockResolvedValue({
      id: 50,
      leaveId: leaveId,
      approverId: approverId,
      status: 'PENDING',
      step: 3, // Final step
      approver: { role: 'HR_HEAD' }
    });

    // Mock updating approval via repository
    // (ApprovalRepository.updateByLeaveAndApprover as any).mockResolvedValue(1); // Already mocked globally

    // Mock checking if it's the final approval
    // We need to mock isFinalApproval private method logic or its dependencies
    // Since isFinalApproval uses prisma.leaveRequest.findUnique with includes, we need to mock that
    (prisma.leaveRequest.findUnique as any).mockResolvedValue({
      ...mockLeaveRequest,
      requester: { role: 'EMPLOYEE' },
      approvals: [
        { step: 3, decision: 'APPROVED', approver: { role: 'HR_HEAD' } },
        { step: 2, decision: 'APPROVED', approver: { role: 'DEPT_HEAD' } },
        { step: 1, decision: 'APPROVED', approver: { role: 'HR_ADMIN' } },
      ]
    });

    // Mock workflow chain (already mocked at top level)

    // Mock user for notification
    (prisma.user.findUnique as any).mockResolvedValue({ id: approverId, name: 'HR Head' });

    // Mock balance for deduction
    // Note: deductFromBalance uses prisma.balance (not leaveBalance) based on code inspection
    // Mock balance for deduction
    (prisma.balance.findUnique as any).mockResolvedValue({
      id: 1,
      userId: 1,
      type: 'CASUAL',
      year: 2025,
      opening: 10,
      accrued: 0,
      used: 0,
      closing: 10,
    });
    (prisma.balance.update as any).mockResolvedValue({ id: 1 });

    // Execute
    const result = await ApprovalService.approve(leaveId, approverId, 'Approved');

    if (!result.success) {
      console.log('Approve Leave Failed:', JSON.stringify(result, null, 2));
    }

    // Verify
    expect(result).toMatchObject({ success: true });
    expect(result.data?.isFinal).toBe(true);
    expect(LeaveRepository.updateStatus).toHaveBeenCalledWith(leaveId, 'APPROVED');
    // Balance deduction verification
    expect(prisma.balance.update).toHaveBeenCalled();
  });
});
