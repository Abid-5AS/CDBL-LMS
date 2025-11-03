/**
 * Unit tests for EL Accrual Job
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { processELAccrual } from "../../scripts/jobs/el-accrual";
import { prisma } from "../../lib/prisma";
import { policy } from "../../lib/policy";

describe("EL Accrual Job", () => {
  let testUser: { id: number; email: string };

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: "Test Employee",
        email: `test-el-accrual-${Date.now()}@test.local`,
        role: "EMPLOYEE",
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    if (testUser) {
      await prisma.balance.deleteMany({ where: { userId: testUser.id } });
      await prisma.leaveRequest.deleteMany({ where: { requesterId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  it("should accrue 2 days per month when employee is on duty", async () => {
    const currentYear = new Date().getFullYear();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    // Create balance record
    await prisma.balance.create({
      data: {
        userId: testUser.id,
        type: "EARNED",
        year: currentYear,
        opening: 10,
        accrued: 20,
        used: 5,
        closing: 25,
      },
    });

    const results = await processELAccrual(previousMonth);

    const userResult = results.find((r) => r.userId === testUser.id);
    expect(userResult).toBeDefined();
    expect(userResult?.accrued).toBe(policy.elAccrualPerMonth); // 2 days
    expect(userResult?.skipped).toBe(false);

    // Verify balance was updated
    const balance = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: testUser.id,
          type: "EARNED",
          year: currentYear,
        },
      },
    });

    expect(balance?.accrued).toBe(22); // 20 + 2
    expect(balance?.closing).toBe(27); // (10 + 22) - 5
  });

  it("should skip accrual when employee was on leave entire month", async () => {
    const currentYear = new Date().getFullYear();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const monthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
    const monthEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);

    // Create balance record
    await prisma.balance.create({
      data: {
        userId: testUser.id,
        type: "EARNED",
        year: currentYear,
        opening: 10,
        accrued: 20,
        used: 5,
        closing: 25,
      },
    });

    // Create approved leave covering entire month
    await prisma.leaveRequest.create({
      data: {
        requesterId: testUser.id,
        type: "EARNED",
        startDate: monthStart,
        endDate: monthEnd,
        workingDays: 30,
        reason: "Long leave",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    const results = await processELAccrual(previousMonth);

    const userResult = results.find((r) => r.userId === testUser.id);
    expect(userResult).toBeDefined();
    expect(userResult?.accrued).toBe(0);
    expect(userResult?.skipped).toBe(true);
    expect(userResult?.reason).toContain("entire month");

    // Verify balance was NOT updated
    const balance = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: testUser.id,
          type: "EARNED",
          year: currentYear,
        },
      },
    });

    expect(balance?.accrued).toBe(20); // Unchanged
  });

  it("should cap accrual at 60 days total carry-forward", async () => {
    const currentYear = new Date().getFullYear();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    // Create balance at 59 days (1 day below cap)
    await prisma.balance.create({
      data: {
        userId: testUser.id,
        type: "EARNED",
        year: currentYear,
        opening: 30,
        accrued: 29, // Total: 59
        used: 0,
        closing: 59,
      },
    });

    const results = await processELAccrual(previousMonth);

    const userResult = results.find((r) => r.userId === testUser.id);
    expect(userResult).toBeDefined();
    expect(userResult?.accrued).toBe(1); // Only 1 day accrued (capped at 60)
    expect(userResult?.reason).toContain("Capped at 60");

    // Verify balance capped at 60
    const balance = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: testUser.id,
          type: "EARNED",
          year: currentYear,
        },
      },
    });

    expect(balance?.accrued).toBe(30); // 29 + 1
    expect((balance?.opening || 0) + (balance?.accrued || 0)).toBe(60);
  });
});

