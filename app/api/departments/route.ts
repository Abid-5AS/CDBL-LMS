import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Get unique department names from User table (department is a string field)
  const users = await prisma.user.findMany({
    where: {
      department: {
        not: null,
      },
    },
    select: {
      department: true,
    },
    distinct: ["department"],
  });

  // Convert to array of { id, name } format
  const departments = users
    .filter((u) => u.department)
    .map((u, index) => ({
      id: index + 1, // Generate sequential ID
      name: u.department!,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ departments });
}

