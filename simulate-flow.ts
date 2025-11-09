import { prisma } from "./lib/prisma";

async function simulateCompleteFlow() {
  console.log("=== SIMULATING COMPLETE APPROVAL FLOW ===\n");

  // Get users
  const employee = await prisma.user.findFirst({
    where: { role: "EMPLOYEE", email: "employee1@demo.local" },
  });

  const hrAdmin = await prisma.user.findFirst({
    where: { role: "HR_ADMIN" },
  });

  const deptHead = await prisma.user.findFirst({
    where: { role: "DEPT_HEAD", teamMembers: { some: { id: employee?.id } } },
  });

  const hrHead = await prisma.user.findFirst({
    where: { role: "HR_HEAD" },
  });

  const ceo = await prisma.user.findFirst({
    where: { role: "CEO" },
  });

  if (!employee || !hrAdmin || !deptHead || !hrHead || !ceo) {
    console.log("❌ Missing required users");
    return;
  }

  console.log("Users:");
  console.log(`  Employee: ${employee.name} (ID: ${employee.id})`);
  console.log(`  HR Admin: ${hrAdmin.name} (ID: ${hrAdmin.id})`);
  console.log(`  Dept Head: ${deptHead.name} (ID: ${deptHead.id})`);
  console.log(`  HR Head: ${hrHead.name} (ID: ${hrHead.id})`);
  console.log(`  CEO: ${ceo.name} (ID: ${ceo.id})`);
  console.log("");

  // Step 1: Create a test leave request
  console.log("Step 1: Employee submits leave request...");
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      requesterId: employee.id,
      type: "EARNED",
      startDate: new Date("2025-12-15"),
      endDate: new Date("2025-12-17"),
      workingDays: 3,
      reason: "Test approval flow",
      status: "SUBMITTED",
      needsCertificate: false,
      policyVersion: "1.0",
    },
  });

  // Create initial HR_ADMIN approval
  await prisma.approval.create({
    data: {
      leaveId: leaveRequest.id,
      step: 1,
      approverId: hrAdmin.id,
      decision: "PENDING",
    },
  });

  console.log(
    `✅ Leave request #${leaveRequest.id} created with status: ${leaveRequest.status}`
  );
  console.log("");

  // Step 2: HR Admin forwards to Dept Head
  console.log("Step 2: HR Admin forwards to Dept Head...");
  await prisma.approval.updateMany({
    where: {
      leaveId: leaveRequest.id,
      approverId: hrAdmin.id,
      decision: "PENDING",
    },
    data: {
      decision: "FORWARDED",
      toRole: "DEPT_HEAD",
      decidedAt: new Date(),
    },
  });

  await prisma.approval.create({
    data: {
      leaveId: leaveRequest.id,
      step: 2,
      approverId: deptHead.id,
      decision: "PENDING",
    },
  });

  await prisma.leaveRequest.update({
    where: { id: leaveRequest.id },
    data: { status: "PENDING" },
  });

  console.log("✅ Forwarded to Dept Head");
  console.log("");

  // Step 3: Dept Head forwards to HR Head
  console.log("Step 3: Dept Head forwards to HR Head...");
  await prisma.approval.updateMany({
    where: {
      leaveId: leaveRequest.id,
      approverId: deptHead.id,
      decision: "PENDING",
    },
    data: {
      decision: "FORWARDED",
      toRole: "HR_HEAD",
      decidedAt: new Date(),
    },
  });

  await prisma.approval.create({
    data: {
      leaveId: leaveRequest.id,
      step: 3,
      approverId: hrHead.id,
      decision: "PENDING",
    },
  });

  console.log("✅ Forwarded to HR Head");
  console.log("");

  // Step 4: HR Head forwards to CEO
  console.log("Step 4: HR Head forwards to CEO...");
  await prisma.approval.updateMany({
    where: {
      leaveId: leaveRequest.id,
      approverId: hrHead.id,
      decision: "PENDING",
    },
    data: {
      decision: "FORWARDED",
      toRole: "CEO",
      decidedAt: new Date(),
    },
  });

  await prisma.approval.create({
    data: {
      leaveId: leaveRequest.id,
      step: 4,
      approverId: ceo.id,
      decision: "PENDING",
    },
  });

  console.log("✅ Forwarded to CEO");
  console.log("");

  // Step 5: CEO approves
  console.log("Step 5: CEO approves...");
  await prisma.approval.updateMany({
    where: {
      leaveId: leaveRequest.id,
      approverId: ceo.id,
      decision: "PENDING",
    },
    data: {
      decision: "APPROVED",
      decidedAt: new Date(),
    },
  });

  await prisma.leaveRequest.update({
    where: { id: leaveRequest.id },
    data: { status: "APPROVED" },
  });

  console.log("✅ Approved by CEO");
  console.log("");

  // Verify final state
  const finalLeave = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequest.id },
    include: {
      approvals: {
        include: {
          approver: { select: { name: true, role: true } },
        },
        orderBy: { step: "asc" },
      },
    },
  });

  console.log("=== FINAL STATE ===");
  console.log(`Leave Request #${finalLeave!.id}: ${finalLeave!.status}`);
  console.log("\nApproval Chain:");
  finalLeave!.approvals.forEach((app, idx) => {
    console.log(
      `  ${idx + 1}. Step ${app.step}: ${app.decision} by ${
        app.approver?.name
      } (${app.approver?.role})`
    );
  });

  console.log("\n✅ APPROVAL FLOW COMPLETE!");

  await prisma.$disconnect();
}

simulateCompleteFlow().catch(console.error);
