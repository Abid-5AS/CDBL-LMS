import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { ApprovalDecision, LeaveStatus, LeaveType, Role } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { initDefaultOrgSettings } from "../lib/org-settings";
import { countWorkingDaysSync } from "../lib/working-days";
import { normalizeToDhakaMidnight } from "../lib/date-utils";
import { getChainFor } from "../lib/workflow";
import {
  SeededRandom,
  generateBangladeshiName,
  randomDuration,
  randomReason,
} from "../lib/seed-utils";
import { generateSignedUrl } from "../lib/storage";

type SeedUser = {
  id: number;
  role: Role;
  department?: string | null;
  email: string;
  name: string;
};

type SeedHoliday = { date: string; name: string };

const YEAR = new Date().getFullYear();
const DEMO_PASSWORD = "demo123";
const SEED_RESET =
  ["true", "1", "yes"].includes(
    (process.env.SEED_RESET ?? "").trim().toLowerCase()
  ) || false;
const EMPLOYEES_PER_DEPT = 8; // Realistic for testing (24 total employees)
const UPLOAD_ROOT = path.join(process.cwd(), "private", "uploads");

const nameRng = new SeededRandom(3101);
const balanceRng = new SeededRandom(4201);
const leaveRng = new SeededRandom(5201);
const pendingRng = new SeededRandom(6201);

const departments = ["IT", "HR", "Finance"] as const;
const featuredEmployees: Array<{
  name: string;
  email: string;
  department: (typeof departments)[number];
}> = [
  { name: "Employee One", email: "employee1@demo.local", department: "IT" },
  {
    name: "Employee Two",
    email: "employee2@demo.local",
    department: "Finance",
  },
  { name: "Employee Three", email: "employee3@demo.local", department: "HR" },
  {
    name: "Employee Four",
    email: "employee4@demo.local",
    department: "Finance",
  },
];

async function main() {
  console.log("🌱 Starting demo seed...");

  await resetDatabase();

  try {
    await initDefaultOrgSettings();
    console.log("✅ Org settings initialized");
  } catch (error) {
    console.warn("⚠️  Could not initialize org settings:", error);
  }

  const users = await createUsers();
  const holidays = await createHolidays();
  await createPolicyConfigs();
  await createBalances(users);
  await createLeaveRequests(users, holidays);
  await createPendingRequestsForITDeptHead(users, holidays);

  printSummary(users);
  console.log("📋 Password for all demo users:", DEMO_PASSWORD);
}

async function resetDatabase() {
  if (!SEED_RESET) {
    console.log("ℹ️  SEED_RESET not provided; existing users will be updated.");
    return;
  }

  console.log("🗑️  Resetting transactional tables...");
  await prisma.$transaction([
    prisma.approval.deleteMany(),
    prisma.leaveComment.deleteMany(),
    prisma.leaveVersion.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.balance.deleteMany(),
    prisma.holiday.deleteMany(),
    prisma.policyConfig.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.orgSettings.deleteMany(),
  ]);
  console.log("✅ Tables cleared (users preserved)");
}

