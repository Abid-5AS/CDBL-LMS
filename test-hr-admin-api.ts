import { prisma } from "./lib/prisma";
import { LeaveStatus } from "@prisma/client";

async function testHRAdminAPI() {
  console.log("=== SIMULATING /api/approvals FOR HR_ADMIN ===\n");

  // Get HR_ADMIN user (same logic as API)
  const hrAdmin = await prisma.user.findFirst({
    where: { role: "HR_ADMIN" },
    select: { id: true, name: true, email: true },
  });

  if (!hrAdmin) {
    console.log("❌ No HR_ADMIN found!");
    return;
  }

  console.log(`✅ HR_ADMIN: ${hrAdmin.name} (ID: ${hrAdmin.id})\n`);

  // Use EXACT where clause from /api/approvals route.ts (line 148-160)
  const whereClause = {
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
  console.log(JSON.stringify(whereClause, null, 2));
  console.log("\n");

  // Execute EXACT query from /api/approvals (line 163-174)
  const items = await prisma.leaveRequest.findMany({
    where: whereClause,
    include: {
      requester: { select: { id: true, name: true, email: true, deptHeadId: true } },
      approvals: {
        include: {
          approver: { select: { name: true, role: true } },
        },
        orderBy: { step: "asc" },
      },
    },
    orderBy: { startDate: "asc" },
  });

  console.log(`✅ API would return ${items.length} items\n`);

  if (items.length === 0) {
    console.log("❌ PROBLEM: API returns empty array!\n");
  } else {
    console.log("📋 Items that would be returned:\n");
    items.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. Leave #${item.id}:`);
      console.log(`   Type: ${item.type}`);
      console.log(`   Status: ${item.status}`);
      console.log(`   Requester: ${item.requester.name} (${item.requester.email})`);
      console.log(`   Start Date: ${item.startDate.toISOString().split('T')[0]}`);
      console.log(`   Approvals: ${item.approvals.length} records`);
      item.approvals.forEach(app => {
        console.log(`     - Step ${app.step}: ${app.decision} by ${app.approver?.name} (${app.approver?.role})`);
      });
      console.log("");
    });

    if (items.length > 5) {
      console.log(`... and ${items.length - 5} more items\n`);
    }
  }

  // Double check: Get count of ALL pending/submitted requests
  const totalCount = await prisma.leaveRequest.count({
    where: {
      status: {
        in: [LeaveStatus.SUBMITTED, LeaveStatus.PENDING],
      },
    },
  });

  console.log(`\n📊 Total SUBMITTED/PENDING requests in database: ${totalCount}`);
  console.log(`📊 Requests HR_ADMIN can see: ${items.length}`);
  console.log(`📊 Filtered out: ${totalCount - items.length}\n`);

  // Check why items were filtered
  const filteredOut = totalCount - items.length;
  if (filteredOut > 0) {
    console.log(`ℹ️  ${filteredOut} requests were filtered out because:`);
    console.log(`   - HR_ADMIN already has FORWARDED/APPROVED/REJECTED decision on them\n`);
  }

  await prisma.$disconnect();
}

testHRAdminAPI().catch(console.error);
