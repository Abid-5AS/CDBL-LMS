import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: paramId } = await params;
  const id = Number(paramId);
  if (Number.isNaN(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave || leave.requesterId !== me.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!["SUBMITTED", "PENDING"].includes(leave.status)) {
    return NextResponse.json({ error: "cannot_cancel_now" }, { status: 400 });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true, id: updated.id });
}