async function createUsers(): Promise<SeedUser[]> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const createdUsers: SeedUser[] = [];
  const deptHeadMap = new Map<
    string,
    { id: number; email: string; role: Role; name: string }
  >();
  const deptEmployeeCounters = new Map<string, number>();
  const usedEmpCodes = new Set<string>();

  const upsertUser = async (data: {
    name: string;
    email: string;
    role: Role;
    department?: string | null;
    empCode: string;
    deptHeadId?: number | null;
  }) => {
    usedEmpCodes.add(data.empCode);
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        role: data.role,
        department: data.department,
        empCode: data.empCode,
        deptHeadId: data.deptHeadId ?? null,
        password: passwordHash,
      },
      create: {
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        empCode: data.empCode,
        deptHeadId: data.deptHeadId ?? null,
        password: passwordHash,
      },
    });
    createdUsers.push({
      id: user.id,
      role: user.role,
      department: user.department,
      email: user.email,
      name: user.name,
    });
    return user;
  };

  // Core leadership
  await upsertUser({
    name: "System Administrator",
    email: "sysadmin@cdbl.local",
    role: Role.SYSTEM_ADMIN,
    department: "IT",
    empCode: makeEmpCode(Role.SYSTEM_ADMIN),
  });

  // Real user for development/testing
  await upsertUser({
    name: "Abid Shahriar",
    email: "abidshahriar@iut-dhaka.edu",
    role: Role.SYSTEM_ADMIN,
    department: "IT",
    empCode: "SYS-002",
  });

  await upsertUser({
    name: "CEO One",
    email: "ceo@demo.local",
    role: Role.CEO,
    department: "Executive",
    empCode: makeEmpCode(Role.CEO),
  });

  await upsertUser({
    name: "HR Head",
    email: "hrhead@demo.local",
    role: Role.HR_HEAD,
    department: "HR",
    empCode: makeEmpCode(Role.HR_HEAD),
  });

  await upsertUser({
    name: "HR Admin",
    email: "hradmin@demo.local",
    role: Role.HR_ADMIN,
    department: "HR",
    empCode: makeEmpCode(Role.HR_ADMIN, "HR", 1),
  });

  // Dept heads
  const deptHeadSeeds = [
    {
      name: "IT Department Head",
      email: "manager@demo.local",
      department: "IT",
    },
    {
      name: "HR Operations Lead",
      email: "depthead.hr@cdbl.local",
      department: "HR",
    },
    {
      name: "Finance Controller",
      email: "depthead.finance@cdbl.local",
      department: "Finance",
    },
  ];

  for (const [index, seed] of deptHeadSeeds.entries()) {
    const user = await upsertUser({
      name: seed.name,
      email: seed.email,
      role: Role.DEPT_HEAD,
      department: seed.department,
      empCode: makeEmpCode(Role.DEPT_HEAD, seed.department, index + 1),
    });
    deptHeadMap.set(seed.department, {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    deptEmployeeCounters.set(seed.department, 1);
  }

  const featuredQueue = [...featuredEmployees];
  for (const dept of departments) {
    const deptHead = deptHeadMap.get(dept);
    if (!deptHead) continue;

    const departmentFeatured = featuredQueue.filter(
      (emp) => emp.department === dept
    );
    for (const emp of departmentFeatured) {
      await createEmployee({
        name: emp.name,
        email: emp.email,
        department: dept,
        deptHeadId: deptHead.id,
        upsertUser,
        deptCounters: deptEmployeeCounters,
        usedEmpCodes,
      });
    }

    while ((deptEmployeeCounters.get(dept) ?? 1) <= EMPLOYEES_PER_DEPT) {
      await createEmployee({
        name: generateBangladeshiName(nameRng),
        email: buildEmployeeEmail(dept, deptEmployeeCounters.get(dept) ?? 1),
        department: dept,
        deptHeadId: deptHead.id,
        upsertUser,
        deptCounters: deptEmployeeCounters,
        usedEmpCodes,
      });
    }
  }

  // Return ordered list for downstream steps
  const sortedUsers = await prisma.user.findMany({
    select: { id: true, role: true, department: true, email: true, name: true },
    orderBy: { id: "asc" },
  });

  console.log(`✅ Users ready: ${sortedUsers.length}`);
  return sortedUsers.map((user) => ({
    id: user.id,
    role: user.role,
    department: user.department,
    email: user.email,
    name: user.name,
  }));
}

async function createEmployee(params: {
  name: string;
  email: string;
  department: string;
  deptHeadId: number;
  upsertUser: (data: {
    name: string;
    email: string;
    role: Role;
    department?: string | null;
    empCode: string;
    deptHeadId?: number | null;
  }) => Promise<any>;
  deptCounters: Map<string, number>;
  usedEmpCodes: Set<string>;
}) {
  const { department, deptCounters, usedEmpCodes } = params;
  const currentIndex = deptCounters.get(department) ?? 1;
  let empCode = makeEmpCode(Role.EMPLOYEE, department, currentIndex);
  let safeguard = 0;
  while (usedEmpCodes.has(empCode) && safeguard < 5) {
    empCode = makeEmpCode(
      Role.EMPLOYEE,
      department,
      currentIndex + safeguard + 1
    );
    safeguard++;
  }
  await params.upsertUser({
    name: params.name,
    email: params.email,
    role: Role.EMPLOYEE,
    department,
    empCode,
    deptHeadId: params.deptHeadId,
  });
  deptCounters.set(department, (deptCounters.get(department) ?? 1) + 1);
  usedEmpCodes.add(empCode);
}

async function createBalances(users: SeedUser[]) {
  const balances = [];
  for (const user of users) {
    for (const type of [
      LeaveType.EARNED,
      LeaveType.CASUAL,
      LeaveType.MEDICAL,
    ]) {
      const accrued =
        type === LeaveType.EARNED ? 24 : type === LeaveType.CASUAL ? 10 : 14;

      const used =
        user.role === Role.EMPLOYEE
          ? type === LeaveType.EARNED
            ? balanceRng.nextInt(2, 8)
            : type === LeaveType.CASUAL
            ? balanceRng.nextInt(2, 6)
            : balanceRng.nextInt(1, 4)
          : 0;
      const closing = Math.max(accrued - used, 0);

      await prisma.balance.upsert({
        where: {
          userId_type_year: { userId: user.id, type, year: YEAR },
        },
        update: { opening: 0, accrued, used, closing },
        create: {
          userId: user.id,
          type,
          year: YEAR,
          opening: 0,
          accrued,
          used,
          closing,
        },
      });
      balances.push({ userId: user.id, type, used });
    }
  }
  console.log(`✅ Balances created for ${users.length} users`);
  return balances;
}

async function createHolidays(): Promise<SeedHoliday[]> {
  const baseHolidays: Array<{ month: number; day: number; name: string }> = [
    { month: 1, day: 1, name: "New Year's Day" },
    { month: 2, day: 21, name: "Shaheed Day & Intl. Mother Language Day" },
    { month: 3, day: 17, name: "Bangabandhu's Birthday" },
    { month: 3, day: 26, name: "Independence & National Day" },
    { month: 4, day: 14, name: "Bengali New Year" },
    { month: 5, day: 1, name: "May Day" },
    { month: 6, day: 16, name: "Eid-ul-Azha" },
    { month: 6, day: 17, name: "Eid-ul-Azha Holiday" },
    { month: 7, day: 1, name: "Bank Holiday" },
    { month: 8, day: 15, name: "National Mourning Day" },
    { month: 10, day: 2, name: "Durga Puja" },
    { month: 10, day: 12, name: "Eid-e-Milad-un-Nabi" },
    { month: 12, day: 16, name: "Victory Day" },
    { month: 12, day: 25, name: "Christmas Day" },
  ];

  const eidUlFitr = [
    { month: 4, day: 9, name: "Eid-ul-Fitr" },
    { month: 4, day: 10, name: "Eid-ul-Fitr Holiday" },
    { month: 4, day: 11, name: "Eid-ul-Fitr Holiday" },
  ];

  const yearHolidays = [...baseHolidays, ...eidUlFitr].map((holiday) => ({
    date: normalizeToDhakaMidnight(
      new Date(Date.UTC(YEAR, holiday.month - 1, holiday.day))
    )
      .toISOString()
      .slice(0, 10),
    name: holiday.name,
  }));

  const nextYearExtras = [
    { date: `${YEAR + 1}-01-01`, name: "New Year's Day" },
    {
      date: `${YEAR + 1}-02-21`,
      name: "Shaheed Day & Intl. Mother Language Day",
    },
    { date: `${YEAR + 1}-03-26`, name: "Independence & National Day" },
  ];

  for (const holiday of [...yearHolidays, ...nextYearExtras]) {
    await prisma.holiday.upsert({
      where: { date: new Date(`${holiday.date}T00:00:00.000Z`) },
      update: { name: holiday.name },
      create: {
        date: new Date(`${holiday.date}T00:00:00.000Z`),
        name: holiday.name,
        isOptional: false,
      },
    });
  }

  console.log(
    `✅ Holidays created: ${yearHolidays.length + nextYearExtras.length}`
  );
  return yearHolidays;
}

async function createPolicyConfigs() {
  const defaults: Record<
    LeaveType,
    {
      maxDays?: number;
      minDays?: number;
      noticeDays?: number;
      carryLimit?: number | null;
    }
  > = {
    [LeaveType.EARNED]: {
      maxDays: 30,
      minDays: 1,
      noticeDays: 7,
      carryLimit: 15,
    },
    [LeaveType.CASUAL]: {
      maxDays: 3,
      minDays: 1,
      noticeDays: 1,
      carryLimit: 0,
    },
    [LeaveType.MEDICAL]: {
      maxDays: 14,
      minDays: 1,
      noticeDays: 0,
      carryLimit: 0,
    },
    [LeaveType.EXTRAWITHPAY]: {
      maxDays: 10,
      minDays: 1,
      noticeDays: 3,
      carryLimit: null,
    },
    [LeaveType.EXTRAWITHOUTPAY]: {
      maxDays: 30,
      minDays: 1,
      noticeDays: 5,
      carryLimit: null,
    },
    [LeaveType.MATERNITY]: {
      maxDays: 112,
      minDays: 30,
      noticeDays: 30,
      carryLimit: null,
    },
    [LeaveType.PATERNITY]: {
      maxDays: 10,
      minDays: 3,
      noticeDays: 7,
      carryLimit: null,
    },
    [LeaveType.STUDY]: {
      maxDays: 60,
      minDays: 7,
      noticeDays: 30,
      carryLimit: null,
    },
    [LeaveType.SPECIAL_DISABILITY]: {
      maxDays: 30,
      minDays: 5,
      noticeDays: 10,
      carryLimit: null,
    },
    [LeaveType.QUARANTINE]: {
      maxDays: 14,
      minDays: 3,
      noticeDays: 0,
      carryLimit: null,
    },
    [LeaveType.SPECIAL]: {
      maxDays: 60,
      minDays: 1,
      noticeDays: 0,
      carryLimit: null,
    },
  };

  for (const leaveType of Object.values(LeaveType)) {
    const config = defaults[leaveType];
    if (config) {
      await prisma.policyConfig.upsert({
        where: { leaveType },
        update: config,
        create: { leaveType, ...config },
      });
    }
  }
  console.log("✅ Policy configurations upserted");
}

async function createLeaveRequests(users: SeedUser[], holidays: SeedHoliday[]) {
  const employees = users.filter((user) => user.role === Role.EMPLOYEE);
  const deptHeads = new Map(
    users
      .filter((user) => user.role === Role.DEPT_HEAD && user.department)
      .map((head) => [head.department as string, head])
  );
  const hrAdmin = users.find((user) => user.role === Role.HR_ADMIN);
  const hrHead = users.find((user) => user.role === Role.HR_HEAD);
  const ceo = users.find((user) => user.role === Role.CEO);

  if (!hrAdmin || !hrHead || !ceo || deptHeads.size === 0) {
    console.warn("⚠️  Missing approvers; skipping leave generation");
    return;
  }

  let leaveCount = 0;

  // Create currently active leaves for some employees (teammates on leave)
  const employeesOnLeave = employees.slice(0, Math.min(8, employees.length));
  for (const employee of employeesOnLeave) {
    const deptHead = employee.department && deptHeads.get(employee.department);
    if (!deptHead) continue;

    const leaveType = leaveRng.pick([LeaveType.EARNED, LeaveType.CASUAL]);
    const today = normalizeToDhakaMidnight(new Date());
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - leaveRng.nextInt(1, 3)); // Started 1-3 days ago
    const duration =
      leaveType === LeaveType.EARNED
        ? leaveRng.nextInt(5, 10)
        : leaveRng.nextInt(2, 3);
    const endDate = addWorkingDays(startDate, duration, holidays);
    const workingDays = countWorkingDaysSync(startDate, endDate, holidays);

    const leave = await prisma.leaveRequest.create({
      data: {
        requesterId: employee.id,
        type: leaveType,
        startDate: ensureWorkingDay(startDate, holidays),
        endDate,
        workingDays,
        reason: randomReason(leaveType, leaveRng),
        status: LeaveStatus.APPROVED,
        policyVersion: "v2.0",
        needsCertificate: false,
      },
    });

    await createApprovalTrail({
      leave,
      employee,
      approvers: { hrAdmin, deptHead, hrHead, ceo },
      status: LeaveStatus.APPROVED,
      leaveType,
    });

    leaveCount++;
  }

  // Create regular leave requests for all employees
  for (const employee of employees) {
    const deptHead = employee.department && deptHeads.get(employee.department);
    if (!deptHead) continue;

    // 10-15 requests per employee for realistic testing (240-360 total across 24 employees)
    const numRequests = leaveRng.nextInt(10, 15);
    for (let i = 0; i < numRequests; i++) {
      const leaveType = leaveRng.pick([
        LeaveType.EARNED,
        LeaveType.CASUAL,
        LeaveType.MEDICAL,
      ]);
      const status = pickStatus(leaveRng);

      const { startDate, endDate } = buildDateRange(
        leaveType,
        status,
        holidays
      );
      const workingDays = countWorkingDaysSync(startDate, endDate, holidays);

      let certificateUrl: string | null = null;
      let fitnessCertificateUrl: string | null = null;
      const needsCertificate =
        leaveType === LeaveType.MEDICAL && workingDays > 3;
      if (needsCertificate && status === LeaveStatus.APPROVED) {
        certificateUrl = await createCertificateFile();
        if (workingDays > 7 && leaveRng.next() > 0.4) {
          fitnessCertificateUrl = await createCertificateFile();
        }
      }

      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: leaveType,
          startDate,
          endDate,
          workingDays,
          reason: randomReason(leaveType, leaveRng),
          status,
          policyVersion: "v2.0",
          needsCertificate,
          certificateUrl,
          fitnessCertificateUrl,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorEmail: employee.email,
          action: "LEAVE_SUBMITTED",
          targetEmail: hrAdmin.email,
          details: {
            leaveId: leave.id,
            type: leaveType,
            status,
          },
        },
      });

      if (
        [
          LeaveStatus.APPROVED,
          LeaveStatus.REJECTED,
          LeaveStatus.PENDING,
        ].includes(status) ||
        status === LeaveStatus.RETURNED ||
        status === LeaveStatus.CANCELLATION_REQUESTED
      ) {
        await createApprovalTrail({
          leave,
          employee,
          approvers: { hrAdmin, deptHead, hrHead, ceo },
          status,
          leaveType,
        });
      }

      leaveCount++;
    }
  }

  console.log(
    `✅ Leave requests created: ${leaveCount} (including ${employeesOnLeave.length} currently on leave)`
  );
}

