/**
 * Integration tests for Overstay Detection Job
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { processOverstayCheck } from "../../scripts/jobs/overstay-check";
import { prisma } from "../../lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { normalizeToDhakaMidnight } from "../../lib/date-utils";
import { subDays } from "date-fns";

describe("Overstay Detection Job", () => {
  let testUser: { id: number; email: string };

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: "Test Employee",
        email: `test-overstay-${Date.now()}@test.local`,
        role: "EMPLOYEE",
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    if (testUser) {
      await prisma.leaveRequest.deleteMany({ where: { requesterId: testUser.id } });
      await prisma.auditLog.deleteMany({ where: { targetEmail: testUser.email } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  it("should flag approved leave that has passed endDate without return", async () => {
    const today = normalizeToDhakaMidnight(new Date());
    const pastEndDate = subDays(today, 5); // 5 days ago

    // Create approved leave that ended 5 days ago
    const leave = await prisma.leaveRequest.create({
      data: {
        requesterId: testUser.id,
        type: "EARNED",
        startDate: subDays(pastEndDate, 7),
        endDate: pastEndDate,
        workingDays: 7,
        reason: "Vacation",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    const results = await processOverstayCheck(today);

    const leaveResult = results.find((r) => r.leaveId === leave.id);
    expect(leaveResult).toBeDefined();
    expect(leaveResult?.daysOverstayed).toBe(5);

    // Verify status was updated
    const updatedLeave = await prisma.leaveRequest.findUnique({
      where: { id: leave.id },
    });

    expect(updatedLeave?.status).toBe(LeaveStatus.OVERSTAY_PENDING);
  });

  it("should not flag MEDICAL leave with fitness certificate", async () => {
    const today = normalizeToDhakaMidnight(new Date());
    const pastEndDate = subDays(today, 3);

    // Create MEDICAL leave with fitness certificate
    const leave = await prisma.leaveRequest.create({
      data: {
        requesterId: testUser.id,
        type: "MEDICAL",
        startDate: subDays(pastEndDate, 10),
        endDate: pastEndDate,
        workingDays: 10,
        reason: "Sick leave",
        status: "APPROVED",
        policyVersion: "v2.0",
        fitnessCertificateUrl: "/api/files/signed/fitness-cert.pdf?expires=123&sig=abc",
      },
    });

    const results = await processOverstayCheck(today);

    const leaveResult = results.find((r) => r.leaveId === leave.id);
    expect(leaveResult).toBeUndefined(); // Should not be flagged

    // Verify status unchanged
    const updatedLeave = await prisma.leaveRequest.findUnique({
      where: { id: leave.id },
    });

    expect(updatedLeave?.status).toBe(LeaveStatus.APPROVED);
  });

  it("should create audit log entry for flagged overstay", async () => {
    const today = normalizeToDhakaMidnight(new Date());
    const pastEndDate = subDays(today, 2);

    const leave = await prisma.leaveRequest.create({
      data: {
        requesterId: testUser.id,
        type: "CASUAL",
        startDate: subDays(pastEndDate, 3),
        endDate: pastEndDate,
        workingDays: 3,
        reason: "Personal",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    await processOverstayCheck(today);

    // Check audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "OVERSTAY_FLAGGED",
        targetEmail: testUser.email,
      },
    });

    expect(auditLog).toBeDefined();
    expect(auditLog?.details).toMatchObject({
      leaveId: leave.id,
      daysOverstayed: 2,
      leaveType: "CASUAL",
    });
  });

  it("should skip already flagged overstays", async () => {
    const today = normalizeToDhakaMidnight(new Date());
    const pastEndDate = subDays(today, 1);

    // Create leave already flagged as overstay
    const leave = await prisma.leaveRequest.create({
      data: {
        requesterId: testUser.id,
        type: "EARNED",
        startDate: subDays(pastEndDate, 5),
        endDate: pastEndDate,
        workingDays: 5,
        reason: "Leave",
        status: "OVERSTAY_PENDING",
        policyVersion: "v2.0",
      },
    });

    const results = await processOverstayCheck(today);

    const leaveResult = results.find((r) => r.leaveId === leave.id);
    expect(leaveResult).toBeUndefined(); // Should not be in results again
  });
});

