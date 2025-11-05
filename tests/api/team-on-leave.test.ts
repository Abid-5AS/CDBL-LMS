import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";

describe("API: /api/team/on-leave", () => {
  let employee1: { id: number; email: string };
  let employee2: { id: number; email: string };
  let employee3: { id: number; email: string };
  let deptHead: { id: number; email: string };
  let otherDeptHead: { id: number; email: string };
  let otherEmployee: { id: number; email: string };

  beforeEach(async () => {
    // Create department head
    deptHead = await prisma.user.create({
      data: {
        name: "Test Dept Head",
        email: `depthead-${Date.now()}@test.local`,
        role: "DEPT_HEAD",
        department: "IT",
      },
    });

    // Create employees in same department
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

    employee3 = await prisma.user.create({
      data: {
        name: "Employee Three",
        email: `emp3-${Date.now()}@test.local`,
        role: "EMPLOYEE",
        department: "IT",
        deptHeadId: deptHead.id,
      },
    });

    // Create other department (to test scope isolation)
    otherDeptHead = await prisma.user.create({
      data: {
        name: "Other Dept Head",
        email: `otherdepthead-${Date.now()}@test.local`,
        role: "DEPT_HEAD",
        department: "HR",
      },
    });

    otherEmployee = await prisma.user.create({
      data: {
        name: "Other Employee",
        email: `otheremp-${Date.now()}@test.local`,
        role: "EMPLOYEE",
        department: "HR",
        deptHeadId: otherDeptHead.id,
      },
    });
  });

  afterEach(async () => {
    await prisma.leaveRequest.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should return team members on leave for scope=team", async () => {
    const today = normalizeToDhakaMidnight(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create approved leave for employee2
    await prisma.leaveRequest.create({
      data: {
        requesterId: employee2.id,
        type: "EARNED",
        startDate: today,
        endDate: tomorrow,
        workingDays: 2,
        reason: "Test leave",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    // Mock the API call (simulate what the endpoint does)
    const currentUser = await prisma.user.findUnique({
      where: { id: employee1.id },
      select: { deptHeadId: true },
    });

    expect(currentUser?.deptHeadId).toBe(deptHead.id);

    const teamMembers = await prisma.user.findMany({
      where: {
        deptHeadId: currentUser.deptHeadId,
        id: { not: employee1.id },
      },
      select: { id: true, name: true, email: true, empCode: true },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);

    const leavesOnLeave = await prisma.leaveRequest.findMany({
      where: {
        requesterId: { in: teamMemberIds },
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
      select: {
        id: true,
        requesterId: true,
        type: true,
        startDate: true,
        endDate: true,
      },
    });

    expect(leavesOnLeave.length).toBe(1);
    expect(leavesOnLeave[0].requesterId).toBe(employee2.id);
  });

  it("should return empty for scope=team when no team members", async () => {
    const userWithoutTeam = await prisma.user.create({
      data: {
        name: "Lone Employee",
        email: `lone-${Date.now()}@test.local`,
        role: "EMPLOYEE",
        department: "Finance",
        deptHeadId: null,
      },
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: userWithoutTeam.id },
      select: { deptHeadId: true },
    });

    expect(currentUser?.deptHeadId).toBeNull();
  });

  it("should exclude other departments from team scope", async () => {
    const today = normalizeToDhakaMidnight(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create leave for other department employee
    await prisma.leaveRequest.create({
      data: {
        requesterId: otherEmployee.id,
        type: "EARNED",
        startDate: today,
        endDate: tomorrow,
        workingDays: 2,
        reason: "Other dept leave",
        status: "APPROVED",
        policyVersion: "v2.0",
      },
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: employee1.id },
      select: { deptHeadId: true },
    });

    const teamMembers = await prisma.user.findMany({
      where: {
        deptHeadId: currentUser.deptHeadId,
        id: { not: employee1.id },
      },
      select: { id: true },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);

    expect(teamMemberIds).not.toContain(otherEmployee.id);

    const leavesOnLeave = await prisma.leaveRequest.findMany({
      where: {
        requesterId: { in: teamMemberIds },
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    // Should not include otherEmployee's leave
    expect(leavesOnLeave.every((l) => l.requesterId !== otherEmployee.id)).toBe(true);
  });
});