async function createApprovalTrail(params: {
  leave: { id: number };
  employee: SeedUser;
  approvers: {
    hrAdmin: SeedUser;
    deptHead: SeedUser;
    hrHead: SeedUser;
    ceo: SeedUser;
  };
  status: LeaveStatus;
  leaveType: LeaveType;
}) {
  const chainRoles = getChainFor(params.leaveType);
  const sequence = chainRoles
    .map((role) => {
      switch (role) {
        case "HR_ADMIN":
          return params.approvers.hrAdmin;
        case "DEPT_HEAD":
          return params.approvers.deptHead;
        case "HR_HEAD":
          return params.approvers.hrHead;
        case "CEO":
          return params.approvers.ceo;
        default:
          return null;
      }
    })
    .filter(Boolean) as SeedUser[];

  if (sequence.length === 0) return;

  if (params.status === LeaveStatus.RETURNED) {
    const actor = sequence[0];
    await prisma.approval.create({
      data: {
        leaveId: params.leave.id,
        step: 1,
        approverId: actor.id,
        decision: ApprovalDecision.FORWARDED,
        toRole: "EMPLOYEE",
        comment: "Returned for clarification",
        decidedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        actorEmail: actor.email,
        action: "LEAVE_RETURNED",
        targetEmail: params.employee.email,
        details: {
          leaveId: params.leave.id,
          reason: "Additional justification requested",
        },
      },
    });
    return;
  }

  if (params.status === LeaveStatus.PENDING) {
    const pendingAt = leaveRng.nextInt(0, sequence.length - 1);
    for (let i = 0; i < pendingAt; i++) {
      const actor = sequence[i];
      await prisma.approval.create({
        data: {
          leaveId: params.leave.id,
          step: i + 1,
          approverId: actor.id,
          decision: ApprovalDecision.FORWARDED,
          toRole: sequence[i + 1]?.role ?? null,
          comment: `Forwarded to ${sequence[i + 1]?.role ?? "next approver"}`,
          decidedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        },
      });
      await prisma.auditLog.create({
        data: {
          actorEmail: actor.email,
          action: "LEAVE_FORWARD",
          targetEmail: params.employee.email,
          details: {
            leaveId: params.leave.id,
            toRole: sequence[i + 1]?.role ?? null,
          },
        },
      });
    }
    return;
  }

  const finalDecision =
    params.status === LeaveStatus.APPROVED
      ? ApprovalDecision.APPROVED
      : params.status === LeaveStatus.REJECTED
      ? ApprovalDecision.REJECTED
      : ApprovalDecision.APPROVED;

  for (let i = 0; i < sequence.length; i++) {
    const actor = sequence[i];
    const isLast = i === sequence.length - 1;
    const decision = isLast ? finalDecision : ApprovalDecision.FORWARDED;
    await prisma.approval.create({
      data: {
        leaveId: params.leave.id,
        step: i + 1,
        approverId: actor.id,
        decision,
        toRole: isLast ? null : sequence[i + 1]?.role ?? null,
        comment: isLast
          ? `${decision} by ${actor.role}`
          : `Forwarded to ${sequence[i + 1]?.role ?? "next approver"}`,
        decidedAt: new Date(
          Date.now() - (sequence.length - i) * 24 * 60 * 60 * 1000
        ),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorEmail: actor.email,
        action:
          decision === ApprovalDecision.APPROVED
            ? "LEAVE_APPROVED"
            : decision === ApprovalDecision.REJECTED
            ? "LEAVE_REJECTED"
            : "LEAVE_FORWARD",
        targetEmail: params.employee.email,
        details: {
          leaveId: params.leave.id,
          decision,
          step: i + 1,
        },
      },
    });
  }

  if (params.status === LeaveStatus.CANCELLATION_REQUESTED) {
    await prisma.auditLog.create({
      data: {
        actorEmail: params.employee.email,
        action: "LEAVE_CANCELLATION_REQUESTED",
        targetEmail: params.approvers.hrAdmin.email,
        details: {
          leaveId: params.leave.id,
        },
      },
    });
  }
}

