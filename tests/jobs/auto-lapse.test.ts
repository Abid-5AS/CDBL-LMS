/**
 * Unit tests for CL Auto-Lapse Job
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { processCLLapse } from "../../scripts/jobs/auto-lapse";
import { prisma } from "../../lib/prisma";

describe("CL Auto-Lapse Job", () => {
  let testUser: { id: number; email: string };

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: "Test Employee",
        email: `test-cl-lapse-${Date.now()}@test.local`,
        role: "EMPLOYEE",
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    if (testUser) {
      await prisma.balance.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  it("should reset CL balance to 0 on year-end", async () => {
    const currentYear = new Date().getFullYear();

    // Create CL balance with remaining days
    await prisma.balance.create({
      data: {
        userId: testUser.id,
        type: "CASUAL",
        year: currentYear,
        opening: 0,
        accrued: 10,
        used: 3,
        closing: 7, // 7 days remaining
      },
    });

    const results = await processCLLapse(currentYear);

    const userResult = results.find((r) => r.userId === testUser.id);
    expect(userResult).toBeDefined();
    expect(userResult?.previousBalance).toBe(7);

    // Verify balance was reset to 0
    const balance = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: testUser.id,
          type: "CASUAL",
          year: currentYear,
        },
      },
    });

    expect(balance?.opening).toBe(0);
    expect(balance?.accrued).toBe(0);
    expect(balance?.used).toBe(0);
    expect(balance?.closing).toBe(0);
  });

  it("should skip lapses if balance is already 0", async () => {
    const currentYear = new Date().getFullYear();

    // Create CL balance already at 0
    await prisma.balance.create({
      data: {
        userId: testUser.id,
        type: "CASUAL",
        year: currentYear,
        opening: 0,
        accrued: 10,
        used: 10,
        closing: 0,
      },
    });

    const results = await processCLLapse(currentYear);

    const userResult = results.find((r) => r.userId === testUser.id);
    expect(userResult).toBeUndefined(); // Should not be in results
  });

  it("should create audit log entry for lapsed balance", async () => {
    const currentYear = new Date().getFullYear();

    await prisma.balance.create({
      data: {
        userId: testUser.id,
        type: "CASUAL",
        year: currentYear,
        opening: 0,
        accrued: 10,
        used: 2,
        closing: 8,
      },
    });

    await processCLLapse(currentYear);

    // Check audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "CL_LAPSED",
        targetEmail: testUser.email,
      },
    });

    expect(auditLog).toBeDefined();
    expect(auditLog?.details).toMatchObject({
      userId: testUser.id,
      year: currentYear,
      previousBalance: 8,
      lapsedAmount: 8,
    });
  });
});

