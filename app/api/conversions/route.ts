import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserConversionHistory, getUserConversionStats } from "@/lib/repositories/conversion.repository";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";

export const cache = "no-store";

/**
 * GET /api/conversions
 * Get conversion history for a user
 *
 * Query params:
 * - userId: "me" (default) or specific user ID (admin only)
 * - year: Year to fetch (default: current year)
 * - limit: Number of records (default: all)
 * - stats: If true, return only statistics
 */
export async function GET(request: NextRequest) {
  const traceId = getTraceId(request as any);
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(error("unauthorized", undefined, traceId), {
      status: 401,
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const userIdParam = searchParams.get("userId") || "me";
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
  const statsOnly = searchParams.get("stats") === "true";

  // Determine target user ID
  let targetUserId = user.id;
  if (userIdParam !== "me") {
    const requestedUserId = parseInt(userIdParam);

    // Only admins can view other users' conversions
    if (!["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        error("forbidden", "You can only view your own conversion history", traceId),
        { status: 403 }
      );
    }

    targetUserId = requestedUserId;
  }

  try {
    if (statsOnly) {
      const stats = await getUserConversionStats(targetUserId, year);
      return NextResponse.json({ stats });
    }

    const conversions = await getUserConversionHistory(targetUserId, year, limit);
    return NextResponse.json({ conversions });
  } catch (err) {
    console.error("Error fetching conversions:", err);
    return NextResponse.json(
      error("internal_error", "Failed to fetch conversion history", traceId),
      { status: 500 }
    );
  }
}