async function createPendingRequestsForITDeptHead(
  users: SeedUser[],
  holidays: SeedHoliday[]
) {
  const itDeptHead = users.find(
    (user) => user.role === Role.DEPT_HEAD && user.department === "IT"
  );
  const hrAdmin = users.find((user) => user.role === Role.HR_ADMIN);
  if (!itDeptHead || !hrAdmin) {
    console.warn(
      "⚠️  Missing IT Dept Head or HR Admin; skipping targeted pending requests"
    );
    return;
  }

  const itEmployees = users.filter(
    (user) => user.role === Role.EMPLOYEE && user.department === "IT"
  );
  const pendingEmployees = itEmployees.slice(
    0,
    Math.min(6, itEmployees.length)
  );
  for (const employee of pendingEmployees) {
    const leaveType = pendingRng.pick([LeaveType.EARNED, LeaveType.MEDICAL]);
    const startDate = ensureWorkingDay(
      new Date(Date.now() + pendingRng.nextInt(14, 21) * 24 * 60 * 60 * 1000),
      holidays
    );
    const endDate = addWorkingDays(
      startDate,
      leaveType === LeaveType.EARNED
        ? pendingRng.nextInt(4, 7)
        : pendingRng.nextInt(2, 4),
      holidays
    );
    const workingDays = countWorkingDaysSync(startDate, endDate, holidays);

    const leave = await prisma.leaveRequest.create({
      data: {
        requesterId: employee.id,
        type: leaveType,
        startDate,
        endDate,
        workingDays,
        reason: randomReason(leaveType, pendingRng),
        status: LeaveStatus.PENDING,
        policyVersion: "v2.0",
        needsCertificate: leaveType === LeaveType.MEDICAL && workingDays > 3,
      },
    });

    await prisma.approval.create({
      data: {
        leaveId: leave.id,
        step: 1,
        approverId: hrAdmin.id,
        decision: ApprovalDecision.FORWARDED,
        toRole: "DEPT_HEAD",
        comment: "Forwarded to Department Head",
        decidedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorEmail: hrAdmin.email,
        action: "LEAVE_FORWARD",
        targetEmail: employee.email,
        details: {
          leaveId: leave.id,
          toRole: "DEPT_HEAD",
        },
      },
    });
  }

  console.log("✅ Targeted pending IT requests created");
}

