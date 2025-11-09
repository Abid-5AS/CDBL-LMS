import { prisma } from "./lib/prisma";

async function testApprovalFlow() {
  console.log("=== TESTING APPROVAL FLOW ===\n");

  // Get test users
  const employee = await prisma.user.findFirst({
    where: { role: "EMPLOYEE", email: "employee1@demo.local" },
  });

  const hrAdmin = await prisma.user.findFirst({
    where: { role: "HR_ADMIN" },
  });

  const deptHead = await prisma.user.findFirst({
    where: { role: "DEPT_HEAD" },
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

  console.log("✅ Test Users:");
  console.log(`  Employee: ${employee.name} (ID: ${employee.id})`);
  console.log(`  HR Admin: ${hrAdmin.name} (ID: ${hrAdmin.id})`);
  console.log(`  Dept Head: ${deptHead.name} (ID: ${deptHead.id})`);
  console.log(`  HR Head: ${hrHead.name} (ID: ${hrHead.id})`);
  console.log(`  CEO: ${ceo.name} (ID: ${ceo.id})`);
  console.log("");

  // Get a recent SUBMITTED leave request
  const testLeave = await prisma.leaveRequest.findFirst({
    where: {
      requesterId: employee.id,
      status: "SUBMITTED",
    },
    include: {
      approvals: {
        include: {
          approver: { select: { name: true, role: true } },
        },
        orderBy: { step: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!testLeave) {
    console.log("❌ No SUBMITTED leave request found for testing");
    console.log(
      "   Please create a leave request as employee1@demo.local first"
    );
    return;
  }

  console.log(`📋 Testing with Leave Request #${testLeave.id}:`);
  console.log(`   Type: ${testLeave.type}`);
  console.log(`   Status: ${testLeave.status}`);
  console.log(`   Created: ${testLeave.createdAt}`);
  console.log("");

  console.log(
    `📊 Current Approval Chain (${testLeave.approvals.length} records):`
  );
  testLeave.approvals.forEach((app, idx) => {
    console.log(
      `   ${idx + 1}. Step ${app.step}: ${app.decision} by ${
        app.approver?.name
      } (${app.approver?.role})`
    );
  });
  console.log("");

  // Check expected flow
  console.log("🔍 EXPECTED APPROVAL FLOW:");
  console.log("   1. Employee submits → Status: SUBMITTED");
  console.log("   2. HR Admin forwards to Dept Head → Status: PENDING");
  console.log("   3. Dept Head forwards to HR Head → Status: PENDING");
  console.log("   4. HR Head forwards to CEO → Status: PENDING");
  console.log("   5. CEO approves → Status: APPROVED");
  console.log("");

  // Verify initial state
  console.log("✓ VERIFICATION:");

  // Step 1: Employee submission
  if (testLeave.status === "SUBMITTED") {
    console.log("   ✅ Step 1: Leave request is SUBMITTED by employee");
  } else {
    console.log(`   ❌ Step 1: Expected SUBMITTED, got ${testLeave.status}`);
  }

  // Step 2: HR Admin should have a PENDING approval
  const hrAdminApproval = testLeave.approvals.find(
    (app) => app.approverId === hrAdmin.id
  );
  if (hrAdminApproval && hrAdminApproval.decision === "PENDING") {
    console.log(
      "   ✅ Step 2: HR Admin has PENDING approval (ready to forward)"
    );
  } else if (hrAdminApproval && hrAdminApproval.decision === "FORWARDED") {
    console.log("   ℹ️  Step 2: HR Admin already forwarded to Dept Head");
  } else {
    console.log(
      `   ❌ Step 2: HR Admin approval issue - ${
        hrAdminApproval?.decision || "missing"
      }`
    );
  }

  // Check if forwarded to Dept Head
  const deptHeadApproval = testLeave.approvals.find(
    (app) => app.approverId === deptHead.id
  );
  if (deptHeadApproval) {
    if (deptHeadApproval.decision === "PENDING") {
      console.log(
        "   ✅ Step 3: Dept Head has PENDING approval (ready to forward)"
      );
    } else if (deptHeadApproval.decision === "FORWARDED") {
      console.log("   ℹ️  Step 3: Dept Head already forwarded to HR Head");
    }
  } else {
    console.log("   ⏳ Step 3: Waiting for HR Admin to forward to Dept Head");
  }

  // Check if forwarded to HR Head
  const hrHeadApproval = testLeave.approvals.find(
    (app) => app.approverId === hrHead.id
  );
  if (hrHeadApproval) {
    if (hrHeadApproval.decision === "PENDING") {
      console.log(
        "   ✅ Step 4: HR Head has PENDING approval (ready to forward)"
      );
    } else if (hrHeadApproval.decision === "FORWARDED") {
      console.log("   ℹ️  Step 4: HR Head already forwarded to CEO");
    }
  } else {
    console.log("   ⏳ Step 4: Waiting for Dept Head to forward to HR Head");
  }

  // Check if forwarded to CEO
  const ceoApproval = testLeave.approvals.find(
    (app) => app.approverId === ceo.id
  );
  if (ceoApproval) {
    if (ceoApproval.decision === "PENDING") {
      console.log("   ✅ Step 5: CEO has PENDING approval (ready to approve)");
    } else if (ceoApproval.decision === "APPROVED") {
      console.log("   ✅ Step 5: CEO approved the request");
    }
  } else {
    console.log("   ⏳ Step 5: Waiting for HR Head to forward to CEO");
  }

  console.log("");

  // Show who can see this request
  console.log("👁️  WHO CAN SEE THIS REQUEST:");

  // HR Admin can see if status is SUBMITTED/PENDING and they haven't acted
  const hrAdminCanSee =
    (testLeave.status === "SUBMITTED" || testLeave.status === "PENDING") &&
    (!hrAdminApproval ||
      !["FORWARDED", "APPROVED", "REJECTED"].includes(
        hrAdminApproval.decision
      ));
  console.log(
    `   ${hrAdminCanSee ? "✅" : "❌"} HR Admin can see it: ${hrAdminCanSee}`
  );

  // Dept Head can see if forwarded to them and they haven't acted
  const deptHeadCanSee =
    testLeave.approvals.some(
      (app) => app.decision === "FORWARDED" && app.toRole === "DEPT_HEAD"
    ) &&
    (!deptHeadApproval ||
      !["FORWARDED", "APPROVED", "REJECTED"].includes(
        deptHeadApproval.decision
      ));
  console.log(
    `   ${deptHeadCanSee ? "✅" : "❌"} Dept Head can see it: ${deptHeadCanSee}`
  );

  // HR Head can see if forwarded to them
  const hrHeadCanSee = testLeave.approvals.some(
    (app) => app.decision === "FORWARDED" && app.toRole === "HR_HEAD"
  );
  console.log(
    `   ${hrHeadCanSee ? "✅" : "❌"} HR Head can see it: ${hrHeadCanSee}`
  );

  // CEO can see if forwarded to them
  const ceoCanSee = testLeave.approvals.some(
    (app) => app.decision === "FORWARDED" && app.toRole === "CEO"
  );
  console.log(`   ${ceoCanSee ? "✅" : "❌"} CEO can see it: ${ceoCanSee}`);

  await prisma.$disconnect();
}

testApprovalFlow().catch(console.error);
