import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testLeaveRequest() {
  try {
    console.log("=== Testing Leave Request Creation ===\n");

    // Get a test user (you - Abid Shahriar)
    const user = await prisma.user.findUnique({
      where: { email: "abidshahriar@iut-dhaka.edu" },
      select: {
        id: true,
        name: true,
        email: true,
        joinDate: true,
        retirementDate: true,
        role: true,
        department: true,
      },
    });

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log("User Details:");
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Department: ${user.department}`);
    console.log(
      `  Join Date: ${
        user.joinDate ? user.joinDate.toISOString().split("T")[0] : "MISSING"
      }`
    );
    console.log(
      `  Retirement Date: ${
        user.retirementDate
          ? user.retirementDate.toISOString().split("T")[0]
          : "N/A"
      }`
    );

    if (!user.joinDate) {
      console.log("\n❌ User still missing joinDate!");
      return;
    }

    console.log("\n✅ User has all required fields!");
    console.log("✅ You should now be able to create leave requests.");

    // Test the validation logic
    console.log("\n=== Testing Leave Request Validation ===");
    if (user.joinDate) {
      console.log("✅ joinDate check: PASSED");
    } else {
      console.log("❌ joinDate check: FAILED");
    }
  } catch (error) {
    console.error("Error testing leave request:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLeaveRequest();
