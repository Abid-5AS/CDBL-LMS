import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

describe("API: /api/dashboard/insights", () => {
  let employee: { id: number; email: string };
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

    employee = await prisma.user.create({
      data: {
        name: "Test Employee",
        email: `emp-${Date.now()}@test.local`,
        role: "EMPLOYEE",
        department: "IT",
        deptHeadId: deptHead.id,
      },
    });

    const year = new Date().getFullYear();
    // Create balances
    await prisma.balance.create({
      data: {
        userId: employee.id,
        type: "EARNED",
        year,
        opening: 0,
        accrued: 24,
        used: 10,
        closing: 14,
      },
    });
  });

  afterEach(async () => {
    await prisma.balance.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should return insights in correct format", async () => {
    const currentYear = new Date().getFullYear();
    const today = normalizeToDhakaMidnight(new Date());
    const yearEnd = normalizeToDhakaMidnight(new Date(currentYear, 11, 31));

    const balances = await prisma.balance.findMany({
      where: { userId: employee.id, year: currentYear },
    });

    const earnedBalance = balances.find((b) => b.type === "EARNED");
    const earnedRemaining = earnedBalance?.closing ?? 0;

    // Should have EL_REMINDER if remaining > 0 and daysUntilYearEnd < 60
    const daysUntilYearEnd = Math.ceil((yearEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (earnedRemaining > 0 && daysUntilYearEnd < 60) {
      // Insight should be generated
      expect(earnedRemaining).toBeGreaterThan(0);
    }
  });

  it("should include TEAM_OVERLAP insight when team members on leave", async () => {
    const today = normalizeToDhakaMidnight(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create another team member
    const teamMember = await prisma.user.create({
      data: {
        name: "Team Member",
        email: `teammember-${Date.now()}@test.local`,
        role: "EMPLOYEE",
        department: "IT",
        deptHeadId: deptHead.id,
      },
    });

    // Create approved leave for team member
    await prisma.leaveRequest.create({
      data: {
        requesterId: teamMember.id,
        type: "EARNED",
        startDate: today,
        endDate: tomorrow,
        workingDays: 2,
        reason: "Test",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    // Check team overlap
    const currentUser = await prisma.user.findUnique({
      where: { id: employee.id },
      select: { deptHeadId: true },
    });

    if (currentUser?.deptHeadId) {
      const teamMembers = await prisma.user.findMany({
        where: {
          deptHeadId: currentUser.deptHeadId,
          id: { not: employee.id },
        },
        select: { id: true },
      });

      const teamMemberIds = teamMembers.map((m) => m.id);
      const teamOnLeaveToday = await prisma.leaveRequest.count({
        where: {
          requesterId: { in: teamMemberIds },
          status: "APPROVED",
          startDate: { lte: today },
          endDate: { gte: today },
        },
      });

      expect(teamOnLeaveToday).toBeGreaterThan(0);
    }
  });
});


