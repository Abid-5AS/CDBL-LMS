import { prisma } from "../lib/prisma";
import { LeaveType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

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
      name: "CEO",
      email: "ceo@demo.local",
      role: Role.CEO,
      empCode: "C001",
      department: "Executive",
    }),
  ]);

  await Promise.all([seedHoliday(), seedPolicies()]);

  console.log("Seeded demo users, balances, and holiday.");
  console.log("All passwords: demo123");
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
