import { prisma } from "../lib/prisma";
import { getStepForRole } from "../lib/workflow";
import type { AppRole } from "../lib/rbac";

/**
 * Populate missing return comments and approvals for RETURNED leaves
 * This script finds all leaves with status="RETURNED" that don't have
 * proper return comments/approvals and creates them.
 */
async function populateReturnedLeaves() {
  console.log("🔍 Finding all RETURNED leaves...");

  // Find all returned leaves
  const returnedLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: "RETURNED",
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          deptHeadId: true,
          department: true,
        },
      },
      comments: {
        where: {
          authorRole: {
            in: ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      approvals: {
        where: {
          decision: "FORWARDED",
          comment: {
            not: null,
          },
        },
        orderBy: {
          decidedAt: "desc",
        },
        take: 1,
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  console.log(`📋 Found ${returnedLeaves.length} returned leave(s)`);

  let updated = 0;
  let skipped = 0;

  for (const leave of returnedLeaves) {
    // Check if this leave already has a return comment or approval
    const hasReturnComment = leave.comments.length > 0;
    const hasReturnApproval = leave.approvals.length > 0 && leave.approvals[0].comment;

    if (hasReturnComment && hasReturnApproval) {
      console.log(`✓ Leave ${leave.id} already has return data, skipping...`);
      skipped++;
      continue;
    }

    // Try to find who returned it from AuditLog
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: "LEAVE_RETURN",
        targetEmail: leave.requester.email,
        createdAt: {
          gte: leave.createdAt,
          lte: leave.updatedAt,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let approverId: number | null = null;
    let approverRole: AppRole = "HR_ADMIN";
    let returnComment = "Please review and resubmit with the requested corrections.";

    if (auditLog) {
      // Try to find the approver from audit log
      const approverEmail = auditLog.actorEmail;
      const approver = await prisma.user.findUnique({
        where: { email: approverEmail },
        select: { id: true, role: true },
      });

      if (approver) {
        approverId = approver.id;
        approverRole = approver.role as AppRole;

        // Extract comment from audit log if available
        if (auditLog.details && typeof auditLog.details === "object" && "comment" in auditLog.details) {
          const comment = (auditLog.details as any).comment;
          if (typeof comment === "string" && comment.length > 0) {
            returnComment = comment;
          }
        }
      }
    }

    // If no approver found from audit log, try to find department head
    if (!approverId && leave.requester.deptHeadId) {
      const deptHead = await prisma.user.findUnique({
        where: { id: leave.requester.deptHeadId },
        select: { id: true, role: true },
      });

      if (deptHead && ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD"].includes(deptHead.role)) {
        approverId = deptHead.id;
        approverRole = deptHead.role as AppRole;
      }
    }

    // If still no approver, find any HR_ADMIN or HR_HEAD
    if (!approverId) {
      const hrAdmin = await prisma.user.findFirst({
        where: {
          role: {
            in: ["HR_ADMIN", "HR_HEAD"],
          },
        },
        select: { id: true, role: true },
        orderBy: { id: "asc" },
      });

      if (hrAdmin) {
        approverId = hrAdmin.id;
        approverRole = hrAdmin.role as AppRole;
      }
    }

    if (!approverId) {
      console.error(`❌ Could not find an approver for leave ${leave.id}, skipping...`);
      skipped++;
      continue;
    }

    console.log(`📝 Processing leave ${leave.id}...`);

    // Create return comment if missing
    if (!hasReturnComment) {
      await prisma.leaveComment.create({
        data: {
          leaveId: leave.id,
          authorId: approverId,
          authorRole: approverRole,
          comment: returnComment,
        },
      });
      console.log(`  ✓ Created return comment`);
    }

    // Create return approval if missing
    if (!hasReturnApproval) {
      const step = getStepForRole(approverRole, leave.type);
      await prisma.approval.create({
        data: {
          leaveId: leave.id,
          step,
          approverId: approverId,
          decision: "FORWARDED",
          toRole: null, // Returning to employee
          comment: returnComment,
          decidedAt: leave.updatedAt || new Date(),
        },
      });
      console.log(`  ✓ Created return approval`);
    }

    updated++;
  }

  console.log(`\n✅ Done! Updated ${updated} leave(s), skipped ${skipped} leave(s)`);
}

// Run the script
populateReturnedLeaves()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

