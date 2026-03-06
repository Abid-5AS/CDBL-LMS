import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DelegationService } from "@/lib/services/delegation.service";
import { z } from "zod";

const createDelegationSchema = z.object({
  delegateId: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
});

/**
 * POST /api/approvals/delegate
 *
 * Create a new approval delegation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const delegatorId = user.id;

    const body = await request.json();
    const validation = createDelegationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { delegateId, startDate, endDate, reason } = validation.data;

    const result = await DelegationService.createDelegation(
      delegatorId,
      delegateId,
      new Date(startDate),
      new Date(endDate),
      reason
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("[API] Error creating delegation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/approvals/delegate
 *
 * Get delegations (mine or delegated to me)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "mine"; // "mine" or "received"

    if (type === "received") {
      const delegations = await DelegationService.getDelegatedApprovals(userId);
      return NextResponse.json({ delegations });
    } else {
      const includeInactive = searchParams.get("includeInactive") === "true";
      const delegations = await DelegationService.getMyDelegations(
        userId,
        includeInactive
      );
      return NextResponse.json({ delegations });
    }
  } catch (error) {
    console.error("[API] Error getting delegations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/approvals/delegate/[id]
 *
 * Revoke a delegation
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const delegatorId = user.id;
    const { searchParams } = new URL(request.url);
    const delegationId = searchParams.get("id");

    if (!delegationId) {
      return NextResponse.json(
        { error: "Delegation ID required" },
        { status: 400 }
      );
    }

    const result = await DelegationService.revokeDelegation(
      parseInt(delegationId),
      delegatorId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("[API] Error revoking delegation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
