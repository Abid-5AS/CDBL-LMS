import { prisma } from "../lib/prisma";
import { LeaveType, Role, LeaveStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { initDefaultOrgSettings } from "../lib/org-settings";
import { countWorkingDaysSync } from "../lib/working-days";

const YEAR = new Date().getFullYear();

async function upsertBalances(userId: number) {
  const templates: Array<{ type: LeaveType; accrued: number }> = [
    { type: LeaveType.EARNED, accrued: 24 }, // Policy v2.0: 24 days/year (2 × 12 months)
    { type: LeaveType.CASUAL, accrued: 10 },
    { type: LeaveType.MEDICAL, accrued: 14 },
  ];

  for (const template of templates) {
    await prisma.balance.upsert({
      where: { userId_type_year: { userId, type: template.type, year: YEAR } },
      update: {},
      create: {
        userId,
        type: template.type,
        year: YEAR,
        opening: 0,
        accrued: template.accrued,
        used: 0,
        closing: template.accrued,
      },
    });
  }
}

async function upsertUser(user: {
  name: string;
  email: string;
  role: Role;
  empCode?: string;
  department?: string;
  password?: string;
}) {
  const password = user.password || await bcrypt.hash("demo123", 10);
  
  const created = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      role: user.role,
      empCode: user.empCode,
      department: user.department,
      password,
    },
    create: {
      name: user.name,
      email: user.email,
      role: user.role,
      empCode: user.empCode,
      department: user.department,
      password,
    },
  });

  await upsertBalances(created.id);
  return created;
}

async function seedHoliday() {
  // All holidays for 2025 from CDBL's official list
  const holidays = [
    { date: `${YEAR}-01-01T00:00:00.000Z`, name: "New Year's Day" },
    { date: `${YEAR}-02-15T00:00:00.000Z`, name: "Shab-e-Barat", isOptional: true },
    { date: `${YEAR}-02-21T00:00:00.000Z`, name: "Shaheed Day and International Mother Language Day" },
    { date: `${YEAR}-03-26T00:00:00.000Z`, name: "Independence & National day" },
    { date: `${YEAR}-03-28T00:00:00.000Z`, name: "Shab-e-Qadar", isOptional: true },
    // Eid-ul-Fitr spans multiple days
    { date: `${YEAR}-03-29T00:00:00.000Z`, name: "Eid-ul-Fitr" },
    { date: `${YEAR}-03-30T00:00:00.000Z`, name: "Eid-ul-Fitr" },
    { date: `${YEAR}-03-31T00:00:00.000Z`, name: "Eid-ul-Fitr" },
    { date: `${YEAR}-04-01T00:00:00.000Z`, name: "Eid-ul-Fitr" },
    { date: `${YEAR}-04-02T00:00:00.000Z`, name: "Eid-ul-Fitr" },
    { date: `${YEAR}-04-14T00:00:00.000Z`, name: "Bengali New Year's day" },
    { date: `${YEAR}-05-01T00:00:00.000Z`, name: "May Day" },
    { date: `${YEAR}-05-11T00:00:00.000Z`, name: "Budha Purnima", isOptional: true },
    // Eid-ul-Azha spans multiple days
    { date: `${YEAR}-06-05T00:00:00.000Z`, name: "Eid-ul-Azha" },
    { date: `${YEAR}-06-06T00:00:00.000Z`, name: "Eid-ul-Azha" },
    { date: `${YEAR}-06-07T00:00:00.000Z`, name: "Eid-ul-Azha" },
    { date: `${YEAR}-06-08T00:00:00.000Z`, name: "Eid-ul-Azha" },
    { date: `${YEAR}-06-09T00:00:00.000Z`, name: "Eid-ul-Azha" },
    { date: `${YEAR}-06-10T00:00:00.000Z`, name: "Eid-ul-Azha" },
    { date: `${YEAR}-07-01T00:00:00.000Z`, name: "Trading Holiday (Bank Holiday)" },
    { date: `${YEAR}-07-06T00:00:00.000Z`, name: "Muharram (Ashura)", isOptional: true },
    { date: `${YEAR}-08-16T00:00:00.000Z`, name: "Janmashtami", isOptional: true },
    { date: `${YEAR}-09-05T00:00:00.000Z`, name: "Eid-E-Milad-un-Nabi" },
    // Durgapuja spans multiple days
    { date: `${YEAR}-10-01T00:00:00.000Z`, name: "Durgapuja" },
    { date: `${YEAR}-10-02T00:00:00.000Z`, name: "Durgapuja" },
    { date: `${YEAR}-12-16T00:00:00.000Z`, name: "Victory Day" },
    { date: `${YEAR}-12-25T00:00:00.000Z`, name: "Christmas Day" },
    { date: `${YEAR}-12-31T00:00:00.000Z`, name: "Trading Holiday (Bank Holiday)" },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { date: new Date(holiday.date) },
      update: {
        name: holiday.name,
        isOptional: holiday.isOptional ?? false,
      },
      create: {
        date: new Date(holiday.date),
        name: holiday.name,
        isOptional: holiday.isOptional ?? false,
      },
    });
  }
}

