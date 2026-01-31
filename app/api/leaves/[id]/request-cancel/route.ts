import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/errors";
import { getTraceId } from "@/lib/trace";
import { CancellationService } from "@/lib/services/cancellation.service";

export const cache = "no-store";

const RequestCancelSchema = z.object({
    reason: z.string().min(10, "Reason must be at least 10 characters"),
    newStartDate: z.string().optional(),
    newEndDate: z.string().optional(),
});

/**
 * User-initiated cancellation REQUEST for approved leaves.
 * Unlike direct cancellation by DEPT_HEAD, this creates a cancellation
 * request that follows the approval workflow.
 * 
 * @swagger
 * /api/leaves/{id}/request-cancel:
 *   post:
 *     summary: Request cancellation of an approved leave
 *     description: |
 *       Submit a cancellation request for an approved leave.
 *       The request will go through the same approval workflow as the original leave,
 *       but only to approvers who already approved it.
 *       Supports both full and partial cancellation.
 *     tags:
 *       - Leaves
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the approved leave request to cancel
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 description: Reason for cancellation request
 *                 example: "Meeting rescheduled, no longer need time off"
 *               newStartDate:
 *                 type: string
 *                 format: date
 *                 description: For partial cancellation - new start date (must be within original range)
 *               newEndDate:
 *                 type: string
 *                 format: date
 *                 description: For partial cancellation - new end date (must be within original range)
 *     responses:
 *       200:
 *         description: Cancellation request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 cancellationId:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only cancel own leaves
 *       404:
 *         description: Leave not found
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const traceId = getTraceId(request as any);
    const me = await getCurrentUser();

    if (!me) {
        return NextResponse.json(error("unauthorized", undefined, traceId), { status: 401 });
    }

    try {
        const { id } = await params;
        const leaveId = parseInt(id, 10);

        if (isNaN(leaveId)) {
            return NextResponse.json(
                error("validation_error", "Invalid leave ID", traceId),
                { status: 400 }
            );
        }

        const json = await request.json();
        const parsed = RequestCancelSchema.parse(json);

        const result = await CancellationService.createCancellationRequest(
            me.id,
            leaveId,
            {
                reason: parsed.reason,
                newStartDate: parsed.newStartDate ? new Date(parsed.newStartDate) : undefined,
                newEndDate: parsed.newEndDate ? new Date(parsed.newEndDate) : undefined,
            }
        );

        if (!result.success) {
            const statusCode =
                result.error?.code === "not_found" ? 404 :
                    result.error?.code === "forbidden" ? 403 :
                        400;

            return NextResponse.json(
                error(result.error!.code, result.error!.message, traceId),
                { status: statusCode }
            );
        }

        return NextResponse.json({
            ok: true,
            cancellationId: result.data.id,
            message: result.data.isPartialCancellation
                ? "Partial cancellation request submitted for approval"
                : "Cancellation request submitted for approval",
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json(
                error("validation_error", "Invalid request data", traceId, { errors: err.format() }),
                { status: 400 }
            );
        }
        console.error("POST /api/leaves/[id]/request-cancel error:", err);
        return NextResponse.json(
            error("internal_error", "Failed to create cancellation request", traceId),
            { status: 500 }
        );
    }
}
