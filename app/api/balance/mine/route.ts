import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LeaveType } from "@/src/generated/prisma/client";

export const cache = "no-store";

/**
 * @swagger
 * /api/balance/mine:
 *   get:
 *     summary: Get current user's leave balance
 *     description: Retrieve the authenticated user's leave balance for the current year. Can return simple or detailed breakdown.
 *     tags:
 *       - Balance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: detailed
 *         in: query
 *         description: Set to 'true' for detailed balance breakdown including opening, accrued, used, and closing balances
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *     responses:
 *       200:
 *         description: Successfully retrieved balance
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Simple balance response (default)
 *                   properties:
 *                     year:
 *                       type: number
 *                       example: 2025
 *                     EARNED:
 *                       type: number
 *                       description: Remaining earned leave days
 *                       example: 15
 *                     CASUAL:
 *                       type: number
 *                       description: Remaining casual leave days
 *                       example: 8
 *                     MEDICAL:
 *                       type: number
 *                       description: Remaining medical leave days
 *                       example: 12
 *                 - type: object
 *                   description: Detailed balance response (when detailed=true)
 *                   properties:
 *                     year:
 *                       type: number
 *                       example: 2025
 *                     balances:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             $ref: '#/components/schemas/LeaveType'
 *                           opening:
 *                             type: number
 *                             description: Opening balance at start of year
 *                             example: 10
 *                           accrued:
 *                             type: number
 *                             description: Leave days accrued during the year
 *                             example: 24
 *                           used:
 *                             type: number
 *                             description: Leave days used
 *                             example: 8
 *                           closing:
 *                             type: number
 *                             description: Current/closing balance
 *                             example: 26
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get("detailed") === "true";

  const year = new Date().getFullYear();
  const balances = await prisma.balance.findMany({
    where: { userId: me.id, year },
  });

  const remaining = (type: LeaveType) => {
    const record = balances.find((b) => b.type === type);
    if (!record) return 0;
    // Use closing balance if available, otherwise calculate from opening + accrued - used
    if (record.closing !== null && record.closing !== undefined) {
      return record.closing;
    }
    return Math.max((record.opening ?? 0) + (record.accrued ?? 0) - (record.used ?? 0), 0);
  };

  // Return detailed balance breakdown if requested
  if (detailed) {
    const detailedBalances = (["EARNED", "CASUAL", "MEDICAL"] as LeaveType[]).map((type) => {
      const record = balances.find((b) => b.type === type);
      return {
        type,
        opening: record?.opening ?? 0,
        accrued: record?.accrued ?? 0,
        used: record?.used ?? 0,
        closing: record?.closing ?? remaining(type),
      };
    });

    return NextResponse.json({
      year,
      balances: detailedBalances,
    });
  }

  // Return simple remaining balances (backward compatible)
  return NextResponse.json({
    year,
    EARNED: remaining("EARNED"),
    CASUAL: remaining("CASUAL"),
    MEDICAL: remaining("MEDICAL"),
  });
}