function buildDateRange(
  leaveType: LeaveType,
  status: LeaveStatus,
  holidays: SeedHoliday[]
) {
  const today = normalizeToDhakaMidnight(new Date());
  let startDate = new Date(today);
  let endDate = new Date(today);
  const futureStatuses = [
    LeaveStatus.APPROVED,
    LeaveStatus.PENDING,
    LeaveStatus.SUBMITTED,
  ];
  const isFuture = futureStatuses.includes(status);

  if (isFuture) {
    const daysAhead =
      leaveType === LeaveType.EARNED
        ? leaveRng.nextInt(10, 30)
        : leaveRng.nextInt(3, 20);
    startDate.setDate(startDate.getDate() + daysAhead);
    startDate = ensureWorkingDay(startDate, holidays);
  } else {
    // Increased from 10-180 to 10-365 to cover full 12 months for trend charts
    const daysAgo = leaveRng.nextInt(10, 365);
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate = ensureWorkingDay(startDate, holidays);
  }

  const duration = randomDuration(leaveType, leaveRng);
  endDate = addWorkingDays(startDate, duration, holidays);
  return { startDate, endDate };
}

function ensureWorkingDay(date: Date, holidays: SeedHoliday[]) {
  const normalized = normalizeToDhakaMidnight(date);
  let current = new Date(normalized);
  while (isWeekendBD(current) || isHoliday(current, holidays)) {
    current.setDate(current.getDate() + 1);
  }
  return normalizeToDhakaMidnight(current);
}

