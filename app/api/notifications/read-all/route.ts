import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification.service";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * POST /api/notifications/read-all
 *
 * Mark all notifications as read for the current user
 */
export async function POST(req: Request) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      error("unauthorized", undefined, traceId),
      { status: 401 }
    );
  }

  try {
    const result = await NotificationService.markAllAsRead(user.id);

    if (!result.success) {
      return NextResponse.json(
        error(result.error!.code, result.error!.message, traceId),
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      markedCount: result.data,
    });
  } catch (err) {
    console.error("POST /api/notifications/read-all error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to mark all notifications as read", traceId),
      { status: 500 }
    );
  }
}
