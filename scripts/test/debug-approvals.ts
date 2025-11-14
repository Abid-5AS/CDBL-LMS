import { prisma } from "./lib/prisma";
import { LeaveStatus } from "@prisma/client";

async function debugApprovals() {
  console.log("=== DEBUGGING HR_ADMIN APPROVAL VISIBILITY ===\n");

  // Get HR_ADMIN user
  const hrAdmin = await prisma.user.findFirst({
    where: { role: "HR_ADMIN" },
    select: { id: true, name: true, email: true },
  });

  if (!hrAdmin) {
    console.log("❌ No HR_ADMIN found in database!");
    return;
  }

  console.log("✅ HR_ADMIN User:");
  console.log(JSON.stringify(hrAdmin, null, 2));
  console.log("\n");

  // Get all recent leave requests
  const allLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: {
        in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING],
      },
    },
    include: {
      requester: { select: { id: true, name: true, email: true, role: true } },
      approvals: {
        include: {
          approver: { select: { id: true, name: true, role: true } },
        },
        orderBy: { step: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(
    `📋 Found ${allLeaves.length} SUBMITTED/PENDING leave requests:\n`
  );

  for (const leave of allLeaves) {
    console.log(`\n--- Leave Request #${leave.id} ---`);
    console.log(`Type: ${leave.type}`);
    console.log(`Status: ${leave.status}`);
    console.log(
      `Requester: ${leave.requester.name} (ID: ${leave.requester.id}, Role: ${leave.requester.role})`
    );
    console.log(`Created: ${leave.createdAt}`);
    console.log(`Approvals (${leave.approvals.length}):`);

    if (leave.approvals.length === 0) {
      console.log("  ⚠️  NO APPROVALS - This is the problem!");
    } else {
      leave.approvals.forEach((app) => {
        console.log(
          `  - Step ${app.step}: ${app.decision} by ${
            app.approver?.name || "Unknown"
          } (ID: ${app.approverId}, Role: ${app.approver?.role})`
        );
        if (app.approverId === hrAdmin.id) {
          console.log(`    ⭐ This approval is BY the HR_ADMIN`);
        }
      });
    }
  }

  // Now test the HR_ADMIN where clause
  console.log("\n\n=== TESTING HR_ADMIN QUERY ===\n");

  const hrAdminWhereClause = {
    status: {
      in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING],
    },
    approvals: {
      none: {
        approverId: hrAdmin.id,
        decision: {
          in: ["FORWARDED" as const, "APPROVED" as const, "REJECTED" as const],
        },
      },
    },
  };

  console.log("Where clause:");
  console.log(JSON.stringify(hrAdminWhereClause, null, 2));
  console.log("\n");

  const filteredLeaves = await prisma.leaveRequest.findMany({
    where: hrAdminWhereClause,
    include: {
      requester: { select: { id: true, name: true, email: true } },
      approvals: {
        include: {
          approver: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  console.log(
    `✅ Query returned ${filteredLeaves.length} leave requests for HR_ADMIN\n`
  );

  if (filteredLeaves.length > 0) {
    filteredLeaves.forEach((leave) => {
      console.log(
        `  - Leave #${leave.id}: ${leave.type}, Status: ${leave.status}, Requester: ${leave.requester.name}`
      );
    });
  } else {
    console.log("  ❌ NO RESULTS - This explains why HR_ADMIN sees nothing!\n");
    console.log("  Analyzing why each request was filtered out:");

    for (const leave of allLeaves) {
      console.log(`\n  Leave #${leave.id}:`);
      const hasActionedApproval = leave.approvals.some(
        (app) =>
          app.approverId === hrAdmin.id &&
          ["FORWARDED", "APPROVED", "REJECTED"].includes(app.decision)
      );
      if (hasActionedApproval) {
        console.log(
          `    ❌ FILTERED OUT: HR_ADMIN already has FORWARDED/APPROVED/REJECTED decision`
        );
      } else {
        console.log(
          `    ✅ Should pass filter (no FORWARDED/APPROVED/REJECTED by HR_ADMIN)`
        );
        const pendingApproval = leave.approvals.find(
          (app) => app.approverId === hrAdmin.id && app.decision === "PENDING"
        );
        if (pendingApproval) {
          console.log(`    ℹ️  Has PENDING approval by HR_ADMIN`);
        } else {
          console.log(`    ℹ️  No approval record by HR_ADMIN at all`);
        }
      }
    }
  }

  await prisma.$disconnect();
}

debugApprovals().catch(console.error);