function addWorkingDays(
  start: Date,
  duration: number,
  holidays: SeedHoliday[]
) {
  let daysAdded = 1;
  let current = new Date(start);
  while (daysAdded < Math.max(duration, 1)) {
    current.setDate(current.getDate() + 1);
    if (!isWeekendBD(current) && !isHoliday(current, holidays)) {
      daysAdded++;
    }
  }
  return normalizeToDhakaMidnight(current);
}

function isHoliday(date: Date, holidays: SeedHoliday[]) {
  const day = normalizeToDhakaMidnight(date).toISOString().slice(0, 10);
  return holidays.some((holiday) => holiday.date === day);
}

function isWeekendBD(date: Date) {
  const day = date.getDay();
  return day === 5 || day === 6;
}

function pickStatus(rng: SeededRandom): LeaveStatus {
  const roll = rng.next();
  if (roll < 0.55) return LeaveStatus.APPROVED;
  if (roll < 0.75) return LeaveStatus.PENDING;
  if (roll < 0.83) return LeaveStatus.SUBMITTED;
  if (roll < 0.9) return LeaveStatus.REJECTED;
  if (roll < 0.95) return LeaveStatus.RETURNED;
  if (roll < 0.98) return LeaveStatus.CANCELLATION_REQUESTED;
  return LeaveStatus.CANCELLED;
}

