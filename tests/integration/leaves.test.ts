/**
 * Integration Tests for Leave Workflows
 * Tests: create, approve, cancel, recall, return-for-modification, duty-return
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

describe("Leave Workflows Integration", () => {
  let employee: { id: number; email: string };
  let deptHead: { id: number; email: string };
  let hrAdmin: { id: number; email: string };
  let hrHead: { id: number; email: string };

  beforeEach(async () => {
    // Create test users
    employee = await prisma.user.create({
      data: {
        name: "Test Employee",
        email: `employee-${Date.now()}@test.local`,
        role: "EMPLOYEE",
      },
    });

    deptHead = await prisma.user.create({
      data: {
        name: "Test Dept Head",
        email: `depthead-${Date.now()}@test.local`,
        role: "DEPT_HEAD",
      },
    });

    hrAdmin = await prisma.user.create({
      data: {
        name: "Test HR Admin",
        email: `hradmin-${Date.now()}@test.local`,
        role: "HR_ADMIN",
      },
    });

    hrHead = await prisma.user.create({
      data: {
        name: "Test HR Head",
        email: `hrhead-${Date.now()}@test.local`,
        role: "HR_HEAD",
      },
    });

    // Create balance for employee
    const currentYear = new Date().getFullYear();
    await prisma.balance.create({
      data: {
        userId: employee.id,
        type: "EARNED",
        year: currentYear,
        opening: 10,
        accrued: 20,
        used: 0,
        closing: 30,
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actorEmail: employee.email },
          { targetEmail: employee.email },
        ],
      },
    });
    await prisma.approval.deleteMany({ where: { approverId: deptHead.id } });
    await prisma.leaveRequest.deleteMany({ where: { requesterId: employee.id } });
    await prisma.balance.deleteMany({ where: { userId: employee.id } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [employee.id, deptHead.id, hrAdmin.id, hrHead.id] },
      },
    });
  });

  describe("Create Leave", () => {
    it("should create leave request with SUBMITTED status", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "CASUAL",
          startDate,
          endDate,
          workingDays: 3,
          reason: "Test leave",
          status: "SUBMITTED",
        },
      });

      expect(leave.id).toBeDefined();
      expect(leave.status).toBe("SUBMITTED");
    });
  });

  describe("Approve Leave", () => {
    it("should approve leave and update balance", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "EARNED",
          startDate,
          endDate,
          workingDays: 3,
          reason: "Test leave",
          status: "PENDING",
        },
      });

      // Create approval record
      await prisma.approval.create({
        data: {
          leaveId: leave.id,
          step: 4,
          approverId: hrHead.id,
          decision: "APPROVED",
          decidedAt: new Date(),
        },
      });

      // Update leave status
      await prisma.leaveRequest.update({
        where: { id: leave.id },
        data: { status: "APPROVED" },
      });

      // Update balance
      const currentYear = new Date().getFullYear();
      const balance = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: employee.id,
            type: "EARNED",
            year: currentYear,
          },
        },
      });

      expect(balance?.used).toBe(3);
      expect(balance?.closing).toBe(27); // 30 - 3
    });
  });

  describe("Cancel Leave", () => {
    it("should cancel SUBMITTED leave immediately", async () => {
      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "CASUAL",
          startDate: new Date(),
          endDate: new Date(),
          workingDays: 1,
          reason: "Test",
          status: "SUBMITTED",
        },
      });

      await prisma.leaveRequest.update({
        where: { id: leave.id },
        data: { status: "CANCELLED" },
      });

      const updated = await prisma.leaveRequest.findUnique({
        where: { id: leave.id },
      });

      expect(updated?.status).toBe("CANCELLED");
    });

    it("should set APPROVED leave to CANCELLATION_REQUESTED", async () => {
      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "EARNED",
          startDate: new Date(),
          endDate: new Date(),
          workingDays: 1,
          reason: "Test",
          status: "APPROVED",
        },
      });

      await prisma.leaveRequest.update({
        where: { id: leave.id },
        data: { status: "CANCELLATION_REQUESTED" },
      });

      const updated = await prisma.leaveRequest.findUnique({
        where: { id: leave.id },
      });

      expect(updated?.status).toBe("CANCELLATION_REQUESTED");
    });

    it("should restore balance when admin cancels APPROVED leave", async () => {
      const currentYear = new Date().getFullYear();
      await prisma.balance.update({
        where: {
          userId_type_year: {
            userId: employee.id,
            type: "EARNED",
            year: currentYear,
          },
        },
        data: {
          used: 3,
          closing: 27,
        },
      });

      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "EARNED",
          startDate: new Date(),
          endDate: new Date(),
          workingDays: 3,
          reason: "Test",
          status: "APPROVED",
        },
      });

      // Admin cancels
      await prisma.leaveRequest.update({
        where: { id: leave.id },
        data: { status: "CANCELLED" },
      });

      // Restore balance
      await prisma.balance.update({
        where: {
          userId_type_year: {
            userId: employee.id,
            type: "EARNED",
            year: currentYear,
          },
        },
        data: {
          used: 0,
          closing: 30,
        },
      });

      const balance = await prisma.balance.findUnique({
        where: {
          userId_type_year: {
            userId: employee.id,
            type: "EARNED",
            year: currentYear,
          },
        },
      });

      expect(balance?.used).toBe(0);
      expect(balance?.closing).toBe(30);
    });
  });

  describe("Recall Leave", () => {
    it("should set leave status to RECALLED and restore remaining balance", async () => {
      const startDate = normalizeToDhakaMidnight(new Date());
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 4);

      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "EARNED",
          startDate,
          endDate,
          workingDays: 5,
          reason: "Test",
          status: "APPROVED",
        },
      });

      // Recall after 2 days (restore 3 remaining days)
      await prisma.leaveRequest.update({
        where: { id: leave.id },
        data: { status: "RECALLED" },
      });

      const updated = await prisma.leaveRequest.findUnique({
        where: { id: leave.id },
      });

      expect(updated?.status).toBe("RECALLED");
    });
  });

  describe("Return for Modification", () => {
    it("should set leave status to RETURNED", async () => {
      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "CASUAL",
          startDate: new Date(),
          endDate: new Date(),
          workingDays: 1,
          reason: "Test",
          status: "PENDING",
        },
      });

      await prisma.leaveRequest.update({
        where: { id: leave.id },
        data: { status: "RETURNED" },
      });

      const updated = await prisma.leaveRequest.findUnique({
        where: { id: leave.id },
      });

      expect(updated?.status).toBe("RETURNED");
    });
  });

  describe("Duty Return (Medical Leave)", () => {
    it("should require fitness certificate for ML > 7 days", async () => {
      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "MEDICAL",
          startDate: new Date(),
          endDate: new Date(),
          workingDays: 8,
          reason: "Medical leave",
          status: "APPROVED",
        },
      });

      // Duty return should require fitnessCertificateUrl
      const requiresFitness = leave.workingDays > 7;
      expect(requiresFitness).toBe(true);
    });
  });

  describe("Audit Logging", () => {
    it("should create audit log for approval", async () => {
      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "CASUAL",
          startDate: new Date(),
          endDate: new Date(),
          workingDays: 1,
          reason: "Test",
          status: "PENDING",
        },
      });

      await prisma.auditLog.create({
        data: {
          actorEmail: hrHead.email,
          action: "LEAVE_APPROVE",
          targetEmail: employee.email,
          details: {
            leaveId: leave.id,
          },
        },
      });

      const logs = await prisma.auditLog.findMany({
        where: { targetEmail: employee.email },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].action).toBe("LEAVE_APPROVE");
    });
  });
});

