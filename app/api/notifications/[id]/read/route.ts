import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification.service";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * POST /api/notifications/[id]/read
 *
 * Mark a specific notification as read
 */
export async function POST(
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

    const result = await NotificationService.markAsRead(notificationId, user.id);

    if (!result.success) {
      return NextResponse.json(
        error(result.error!.code, result.error!.message, traceId),
        { status: result.error!.code === "not_found" ? 404 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: result.data,
    });
  } catch (err) {
    console.error(`POST /api/notifications/${id}/read error:`, err);
    return NextResponse.json(
      error("internal_error", "Failed to mark notification as read", traceId),
      { status: 500 }
    );
  }
}