async function createCertificateFile() {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  const filename = `medical-cert-${randomUUID()}.pdf`;
  const filePath = path.join(UPLOAD_ROOT, filename);
  const pdfContent = Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
178
%%EOF`
  );
  await fs.writeFile(filePath, pdfContent);
  return generateSignedUrl(filename);
}

function makeEmpCode(role: Role, dept?: string, seq: number = 1) {
  const padded = (value: number, digits: number) =>
    String(value).padStart(digits, "0");
  const deptCode = (dept ?? "GN").slice(0, 2).toUpperCase();
  switch (role) {
    case Role.SYSTEM_ADMIN:
      return "SYS001";
    case Role.CEO:
      return "CEO001";
    case Role.HR_HEAD:
      return "HRH001";
    case Role.HR_ADMIN:
      return `HRA${padded(seq, 2)}`;
    case Role.DEPT_HEAD:
      return `${deptCode}DH${padded(seq, 2)}`;
    case Role.EMPLOYEE:
    default:
      return `${deptCode}${padded(seq, 3)}`;
  }
}

function buildEmployeeEmail(dept: string, index: number) {
  const deptSlug = dept.toLowerCase();
  return `${deptSlug}.employee${String(index).padStart(2, "0")}@cdbl.local`;
}

function printSummary(users: SeedUser[]) {
  const roleCounts = users.reduce<Record<Role, number>>((acc, user) => {
    acc[user.role] = (acc[user.role] ?? 0) + 1;
    return acc;
  }, {} as Record<Role, number>);

  console.log("\n👥 User distribution");
  for (const role of Object.values(Role)) {
    const count = roleCounts[role] ?? 0;
    console.log(
      `   - ${role.padEnd(12, " ")} ${count.toString().padStart(2, " ")}`
    );
  }
  console.log("\n✅ Seed completed successfully!");
}

if (require.main === module) {
  main()
    .catch(async (error) => {
      console.error("❌ Seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
