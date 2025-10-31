import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const cache = "no-store";

export async function POST() {
  const seed = [
    {
      name: "Employee One",
      email: "employee1@demo.local",
      role: Role.EMPLOYEE,
      empCode: "E001",
      department: "Engineering",
    },
    {
      name: "Employee Two",
      email: "employee2@demo.local",
      role: Role.EMPLOYEE,
      empCode: "E002",
      department: "Operations",
    },
    {
      name: "HR Admin",
      email: "hr@demo.local",
      role: Role.HR_ADMIN,
      empCode: "HR001",
      department: "HR & Admin",
    },
  ];

  for (const user of seed) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        empCode: user.empCode,
        department: user.department,
      },
      create: user,
    });
  }

  const count = await prisma.user.count({
    where: { email: { in: seed.map((u) => u.email) } },
  });

  return NextResponse.json({ ok: true, count });
}
