import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveLeave } from "../resolve-leave";

export const cache = "no-store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "HR_ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const payload = await request.json();
  const action = String(payload?.action ?? "").toUpperCase();
  const note = typeof payload?.note === "string" ? payload.note : undefined;

  if (!["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const decision = action === "APPROVE" ? "APPROVED" : "REJECTED";
  const result = await resolveLeave(numericId, decision, me.id, note);

  if (!result.ok) {
    if (result.error === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (result.error === "already_resolved") {
      return NextResponse.json({ error: "Workflow already completed" }, { status: 400 });
    }
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, leave: result.leave });
}
