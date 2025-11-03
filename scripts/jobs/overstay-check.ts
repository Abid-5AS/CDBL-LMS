/**
 * Overstay Detection Job
 * 
 * Policy 6.13: Overstay beyond approval requires explanation
 * Rules:
 * - Runs daily at midnight Asia/Dhaka
 * - Finds approved leaves where endDate < today && no return confirmed
 * - For MEDICAL: requires fitnessCertificateUrl (returned to duty)
 * - For others: flags if past endDate and still APPROVED
 * - Sets status to OVERSTAY_PENDING
 * - Notifies HR, logs OVERSTAY_FLAGGED
 */

import { prisma } from "../../lib/prisma";
import { LeaveStatus } from "@prisma/client";
import { normalizeToDhakaMidnight } from "../../lib/date-utils";
import { utcToZonedTime } from "date-fns-tz";

const DHAKA_TZ = "Asia/Dhaka";

interface OverstayResult {
  leaveId: number;
  userId: number;
  email: string;
  type: string;
  endDate: Date;
  daysOverstayed: number;
}

/**
 * Check if leave has been returned to duty
 * For MEDICAL: checks if fitnessCertificateUrl exists
 * For others: checks if there's a RETURN_TO_DUTY audit log entry
 */
async function hasReturnedToDuty(leaveId: number, leaveType: string, fitnessCertificateUrl: string | null): Promise<boolean> {
  // For MEDICAL leave, check if fitness certificate was uploaded
  if (leaveType === "MEDICAL") {
    return !!fitnessCertificateUrl;
  }

  // For other leave types, check audit logs for RETURN_TO_DUTY action
  const returnAudit = await prisma.auditLog.findFirst({
    where: {
      action: "RETURN_TO_DUTY",
      details: {
        path: ["leaveId"],
        equals: leaveId,
      },
    },
  });

  return !!returnAudit;
}

/**
 * Process overstay detection
 * @param checkDate - Date to check against (defaults to today in Dhaka timezone)
 * @returns Array of overstay results
 */
export async function processOverstayCheck(checkDate?: Date): Promise<OverstayResult[]> {
  const now = new Date();
  const zonedNow = utcToZonedTime(now, DHAKA_TZ);
  const today = normalizeToDhakaMidnight(checkDate || zonedNow);

  console.log(`[Overstay Check] Processing overstay detection for ${today.toISOString()}`);

  // Find approved leaves that have passed their endDate
  const expiredLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: LeaveStatus.APPROVED,
      endDate: { lt: today },
    },
    include: {
      requester: {
        select: { email: true },
      },
    },
  });

  const results: OverstayResult[] = [];

  for (const leave of expiredLeaves) {
    // Skip if already flagged as overstay
    if (leave.status === LeaveStatus.OVERSTAY_PENDING) {
      continue;
    }

    // Check if employee has returned to duty
    const hasReturned = await hasReturnedToDuty(
      leave.id,
      leave.type,
      leave.fitnessCertificateUrl,
      leave.status
    );

    if (!hasReturned) {
      const endDate = normalizeToDhakaMidnight(leave.endDate);
      const daysOverstayed = Math.floor((today.getTime() - endDate.getTime()) / 86400000);

      // Update status to OVERSTAY_PENDING
      await prisma.leaveRequest.update({
        where: { id: leave.id },
        data: { status: LeaveStatus.OVERSTAY_PENDING },
      });

      results.push({
        leaveId: leave.id,
        userId: leave.requesterId,
        email: leave.requester.email,
        type: leave.type,
        endDate: leave.endDate,
        daysOverstayed,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorEmail: "system@cdbl.local",
          action: "OVERSTAY_FLAGGED",
          targetEmail: leave.requester.email,
          details: {
            leaveId: leave.id,
            endDate: leave.endDate.toISOString(),
            checkDate: today.toISOString(),
            daysOverstayed,
            leaveType: leave.type,
          },
        },
      });

      // TODO: Send notification to HR (implement notification service later)
      console.log(`[Overstay Check] Flagged leave ${leave.id} - ${daysOverstayed} days overstayed`);
    }
  }

  console.log(`[Overstay Check] Completed: ${results.length} overstays detected`);
  return results;
}

// CLI entry point
if (require.main === module) {
  processOverstayCheck()
    .then((results) => {
      console.log("Overstay Check Results:", results);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Overstay Check Error:", error);
      process.exit(1);
    });
}

