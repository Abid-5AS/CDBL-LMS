import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-jwt";
import { ConflictDetectorService } from "@/lib/services/conflict-detector.service";
import { z } from "zod";

const checkConflictSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  minCapacity: z.number().min(0).max(100).optional(),
  blockOnLowCapacity: z.boolean().optional(),
});

/**
 * POST /api/leaves/check-conflicts
 *
 * Check for leave conflicts and team capacity impact
 *
 * Request body:
 * {
 *   startDate: ISO date string,
 *   endDate: ISO date string,
 *   minCapacity?: number (0-100),
 *   blockOnLowCapacity?: boolean
 * }
 *
 * Response:
 * {
 *   hasConflict: boolean,
 *   teamOnLeave: TeamMemberOnLeave[],
 *   totalTeamSize: number,
 *   availableMembers: number,
 *   capacityPercentage: number,
 *   severity: "low" | "medium" | "high" | "critical",
 *   suggestedAlternativeDates?: { startDate, endDate, capacity }[],
 *   warningMessage?: string,
 *   blockSubmission: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authResult.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = checkConflictSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { startDate, endDate, minCapacity, blockOnLowCapacity } =
      validation.data;

    // Convert ISO strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Check for conflicts
    const result = await ConflictDetectorService.checkLeaveConflicts(
      userId,
      start,
      end,
      {
        minCapacity,
        blockOnLowCapacity,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Error checking leave conflicts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leaves/check-conflicts
 *
 * Get conflict settings (for future admin configuration)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await ConflictDetectorService.getConflictSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[API] Error getting conflict settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
