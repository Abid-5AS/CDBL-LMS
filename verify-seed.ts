import { prisma } from "./lib/prisma";

async function verifySeed() {
  console.log("🔍 Verifying seed data...\n");

  // Count users by role
  const userCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });

  console.log("👥 Users by Role:");
  userCounts.forEach((count) => {
    console.log(`   ${count.role}: ${count._count}`);
  });

  // Count leave requests by status
  const leaveCounts = await prisma.leaveRequest.groupBy({
    by: ["status"],
    _count: true,
  });

  console.log("\n📋 Leave Requests by Status:");
  leaveCounts.forEach((count) => {
    console.log(`   ${count.status}: ${count._count}`);
  });

  // Count leave requests by type
  const leaveTypeCounts = await prisma.leaveRequest.groupBy({
    by: ["type"],
    _count: true,
  });

  console.log("\n📊 Leave Requests by Type:");
  leaveTypeCounts.forEach((count) => {
    console.log(`   ${count.type}: ${count._count}`);
  });

  // Count holidays
  const holidayCount = await prisma.holiday.count();
  console.log(`\n🎉 Holidays: ${holidayCount}`);

  // Count balances
  const balanceCount = await prisma.balance.count();
  console.log(`💰 Balances: ${balanceCount}`);

  // Count approvals
  const approvalCount = await prisma.approval.count();
  console.log(`✅ Approvals: ${approvalCount}`);

  // Count policy configs
  const policyCount = await prisma.policyConfig.count();
  console.log(`📜 Policy Configs: ${policyCount}`);

  // Count audit logs
  const auditCount = await prisma.auditLog.count();
  console.log(`📝 Audit Logs: ${auditCount}`);

  // Sample users
  console.log("\n👤 Sample Users:");
  const sampleUsers = await prisma.user.findMany({
    take: 5,
    select: {
      name: true,
      email: true,
      role: true,
      department: true,
      empCode: true,
    },
  });

  sampleUsers.forEach((user) => {
    console.log(
      `   ${user.empCode} - ${user.name} (${user.email}) - ${user.role} - ${user.department || "N/A"}`
    );
  });

  // Sample leave requests
  console.log("\n📋 Sample Leave Requests:");
  const sampleLeaves = await prisma.leaveRequest.findMany({
    take: 5,
    include: {
      requester: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  sampleLeaves.forEach((leave) => {
    console.log(
      `   #${leave.id} - ${leave.requester.name} - ${leave.type} - ${leave.workingDays} days - ${leave.status}`
    );
  });

  // Pending requests for IT Dept Head
  const itDeptHead = await prisma.user.findFirst({
    where: {
      role: "DEPT_HEAD",
      department: "IT",
    },
  });

  if (itDeptHead) {
    const pendingForDeptHead = await prisma.leaveRequest.findMany({
      where: {
        status: "PENDING",
        requester: {
          department: "IT",
        },
      },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(
      `\n⏳ Pending Requests for IT Dept Head (${itDeptHead.name}):`
    );
    if (pendingForDeptHead.length === 0) {
      console.log("   No pending requests");
    } else {
      pendingForDeptHead.forEach((leave) => {
        console.log(
          `   #${leave.id} - ${leave.requester.name} - ${leave.type} - ${leave.workingDays} days`
        );
      });
    }
  }

  console.log("\n✅ Verification complete!");
}

verifySeed()
  .catch((error) => {
    console.error("❌ Verification failed:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
