import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveStatus } from "@prisma/client";

export const cache = "no-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow HR_ADMIN, HR_HEAD, CEO, SYSTEM_ADMIN
  if (!["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      status: LeaveStatus.APPROVED,
    },
    select: {
      type: true,
    },
  });

  const distribution = new Map<string, number>();
  leaves.forEach((leave) => {
    const count = distribution.get(leave.type) || 0;
    distribution.set(leave.type, count + 1);
  });

  const data = Array.from(distribution.entries()).map(([type, count]) => ({
    name: type.replace("_", " "),
    value: count,
  }));

  return NextResponse.json({ data });
}