async function seedPolicies() {
  const policies: Array<{
    leaveType: LeaveType;
    maxDays?: number;
    minDays?: number;
    noticeDays?: number;
    carryLimit?: number;
  }> = [
    { leaveType: LeaveType.CASUAL, maxDays: 7, noticeDays: 5 },
    { leaveType: LeaveType.MEDICAL, maxDays: 14, minDays: 1 },
    { leaveType: LeaveType.EARNED, maxDays: 30, noticeDays: 5, carryLimit: 60 }, // Policy v2.0: 5 working days per 6.11
  ];

  const policyClient = (prisma as any).policyConfig as {
    upsert: (args: unknown) => Promise<unknown>;
  };

  if (!policyClient) {
    console.warn("PolicyConfig model missing; skipping policy seeding.");
    return;
  }

  await Promise.all(
    policies.map((policy) =>
      policyClient.upsert({
        where: { leaveType: policy.leaveType },
        update: policy,
        create: policy,
      }),
    ),
  );
}

// Helper function to find next working day (Sun-Thu)
function getNextWorkingDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const day = next.getDay();
  // Skip weekends (Fri=5, Sat=6)
  if (day === 5) next.setDate(next.getDate() + 2); // Skip to Sunday
  if (day === 6) next.setDate(next.getDate() + 1); // Skip to Sunday
  return next;
}

// Helper function to get date N working days from today
function getFutureWorkingDate(daysFromNow: number): Date {
  let date = new Date();
  date.setHours(0, 0, 0, 0);
  for (let i = 0; i < daysFromNow; i++) {
    date = getNextWorkingDay(date);
  }
  return date;
}

// Helper to create approval chain for a leave
async function createApprovalChain(
  leaveId: number,
  approvers: Array<{ id: number; role: Role; email: string }>,
  finalDecision: "APPROVED" | "REJECTED",
  startId: number,
  baseTimeOffset: number
) {
  const chain = [];
  for (let i = 0; i < approvers.length; i++) {
    const approver = approvers[i];
    if (!approver) continue;

    const isLast = i === approvers.length - 1;
    const approval = await prisma.approval.upsert({
      where: { id: startId + i },
      create: {
        id: startId + i,
        leaveId,
        step: i + 1,
        approverId: approver.id,
        decision: isLast ? finalDecision : "FORWARDED",
        toRole: isLast ? null : approvers[i + 1]?.role || null,
        comment: isLast
          ? `${finalDecision} by ${approver.role}`
          : `Forwarded to ${approvers[i + 1]?.role || "next"}`,
        decidedAt: new Date(Date.now() - (baseTimeOffset - i * 2) * 24 * 60 * 60 * 1000),
      },
      update: {},
    });
    chain.push(approval);

    // Create audit log for each action
    await prisma.auditLog.create({
      data: {
        actorEmail: approver.email,
        action: isLast ? `LEAVE_${finalDecision}` : "LEAVE_FORWARD",
        targetEmail: "", // Will be updated with requester email
        details: {
          leaveId,
          actorRole: approver.role,
          toRole: isLast ? null : approvers[i + 1]?.role || null,
          step: i + 1,
        },
      },
    });
  }
  return chain;
}

