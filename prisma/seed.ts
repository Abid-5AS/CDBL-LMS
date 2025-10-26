import { prisma } from "../lib/prisma";
import { LeaveType, Role } from "@prisma/client";

const YEAR = new Date().getFullYear();

async function upsertBalances(userId: number) {
  const templates: Array<{ type: LeaveType; accrued: number }> = [
    { type: LeaveType.EARNED, accrued: 20 },
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
}) {
  const created = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name,
      role: user.role,
      empCode: user.empCode,
      department: user.department,
    },
    create: user,
  });

  await upsertBalances(created.id);
  return created;
}

async function seedHoliday() {
  await prisma.holiday.upsert({
    where: { date: new Date(`${YEAR}-12-16T00:00:00.000Z`) },
    update: {},
    create: {
      date: new Date(`${YEAR}-12-16T00:00:00.000Z`),
      name: "Victory Day",
    },
  });
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
    { leaveType: LeaveType.EARNED, maxDays: 30, noticeDays: 15, carryLimit: 60 },
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

async function main() {
  await Promise.all([
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
      name: "HR Admin",
      email: "hr@demo.local",
      role: Role.HR_ADMIN,
      empCode: "HR001",
      department: "HR & Admin",
    }),
    upsertUser({
      name: "Super Admin",
      email: "superadmin@demo.local",
      role: "SUPER_ADMIN" as Role,
      empCode: "SYS001",
      department: "System Administration",
    }),
  ]);

  await Promise.all([seedHoliday(), seedPolicies()]);

  console.log("Seeded demo users, balances, and holiday.");
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
