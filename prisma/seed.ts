import { prisma } from "../lib/prisma";
import { LeaveType, Role } from "@prisma/client";

async function main() {
  // basic users
  const emp = await prisma.user.upsert({
    where: { email: "abid@cdbl.local" },
    update: {},
    create: {
      empCode: "E1001",
      name: "Abid",
      email: "abid@cdbl.local",
      role: Role.EMPLOYEE,
      department: "IT",
    },
  });

  await prisma.user.upsert({
    where: { email: "rahman.manager@cdbl.local" },
    update: {},
    create: {
      empCode: "M2001",
      name: "Rahman",
      email: "rahman.manager@cdbl.local",
      role: Role.MANAGER,
      department: "IT",
    },
  });

  await prisma.user.upsert({
    where: { email: "hr@cdbl.local" },
    update: {},
    create: {
      empCode: "H3001",
      name: "HR Desk",
      email: "hr@cdbl.local",
      role: Role.HR,
      department: "HR",
    },
  });

  await prisma.user.upsert({
    where: { email: "ceo@cdbl.local" },
    update: {},
    create: {
      empCode: "C9001",
      name: "CEO",
      email: "ceo@cdbl.local",
      role: Role.CEO,
      department: "Management",
    },
  });

  // current year balances (EL 20/year; CL 10/year; ML 14/year)
  const year = new Date().getFullYear();
  const setup = async (userId: number) => {
    await prisma.balance.upsert({
      where: { userId_type_year: { userId, type: LeaveType.EARNED, year } },
      update: {},
      create: {
        userId,
        type: LeaveType.EARNED,
        year,
        opening: 0,
        accrued: 20,
        used: 0,
        closing: 20,
      },
    });
    await prisma.balance.upsert({
      where: { userId_type_year: { userId, type: LeaveType.CASUAL, year } },
      update: {},
      create: {
        userId,
        type: LeaveType.CASUAL,
        year,
        opening: 0,
        accrued: 10,
        used: 0,
        closing: 10,
      },
    });
    await prisma.balance.upsert({
      where: { userId_type_year: { userId, type: LeaveType.MEDICAL, year } },
      update: {},
      create: {
        userId,
        type: LeaveType.MEDICAL,
        year,
        opening: 0,
        accrued: 14,
        used: 0,
        closing: 14,
      },
    });
  };

  await setup(emp.id);

  // sample holiday
  await prisma.holiday.upsert({
    where: { date: new Date(`${year}-12-16T00:00:00.000Z`) },
    update: {},
    create: {
      date: new Date(`${year}-12-16T00:00:00.000Z`),
      name: "Victory Day",
    },
  });

  console.log("Seeded users, balances, holiday.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