async function seedLeaveRequests() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });

  const employee1 = users.find((u) => u.email === "employee1@demo.local");
  const employee2 = users.find((u) => u.email === "employee2@demo.local");
  const employee3 = users.find((u) => u.email === "employee3@demo.local");
  const employee4 = users.find((u) => u.email === "employee4@demo.local");
  const hrAdmin = users.find((u) => u.role === Role.HR_ADMIN);
  const deptHead = users.find((u) => u.role === Role.DEPT_HEAD);
  const hrHead = users.find((u) => u.role === Role.HR_HEAD);
  const ceo = users.find((u) => u.role === Role.CEO);

  if (!employee1 || !employee2 || !employee3 || !employee4 || !hrAdmin || !deptHead || !hrHead || !ceo) {
    console.warn("Missing required users for leave requests seeding");
    return;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const approvers = [hrAdmin, deptHead, hrHead, ceo];

  // Helper to calculate working days (using sync version since we're in a seed script)
  const calcWorkingDays = (start: Date, end: Date) => countWorkingDaysSync(start, end);

  // Helper to create approval and audit log
  async function createApprovalAndAudit(
    leaveId: number,
    step: number,
    approver: { id: number; email: string; role: Role },
    decision: "FORWARDED" | "APPROVED" | "REJECTED",
    toRole: string | null,
    comment: string,
    requesterEmail: string,
    approvalId: number,
    daysAgo: number
  ) {
    await prisma.approval.upsert({
      where: { id: approvalId },
      create: {
        id: approvalId,
        leaveId,
        step,
        approverId: approver.id,
        decision,
        toRole,
        comment,
        decidedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      },
      update: {},
    });

    await prisma.auditLog.create({
      data: {
        actorEmail: approver.email,
        action: decision === "FORWARDED" ? "LEAVE_FORWARD" : decision === "APPROVED" ? "LEAVE_APPROVE" : "LEAVE_REJECT",
        targetEmail: requesterEmail,
        details: {
          leaveId,
          actorRole: approver.role,
          toRole,
          step,
        },
      },
    });
  }

  // Helper to create full approval chain
  async function createFullChain(
    leaveId: number,
    finalDecision: "APPROVED" | "REJECTED",
    requesterEmail: string,
    startApprovalId: number,
    daysAgoStart: number,
    skipSteps: number[] = []
  ) {
    let approvalId = startApprovalId;
    let daysAgo = daysAgoStart;
    const activeSteps = approvers.map((_, i) => i).filter(i => !skipSteps.includes(i));
    
    for (let idx = 0; idx < activeSteps.length; idx++) {
      const i = activeSteps[idx];
      const approver = approvers[i];
      const isLast = idx === activeSteps.length - 1;
      
      await createApprovalAndAudit(
        leaveId,
        i + 1,
        approver,
        isLast ? finalDecision : "FORWARDED",
        isLast ? null : approvers[activeSteps[idx + 1]]?.role || null,
        isLast ? `${finalDecision} by ${approver.role}` : `Forwarded to ${approvers[activeSteps[idx + 1]]?.role || "next"}`,
        requesterEmail,
        approvalId++,
        daysAgo
      );
      daysAgo -= 2;
    }
  }

  // 1. Employee1 - CL 3 days, PENDING (near holiday, soft warning) - forwarded to Dept Head
  const leave1Start = new Date(currentYear, 10, 10); // Nov 10, 2025
  const leave1End = new Date(currentYear, 10, 12);
  const leave1 = await prisma.leaveRequest.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      requesterId: employee1.id,
      type: LeaveType.CASUAL,
      startDate: leave1Start,
      endDate: leave1End,
      workingDays: calcWorkingDays(leave1Start, leave1End),
      reason: "Need time off for personal matters and family obligations",
      status: "PENDING" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  await createApprovalAndAudit(leave1.id, 1, hrAdmin, "FORWARDED", "DEPT_HEAD", "Forwarded to Department Head for review", employee1.email, 1, 2);

  // 2. Employee2 - EL 5 days, APPROVED (full chain: HR Admin → Dept Head → HR Head → CEO)
  const leave2Start = new Date(currentYear, 8, 1); // Sep 1
  const leave2End = new Date(currentYear, 8, 5);
  const leave2 = await prisma.leaveRequest.upsert({
    where: { id: 2 },
    create: {
      id: 2,
      requesterId: employee2.id,
      type: LeaveType.EARNED,
      startDate: leave2Start,
      endDate: leave2End,
      workingDays: calcWorkingDays(leave2Start, leave2End),
      reason: "Family vacation planned well in advance with proper notice",
      status: "APPROVED" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  await createFullChain(leave2.id, "APPROVED", employee2.email, 10, 30);

  // 3. Employee3 - ML 5 days, REJECTED (missing certificate)
  const leave3Start = new Date(currentYear, 9, 20); // Oct 20
  const leave3End = new Date(currentYear, 9, 24);
  const leave3 = await prisma.leaveRequest.upsert({
    where: { id: 3 },
    create: {
      id: 3,
      requesterId: employee3.id,
      type: LeaveType.MEDICAL,
      startDate: leave3Start,
      endDate: leave3End,
      workingDays: calcWorkingDays(leave3Start, leave3End),
      reason: "Medical treatment required for ongoing health condition",
      status: "REJECTED" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: true,
      certificateUrl: null,
    },
    update: {},
  });
  await createFullChain(leave3.id, "REJECTED", employee3.email, 20, 10, [0, 1]); // Only HR Head rejects

  // 4. Employee4 - EL 2 days, PENDING (forwarded to Dept Head)
  const leave4Start = new Date(currentYear, 6, 15); // Jul 15
  const leave4End = new Date(currentYear, 6, 16);
  const leave4 = await prisma.leaveRequest.upsert({
    where: { id: 4 },
    create: {
      id: 4,
      requesterId: employee4.id,
      type: LeaveType.EARNED,
      startDate: leave4Start,
      endDate: leave4End,
      workingDays: calcWorkingDays(leave4Start, leave4End),
      reason: "Short break needed for personal errands and rest",
      status: "PENDING" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  await createApprovalAndAudit(leave4.id, 1, hrAdmin, "FORWARDED", "DEPT_HEAD", "Forwarded for department head review", employee4.email, 30, 5);

  // 5. Employee1 - CL 2 days, CANCELLED
  const leave5Start = new Date(currentYear, 4, 5); // May 5
  const leave5End = new Date(currentYear, 4, 6);
  const leave5 = await prisma.leaveRequest.upsert({
    where: { id: 5 },
    create: {
      id: 5,
      requesterId: employee1.id,
      type: LeaveType.CASUAL,
      startDate: leave5Start,
      endDate: leave5End,
      workingDays: calcWorkingDays(leave5Start, leave5End),
      reason: "Personal matters that were later resolved - cancelled",
      status: "CANCELLED" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  await prisma.auditLog.create({
    data: {
      actorEmail: employee1.email,
      action: "LEAVE_CANCEL",
      targetEmail: employee1.email,
      details: { leaveId: leave5.id, reason: "Cancelled by employee" },
    },
  });

  // 6. Employee2 - CL 1 day, APPROVED (single day)
  const leave6Start = new Date(currentYear, 7, 15); // Aug 15
  const leave6 = await prisma.leaveRequest.upsert({
    where: { id: 6 },
    create: {
      id: 6,
      requesterId: employee2.id,
      type: LeaveType.CASUAL,
      startDate: leave6Start,
      endDate: leave6Start,
      workingDays: 1,
      reason: "Single day personal leave for urgent family matter",
      status: "APPROVED" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  await createFullChain(leave6.id, "APPROVED", employee2.email, 40, 25);

  // 7. Employee3 - ML 2 days, APPROVED (no cert needed, ≤3 days)
  const leave7Start = new Date(currentYear, 8, 10); // Sep 10
  const leave7End = new Date(currentYear, 8, 11);
  const leave7 = await prisma.leaveRequest.upsert({
    where: { id: 7 },
    create: {
      id: 7,
      requesterId: employee3.id,
      type: LeaveType.MEDICAL,
      startDate: leave7Start,
      endDate: leave7End,
      workingDays: calcWorkingDays(leave7Start, leave7End),
      reason: "Minor medical issue requiring two days of rest and recovery",
      status: "APPROVED" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  await createFullChain(leave7.id, "APPROVED", employee3.email, 50, 20);

  // 8. Employee4 - EL 8 days, SUBMITTED (awaiting HR Admin)
  const leave8Start = getFutureWorkingDate(20); // 20 working days from now
  const leave8End = new Date(leave8Start);
  leave8End.setDate(leave8End.getDate() + 7); // 8 days total
  const leave8 = await prisma.leaveRequest.upsert({
    where: { id: 8 },
    create: {
      id: 8,
      requesterId: employee4.id,
      type: LeaveType.EARNED,
      startDate: leave8Start,
      endDate: leave8End,
      workingDays: calcWorkingDays(leave8Start, leave8End),
      reason: "Extended vacation planned with adequate advance notice period",
      status: "SUBMITTED" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  await prisma.auditLog.create({
    data: {
      actorEmail: employee4.email,
      action: "LEAVE_SUBMITTED",
      targetEmail: employee4.email,
      details: { leaveId: leave8.id },
    },
  });

  // 9. Employee1 - EL 3 days, PENDING (forwarded by HR Admin, awaiting Dept Head)
  const leave9Start = getFutureWorkingDate(25);
  const leave9End = new Date(leave9Start);
  leave9End.setDate(leave9End.getDate() + 2);
  const leave9 = await prisma.leaveRequest.upsert({
    where: { id: 9 },
    create: {
      id: 9,
      requesterId: employee1.id,
      type: LeaveType.EARNED,
      startDate: leave9Start,
      endDate: leave9End,
      workingDays: calcWorkingDays(leave9Start, leave9End),
      reason: "Short earned leave for personal commitments and relaxation",
      status: "PENDING" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  await createApprovalAndAudit(leave9.id, 1, hrAdmin, "FORWARDED", "DEPT_HEAD", "Forwarded to Department Head", employee1.email, 60, 3);

  // 10. Employee2 - ML 7 days, APPROVED (with certificate URL)
  const leave10Start = new Date(currentYear, 7, 5); // Aug 5
  const leave10End = new Date(currentYear, 7, 11);
  const leave10 = await prisma.leaveRequest.upsert({
    where: { id: 10 },
    create: {
      id: 10,
      requesterId: employee2.id,
      type: LeaveType.MEDICAL,
      startDate: leave10Start,
      endDate: leave10End,
      workingDays: calcWorkingDays(leave10Start, leave10End),
      reason: "Medical treatment requiring extended recovery period with documentation",
      status: "APPROVED" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: true,
      certificateUrl: "https://example.com/certs/med-cert-2025-08.pdf",
    },
    update: {},
  });
  await createFullChain(leave10.id, "APPROVED", employee2.email, 70, 35);

  // 11. Employee3 - CL 2 days, REJECTED (insufficient notice)
  const leave11Start = getFutureWorkingDate(2); // Only 2 working days notice
  const leave11End = new Date(leave11Start);
  leave11End.setDate(leave11End.getDate() + 1);
  const leave11 = await prisma.leaveRequest.upsert({
    where: { id: 11 },
    create: {
      id: 11,
      requesterId: employee3.id,
      type: LeaveType.CASUAL,
      startDate: leave11Start,
      endDate: leave11End,
      workingDays: calcWorkingDays(leave11Start, leave11End),
      reason: "Emergency personal matter requiring immediate attention",
      status: "REJECTED" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  await createFullChain(leave11.id, "REJECTED", employee3.email, 80, 5, [0, 1]); // HR Head rejects

  // 12. Employee1 - EL 12 days, PENDING (forwarded to HR Head, awaiting decision)
  const leave12Start = getFutureWorkingDate(30);
  const leave12End = new Date(leave12Start);
  leave12End.setDate(leave12End.getDate() + 11);
  const leave12 = await prisma.leaveRequest.upsert({
    where: { id: 12 },
    create: {
      id: 12,
      requesterId: employee1.id,
      type: LeaveType.EARNED,
      startDate: leave12Start,
      endDate: leave12End,
      workingDays: calcWorkingDays(leave12Start, leave12End),
      reason: "Extended vacation with family planned with sufficient advance notice and approval",
      status: "PENDING" as LeaveStatus,
      policyVersion: "v2.0",
      needsCertificate: false,
    },
    update: {},
  });
  // Full chain up to HR Head (forward to CEO, but status remains PENDING)
  await createFullChain(leave12.id, "FORWARDED" as any, employee1.email, 90, 10, [3]); // Skip CEO step
  // Update last approval (HR Head) to forward to CEO
  await prisma.approval.updateMany({
    where: { leaveId: leave12.id, step: 3 },
    data: { decision: "FORWARDED", toRole: "CEO" },
  });

  // Update balances based on approved leaves
  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: "APPROVED",
      requesterId: { in: [employee1.id, employee2.id, employee3.id, employee4.id] },
    },
  });

  for (const leave of approvedLeaves) {
    const balance = await prisma.balance.findUnique({
      where: {
        userId_type_year: {
          userId: leave.requesterId,
          type: leave.type,
          year: currentYear,
        },
      },
    });

    if (balance) {
      const newUsed = (balance.used || 0) + leave.workingDays;
      const newClosing = Math.max((balance.opening || 0) + (balance.accrued || 0) - newUsed, 0);
      
      await prisma.balance.update({
        where: {
          userId_type_year: {
            userId: leave.requesterId,
            type: leave.type,
            year: currentYear,
          },
        },
        data: {
          used: newUsed,
          closing: newClosing,
        },
      });
    }
  }

  // Add additional audit logs for LOGIN, LOGOUT, POLICY_UPDATED, etc. to reach 40+
  const auditLogs = [
    // Login logs for each user
    { email: "employee1@demo.local", action: "LOGIN", daysAgo: 1 },
    { email: "employee2@demo.local", action: "LOGIN", daysAgo: 2 },
    { email: "employee3@demo.local", action: "LOGIN", daysAgo: 1 },
    { email: "employee4@demo.local", action: "LOGIN", daysAgo: 3 },
    { email: "manager@demo.local", action: "LOGIN", daysAgo: 1 },
    { email: "hradmin@demo.local", action: "LOGIN", daysAgo: 0 },
    { email: "hrhead@demo.local", action: "LOGIN", daysAgo: 0 },
    { email: "ceo@demo.local", action: "LOGIN", daysAgo: 1 },
    // Logout logs
    { email: "employee1@demo.local", action: "LOGOUT", daysAgo: 1 },
    { email: "employee2@demo.local", action: "LOGOUT", daysAgo: 2 },
    { email: "hradmin@demo.local", action: "LOGOUT", daysAgo: 0 },
    // Policy updates
    { email: "hrhead@demo.local", action: "POLICY_UPDATED", daysAgo: 15, details: { setting: "allowBackdate", value: { EL: "ask", CL: false, ML: true } } },
    { email: "hradmin@demo.local", action: "POLICY_UPDATED", daysAgo: 10, details: { setting: "clPerYear", value: 10 } },
    // Employee updates
    { email: "hradmin@demo.local", action: "UPDATE_EMPLOYEE", daysAgo: 5, targetEmail: "employee1@demo.local", details: { field: "department", oldValue: "Engineering", newValue: "Engineering" } },
    // Balance adjustments
    { email: "hradmin@demo.local", action: "BALANCE_ADJUSTED", daysAgo: 8, targetEmail: "employee2@demo.local", details: { type: "EARNED", adjustment: 2 } },
    // Additional leave-related audit logs
    { email: "employee1@demo.local", action: "LEAVE_DRAFT_CREATED", daysAgo: 4, targetEmail: "employee1@demo.local", details: { leaveId: leave1.id } },
    { email: "employee2@demo.local", action: "LEAVE_DRAFT_CREATED", daysAgo: 35, targetEmail: "employee2@demo.local", details: { leaveId: leave2.id } },
    { email: "employee3@demo.local", action: "LEAVE_DRAFT_CREATED", daysAgo: 12, targetEmail: "employee3@demo.local", details: { leaveId: leave3.id } },
    { email: "employee4@demo.local", action: "LEAVE_DRAFT_CREATED", daysAgo: 6, targetEmail: "employee4@demo.local", details: { leaveId: leave4.id } },
    // View logs
    { email: "hradmin@demo.local", action: "EMPLOYEE_VIEWED", daysAgo: 2, targetEmail: "employee1@demo.local" },
    { email: "hrhead@demo.local", action: "EMPLOYEE_VIEWED", daysAgo: 1, targetEmail: "employee2@demo.local" },
    { email: "manager@demo.local", action: "EMPLOYEE_VIEWED", daysAgo: 3, targetEmail: "employee1@demo.local" },
    { email: "ceo@demo.local", action: "EMPLOYEE_VIEWED", daysAgo: 1, targetEmail: "hrhead@demo.local" },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: {
        actorEmail: log.email,
        action: log.action,
        targetEmail: log.targetEmail || log.email,
        details: log.details || {},
        createdAt: new Date(now.getTime() - (log.daysAgo || 0) * 24 * 60 * 60 * 1000),
      },
    });
  }

  const stats = {
    pending: [leave1, leave4, leave9, leave12].filter(Boolean).length,
    approved: [leave2, leave6, leave7, leave10].filter(Boolean).length,
    rejected: [leave3, leave11].filter(Boolean).length,
    cancelled: leave5 ? 1 : 0,
    submitted: leave8 ? 1 : 0,
  };

  console.log(`Created ${stats.pending} pending, ${stats.approved} approved, ${stats.rejected} rejected, ${stats.cancelled} cancelled, ${stats.submitted} submitted leave requests.`);
  console.log(`Created ${auditLogs.length} additional audit logs.`);
  return stats;
}

async function main() {
  // Create 8 demo users
  const users = await Promise.all([
    upsertUser({
      name: "Employee One",
      email: "employee1@demo.local",
      role: Role.EMPLOYEE,
      empCode: "E001",
      department: "Engineering",
    }),
    upsertUser({
      name: "Employee Two",
      email: "employee2@demo.local",
      role: Role.EMPLOYEE,
      empCode: "E002",
      department: "Operations",
    }),
    upsertUser({
      name: "Employee Three",
      email: "employee3@demo.local",
      role: Role.EMPLOYEE,
      empCode: "E003",
      department: "HR & Admin",
    }),
    upsertUser({
      name: "Employee Four",
      email: "employee4@demo.local",
      role: Role.EMPLOYEE,
      empCode: "E004",
      department: "Finance",
    }),
    upsertUser({
      name: "Dept Head",
      email: "manager@demo.local",
      role: Role.DEPT_HEAD,
      empCode: "M001",
      department: "Engineering",
    }),
    upsertUser({
      name: "HR Admin",
      email: "hradmin@demo.local",
      role: Role.HR_ADMIN,
      empCode: "HR001",
      department: "HR & Admin",
    }),
    upsertUser({
      name: "HR Head",
      email: "hrhead@demo.local",
      role: Role.HR_HEAD,
      empCode: "HRH001",
      department: "HR & Admin",
    }),
    upsertUser({
      name: "CEO One",
      email: "ceo@demo.local",
      role: Role.CEO,
      empCode: "C001",
      department: "Executive",
    }),
  ]);

  await Promise.all([seedHoliday(), seedPolicies()]);

  // Initialize orgSettings (may fail if model doesn't exist yet)
  try {
    await initDefaultOrgSettings();
    console.log("✅ Initialized orgSettings with backdate toggles (EL=ask, CL=false, ML=true).");
  } catch (error) {
    console.warn("⚠️ Could not initialize orgSettings (model may not exist yet):", error);
  }

  // Seed leave requests with realistic workflow states
  let leaveStats;
  try {
    leaveStats = await seedLeaveRequests();
    console.log("✅ Seeded leave requests with workflow states.");
  } catch (error) {
    console.warn("⚠️ Could not seed leave requests:", error);
    leaveStats = { pending: 0, approved: 0, rejected: 0, cancelled: 0, submitted: 0 };
  }

  console.log("\n✅ Demo data seeded successfully!");
  console.log("📋 All passwords: demo123");
  console.log("\n👥 Users created:");
  console.log("   - Employee One (Engineering) - employee1@demo.local");
  console.log("   - Employee Two (Operations) - employee2@demo.local");
  console.log("   - Employee Three (HR & Admin) - employee3@demo.local");
  console.log("   - Employee Four (Finance) - employee4@demo.local");
  console.log("   - Dept Head (Engineering) - manager@demo.local");
  console.log("   - HR Admin - hradmin@demo.local");
  console.log("   - HR Head - hrhead@demo.local");
  console.log("   - CEO One - ceo@demo.local");
  console.log("\n📅 Leave requests created:");
  if (leaveStats) {
    console.log(`   - ${leaveStats.pending} PENDING, ${leaveStats.approved} APPROVED, ${leaveStats.rejected} REJECTED, ${leaveStats.cancelled} CANCELLED, ${leaveStats.submitted} SUBMITTED`);
  }
}

if (require.main === module) {
  main()
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
