import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification.service";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      error("unauthorized", undefined, traceId),
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        error("invalid_id", "Invalid notification ID", traceId),
        { status: 400 }
      );
    }

    const result = await NotificationService.delete(notificationId, user.id);

    if (!result.success) {
      const statusCode = result.error!.code === "not_found" ? 404 : 400;
      return NextResponse.json(
        error(result.error!.code, result.error!.message, traceId),
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/notifications/${id} error:`, err);
    return NextResponse.json(
      error("internal_error", "Failed to delete notification", traceId),
      { status: 500 }
    );
  }
}
