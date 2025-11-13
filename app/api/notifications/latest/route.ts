import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification.service";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * GET /api/notifications/latest
 *
 * Fetch recent notifications for the current user
 * Query params:
 *   - limit: number of notifications to return (default: 20)
 *   - unreadOnly: boolean to fetch only unread notifications
 */
export async function GET(req: Request) {
  const traceId = getTraceId(req as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      error("unauthorized", undefined, traceId),
      { status: 401 }
    );
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";

    // Fetch notifications using service
    const result = await NotificationService.getRecent(user.id, limit);

    if (!result.success) {
      return NextResponse.json(
        error(result.error!.code, result.error!.message, traceId),
        { status: 500 }
      );
    }

    // Filter by unread if requested
    let notifications = result.data || [];
    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    // Get unread count
    const unreadCountResult = await NotificationService.getUnreadCount(user.id);
    const unreadCount = unreadCountResult.success ? unreadCountResult.data : 0;

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (err) {
    console.error("GET /api/notifications/latest error:", err);
    return NextResponse.json(
      error("internal_error", "Failed to fetch notifications", traceId),
      { status: 500 }
    );
  }
}

