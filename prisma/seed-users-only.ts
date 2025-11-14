import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

const DEMO_PASSWORD = "demo123";

async function main() {
  console.log("🌱 Seeding demo users only...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // System Admin
  await prisma.user.upsert({
    where: { email: "sysadmin@cdbl.local" },
    update: { password: passwordHash },
    create: {
      name: "System Administrator",
      email: "sysadmin@cdbl.local",
      password: passwordHash,
      role: Role.SYSTEM_ADMIN,
      department: "IT",
      empCode: "SYS-001",
    },
  });
  console.log("✅ System Admin: sysadmin@cdbl.local");

  // CEO
  await prisma.user.upsert({
    where: { email: "ceo@demo.local" },
    update: { password: passwordHash },
    create: {
      name: "CEO One",
      email: "ceo@demo.local",
      password: passwordHash,
      role: Role.CEO,
      department: "Executive",
      empCode: "CEO-001",
    },
  });
  console.log("✅ CEO: ceo@demo.local");

  // HR Head
  await prisma.user.upsert({
    where: { email: "hrhead@demo.local" },
    update: { password: passwordHash },
    create: {
      name: "HR Head",
      email: "hrhead@demo.local",
      password: passwordHash,
      role: Role.HR_HEAD,
      department: "HR",
      empCode: "HR-HEAD-001",
    },
  });
  console.log("✅ HR Head: hrhead@demo.local");

  // HR Admin
  await prisma.user.upsert({
    where: { email: "hradmin@demo.local" },
    update: { password: passwordHash },
    create: {
      name: "HR Admin",
      email: "hradmin@demo.local",
      password: passwordHash,
      role: Role.HR_ADMIN,
      department: "HR",
      empCode: "HR-ADMIN-001",
    },
  });
  console.log("✅ HR Admin: hradmin@demo.local");

  // Department Heads
  const deptHeads = [
    { name: "IT Department Head", email: "manager@demo.local", dept: "IT", code: "IT-DH-01" },
    { name: "HR Operations Lead", email: "depthead.hr@cdbl.local", dept: "HR", code: "HR-DH-01" },
    { name: "Finance Controller", email: "depthead.finance@cdbl.local", dept: "Finance", code: "FIN-DH-01" },
  ];

  for (const head of deptHeads) {
    await prisma.user.upsert({
      where: { email: head.email },
      update: { password: passwordHash },
      create: {
        name: head.name,
        email: head.email,
        password: passwordHash,
        role: Role.DEPT_HEAD,
        department: head.dept,
        empCode: head.code,
      },
    });
    console.log(`✅ Dept Head: ${head.email}`);
  }

  // Employees
  const employees = [
    { name: "Employee One", email: "employee1@demo.local", dept: "IT", code: "IT-001" },
    { name: "Employee Two", email: "employee2@demo.local", dept: "Finance", code: "FIN-001" },
    { name: "Employee Three", email: "employee3@demo.local", dept: "HR", code: "HR-001" },
    { name: "Employee Four", email: "employee4@demo.local", dept: "Finance", code: "FIN-002" },
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: { password: passwordHash },
      create: {
        name: emp.name,
        email: emp.email,
        password: passwordHash,
        role: Role.EMPLOYEE,
        department: emp.dept,
        empCode: emp.code,
      },
    });
    console.log(`✅ Employee: ${emp.email}`);
  }

  console.log("\n📋 Password for all demo users: demo123");
  console.log("\n✅ User seeding completed!");
}

main()
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
