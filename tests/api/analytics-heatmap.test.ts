import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

describe("API: /api/analytics/heatmap", () => {
  let employee1: { id: number; email: string };
  let employee2: { id: number; email: string };
  let deptHead: { id: number; email: string };

  beforeEach(async () => {
    deptHead = await prisma.user.create({
      data: {
        name: "Test Dept Head",
        email: `depthead-${Date.now()}@test.local`,
        role: "DEPT_HEAD",
        department: "IT",
      },
    });

    employee1 = await prisma.user.create({
      data: {
        name: "Employee One",
        email: `emp1-${Date.now()}@test.local`,
        role: "EMPLOYEE",
        department: "IT",
        deptHeadId: deptHead.id,
      },
    });

    employee2 = await prisma.user.create({
      data: {
        name: "Employee Two",
        email: `emp2-${Date.now()}@test.local`,
        role: "EMPLOYEE",
        department: "IT",
        deptHeadId: deptHead.id,
      },
    });
  });

  afterEach(async () => {
    await prisma.leaveRequest.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should return stable bucket counts for seeded period", async () => {
    const year = new Date().getFullYear();
    const startDate = normalizeToDhakaMidnight(new Date(year, 5, 1)); // June 1
    const endDate = normalizeToDhakaMidnight(new Date(year, 5, 5)); // June 5

    // Create approved leave
    await prisma.leaveRequest.create({
      data: {
        requesterId: employee1.id,
        type: "EARNED",
        startDate,
        endDate,
        workingDays: 5,
        reason: "Test leave",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    // Simulate API logic
    const periodStart = normalizeToDhakaMidnight(new Date(year, 0, 1));
    const periodEnd = normalizeToDhakaMidnight(new Date(year, 11, 31));

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: employee1.id,
        status: "APPROVED",
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      select: {
        type: true,
        startDate: true,
        endDate: true,
      },
    });

    // Create buckets
    const bucketMap = new Map<string, { count: number; types: Set<string> }>();
    const currentDate = new Date(periodStart);
    while (currentDate <= periodEnd) {
      const dateKey = normalizeToDhakaMidnight(currentDate).toISOString().slice(0, 10);
      bucketMap.set(dateKey, { count: 0, types: new Set() });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (const leave of leaves) {
      const leaveStart = normalizeToDhakaMidnight(leave.startDate);
      const leaveEnd = normalizeToDhakaMidnight(leave.endDate);
      const currentDate = new Date(leaveStart);

      while (currentDate <= leaveEnd) {
        const dateKey = normalizeToDhakaMidnight(currentDate).toISOString().slice(0, 10);
        const bucket = bucketMap.get(dateKey);
        if (bucket) {
          bucket.count += 1;
          bucket.types.add(leave.type);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const buckets = Array.from(bucketMap.entries())
      .filter(([_, value]) => value.count > 0)
      .map(([date, value]) => ({
        date,
        count: value.count,
        types: Array.from(value.types),
      }));

    // Should have 5 buckets (June 1-5)
    expect(buckets.length).toBe(5);
    expect(buckets.every((b) => b.count === 1)).toBe(true);
    expect(buckets.every((b) => b.types.includes("EARNED"))).toBe(true);
  });

  it("should respect team scope via deptHeadId", async () => {
    const year = new Date().getFullYear();
    const startDate = normalizeToDhakaMidnight(new Date(year, 5, 1));

    // Create leave for employee1
    await prisma.leaveRequest.create({
      data: {
        requesterId: employee1.id,
        type: "EARNED",
        startDate,
        endDate: startDate,
        workingDays: 1,
        reason: "Test",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    // Create leave for employee2 (same team)
    await prisma.leaveRequest.create({
      data: {
        requesterId: employee2.id,
        type: "CASUAL",
        startDate,
        endDate: startDate,
        workingDays: 1,
        reason: "Test",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    // Get team members
    const currentUser = await prisma.user.findUnique({
      where: { id: employee1.id },
      select: { deptHeadId: true },
    });

    const teamMembers = await prisma.user.findMany({
      where: { deptHeadId: currentUser.deptHeadId },
      select: { id: true },
    });

    const requesterIds = teamMembers.map((m) => m.id);

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        requesterId: { in: requesterIds },
        status: "APPROVED",
        startDate: { lte: normalizeToDhakaMidnight(new Date(year, 11, 31)) },
        endDate: { gte: normalizeToDhakaMidnight(new Date(year, 0, 1)) },
      },
    });

    // Should include both employees
    expect(leaves.length).toBe(2);
    expect(leaves.map((l) => l.requesterId).sort()).toEqual([employee1.id, employee2.id].sort());
  });
});


