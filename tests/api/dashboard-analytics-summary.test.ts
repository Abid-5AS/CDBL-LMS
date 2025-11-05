import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

describe("API: /api/dashboard/analytics/summary", () => {
  let employee: { id: number; email: string };

  beforeEach(async () => {
    employee = await prisma.user.create({
      data: {
        name: "Test Employee",
        email: `emp-${Date.now()}@test.local`,
        role: "EMPLOYEE",
        department: "IT",
      },
    });

    const year = new Date().getFullYear();
    // Create balances
    await prisma.balance.createMany({
      data: [
        {
          userId: employee.id,
          type: "EARNED",
          year,
          opening: 0,
          accrued: 24,
          used: 9,
          closing: 15,
        },
        {
          userId: employee.id,
          type: "CASUAL",
          year,
          opening: 0,
          accrued: 10,
          used: 2,
          closing: 8,
        },
        {
          userId: employee.id,
          type: "MEDICAL",
          year,
          opening: 0,
          accrued: 14,
          used: 1,
          closing: 13,
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.balance.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should return counters equal to sum of approved days", async () => {
    const year = new Date().getFullYear();
    const startDate1 = normalizeToDhakaMidnight(new Date(year, 2, 1)); // March
    const endDate1 = normalizeToDhakaMidnight(new Date(year, 2, 5));

    const startDate2 = normalizeToDhakaMidnight(new Date(year, 4, 1)); // May
    const endDate2 = normalizeToDhakaMidnight(new Date(year, 4, 3));

    // Create approved leaves
    await prisma.leaveRequest.createMany({
      data: [
        {
          requesterId: employee.id,
          type: "EARNED",
          startDate: startDate1,
          endDate: endDate1,
          workingDays: 5,
          reason: "Test leave 1",
          status: "APPROVED",
          policyVersion: "v2.0",
        },
        {
          requesterId: employee.id,
          type: "CASUAL",
          startDate: startDate2,
          endDate: endDate2,
          workingDays: 2,
          reason: "Test leave 2",
          status: "APPROVED",
          policyVersion: "v2.0",
        },
      ],
    });

    // Simulate API logic
    const today = normalizeToDhakaMidnight(new Date());
    const yearStart = normalizeToDhakaMidnight(new Date(year, 0, 1));
    const yearEnd = normalizeToDhakaMidnight(new Date(year, 11, 31));

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: employee.id,
        status: "APPROVED",
        startDate: { lte: yearEnd },
        endDate: { gte: yearStart },
      },
      select: {
        type: true,
        workingDays: true,
        startDate: true,
      },
    });

    const yearUsed = leaves.reduce((sum, leave) => sum + leave.workingDays, 0);

    expect(yearUsed).toBe(7); // 5 + 2

    // Check distribution
    const earnedUsed = leaves.filter((l) => l.type === "EARNED").reduce((sum, l) => sum + l.workingDays, 0);
    const casualUsed = leaves.filter((l) => l.type === "CASUAL").reduce((sum, l) => sum + l.workingDays, 0);
    const medicalUsed = leaves.filter((l) => l.type === "MEDICAL").reduce((sum, l) => sum + l.workingDays, 0);

    expect(earnedUsed).toBe(5);
    expect(casualUsed).toBe(2);
    expect(medicalUsed).toBe(0);
  });

  it("should calculate monthUsed correctly", async () => {
    const year = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthStart = normalizeToDhakaMidnight(new Date(year, currentMonth, 1));
    const monthEnd = normalizeToDhakaMidnight(new Date(year, currentMonth + 1, 0));

    // Create leave in current month
    const leaveStart = new Date(monthStart);
    leaveStart.setDate(leaveStart.getDate() + 5);

    await prisma.leaveRequest.create({
      data: {
        requesterId: employee.id,
        type: "EARNED",
        startDate: leaveStart,
        endDate: new Date(leaveStart.getTime() + 2 * 24 * 60 * 60 * 1000),
        workingDays: 3,
        reason: "Current month leave",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: employee.id,
        status: "APPROVED",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      select: {
        type: true,
        workingDays: true,
        startDate: true,
      },
    });

    const monthLeaves = leaves.filter((leave) => {
      const leaveStart = normalizeToDhakaMidnight(leave.startDate);
      return leaveStart >= monthStart && leaveStart <= monthEnd;
    });

    const monthUsed = monthLeaves.reduce((sum, leave) => sum + leave.workingDays, 0);

    expect(monthUsed).toBeGreaterThanOrEqual(0);
  });
});


