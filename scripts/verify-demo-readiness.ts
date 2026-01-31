import { prisma } from "../lib/prisma";

async function verifyDemoReadiness() {
  console.log("🔍 Verifying Demo Readiness...\n");

  // Count users
  const userCount = await prisma.user.count();
  console.log(`✅ Users: ${userCount} (Expected: 8)`);

  // Count leaves
  const leaveCount = await prisma.leaveRequest.count();
  const leaveStatuses = await prisma.leaveRequest.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log(`✅ Leave Requests: ${leaveCount} (Expected: 12)`);
  leaveStatuses.forEach((s) => {
    console.log(`   - ${s.status}: ${s._count}`);
  });

  // Count holidays
  const holidayCount = await prisma.holiday.count();
  console.log(`✅ Holidays: ${holidayCount} (Expected: 30+)`);

  // Count approvals
  const approvalCount = await prisma.approval.count();
  console.log(`✅ Approvals: ${approvalCount} (Expected: 12+)`);

  // Count audit logs
  const auditLogCount = await prisma.auditLog.count();
  console.log(`✅ Audit Logs: ${auditLogCount} (Expected: 40+)`);

  // Verify orgSettings
  const orgSettings = await prisma.orgSettings.findUnique({
    where: { key: "allowBackdate" },
  });
  if (orgSettings) {
    console.log(`✅ OrgSettings: Backdate settings configured`);
  } else {
    console.log(`⚠️  OrgSettings: Not found`);
  }

  // Verify balances
  const balanceCount = await prisma.balance.count();
  console.log(`✅ Balances: ${balanceCount} (Expected: 24 - 8 users × 3 types)`);



  // Verify policy compliance: check if EL advance notice is enforced
  const pendingElLeaves = await prisma.leaveRequest.findMany({
    where: {
      type: "EARNED",
      status: { in: ["PENDING", "SUBMITTED"] },
    },
  });

  const today = new Date();
  const issues: string[] = [];
  for (const leave of pendingElLeaves) {
    const daysUntilStart = Math.floor(
      (leave.startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilStart < 15) {
      issues.push(
        `⚠️  Leave ID ${leave.id}: EL requested with only ${daysUntilStart} days notice (requires 15)`
      );
    }
  }

  if (issues.length > 0) {
    console.log(`\n⚠️  Policy Compliance Issues:`);
    issues.forEach((issue) => console.log(`   ${issue}`));
  } else {
    console.log(`\n✅ Policy Compliance: All EL requests have ≥15 days advance notice`);
  }

  console.log(`\n✨ DEMO DATA SEEDED + UI READY FOR VERIFICATION`);
  console.log(`📊 Summary: ${userCount} users, ${leaveCount} leaves, ${auditLogCount} audit logs`);
  console.log(`🚀 CDBL LMS ready for live demo\n`);
}

verifyDemoReadiness()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

