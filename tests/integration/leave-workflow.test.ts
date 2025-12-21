import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveService } from '@/lib/services/leave.service';
import { ApprovalService } from '@/lib/services/approval.service';
import { prisma } from '@/lib/prisma';
import { LeaveRepository } from '@/lib/repositories/leave.repository';

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
      findMany: vi.fn(),
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
    notifyLeaveForwarded: vi.fn(),
    notifyLeaveReturned: vi.fn(),
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
  getChainFor: vi.fn().mockReturnValue(['DEPT_HEAD', 'HR_ADMIN', 'HR_HEAD', 'CEO']), // Master Chain for Employee
  getStepForRole: vi.fn(),
  getNextRoleInChain: vi.fn().mockReturnValue('HR_ADMIN'),
  isFinalApprover: vi.fn().mockReturnValue(true), // Default for simple tests, override inside specific tests
}));

describe('Leave Workflow Integration', () => {
  const mockUser = {
    id: 1,
    email: 'employee@test.com',
    role: 'EMPLOYEE',
    department: 'IT',
    joinDate: new Date('2020-01-01'),
    retirementDate: new Date('2050-01-01'),
    deptHeadId: 2,
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
    requester: { role: 'EMPLOYEE' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a leave request successfully with DEPT_HEAD as first approver', async () => {
    // Setup mocks
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.leaveRequest.findFirst as any).mockResolvedValue(null); // No duplicate
    (LeaveRepository.create as any).mockResolvedValue(mockLeaveRequest);
    (prisma.approval.create as any).mockResolvedValue({ id: 1 });

    // Mock finding dept head
    (prisma.user.findUnique as any).mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce({ deptHeadId: 2 }); // findApprover call for DEPT_HEAD uses findUnique logic

    (prisma.user.findFirst as any).mockResolvedValue(undefined); // Fallback

    // Execute
    const result = await LeaveService.createLeaveRequest(1, {
      type: 'CASUAL',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-03'),
      reason: 'Vacation',
    });

    // Verify
    expect(result).toMatchObject({ success: true });
    expect(LeaveRepository.create).toHaveBeenCalled();
    // Should create approval for DEPT_HEAD (id 2)
    // Note: leave.service.ts logic calls findApprover, which we mocked via prisma.user.findUnique/findFirst
    // We expect prisma.approval.create to be called
    expect(prisma.approval.create).toHaveBeenCalled();
  });

  it('should approve a leave request and update type if provided (Superior Edit)', async () => {
    const leaveId = 100;
    const approverId = 3; // HR Admin

    // Mock existing leave
    const leaveWithRelations = {
      ...mockLeaveRequest,
      requester: { role: 'EMPLOYEE', email: 'emp@test.com' },
      approvals: []
    };
    (LeaveRepository.findById as any).mockResolvedValue(mockLeaveRequest);
    (prisma.leaveRequest.findUnique as any).mockResolvedValue(leaveWithRelations);

    // Mock transaction
    // Mock prisma.$transaction to execute the callback immediately
    (prisma.$transaction as any).mockImplementation(async (callback: any) => {
      return callback(prisma);
    });

    // Mocks for transaction operations
    (prisma.approval.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.approval.findMany as any).mockResolvedValue([{ decision: 'APPROVED' }]);
    (prisma.user.findUnique as any).mockResolvedValue({ id: approverId, name: 'HR Admin', role: 'HR_ADMIN' });

    // Mock isFinalApprover to return false (intermediate step)
    const workflow = await import('@/lib/workflow');
    (workflow.isFinalApprover as any).mockReturnValue(false);

    // Execute with new leave type
    const result = await ApprovalService.approve(
      leaveId,
      approverId,
      'Approved with type change',
      false,
      'EARNED' // Changing CASUAL to EARNED
    );

    // Verify
    expect(result).toMatchObject({ success: true, data: { approved: true, isFinal: false } });

    // Verify Leave Type Update
    expect(prisma.leaveRequest.update).toHaveBeenCalledWith({
      where: { id: leaveId },
      data: { type: 'EARNED', isModified: true }
    });

    // Verify Audit Log for type change
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'LEAVE_TYPE_CHANGED',
        details: expect.objectContaining({ oldType: 'CASUAL', newType: 'EARNED' })
      })
    }));
  });
});
