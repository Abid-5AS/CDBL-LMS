export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveLeave } from "../resolve-leave";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "HR_ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await req.json();
  const action = String(payload?.action ?? "").toUpperCase();
  const note = typeof payload?.note === "string" ? payload.note : undefined;

  if (!["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const decision = action === "APPROVED" ? "APPROVED" : "REJECTED";
  const result = await resolveLeave(id, decision, me.id, note);

  if (!result.ok) {
    if (result.error === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (result.error === "already_resolved") {
      return NextResponse.json({ error: "Workflow already completed" }, { status: 400 });
    }
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, leave: result.leave });
}
