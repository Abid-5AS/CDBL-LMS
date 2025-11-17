import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserData() {
  try {
    console.log("=== Checking User Data ===\n");

    // Get all users with their joinDate status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        empCode: true,
        role: true,
        joinDate: true,
        retirementDate: true,
        department: true,
      },
      orderBy: { id: "asc" },
    });

    console.log(`Found ${users.length} users in database:\n`);

    for (const user of users) {
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Emp Code: ${user.empCode || "N/A"}`);
      console.log(`Role: ${user.role}`);
      console.log(`Department: ${user.department || "N/A"}`);
      console.log(
        `Join Date: ${
          user.joinDate
            ? user.joinDate.toISOString().split("T")[0]
            : "❌ MISSING"
        }`
      );
      console.log(
        `Retirement Date: ${
          user.retirementDate
            ? user.retirementDate.toISOString().split("T")[0]
            : "N/A"
        }`
      );
      console.log("---");
    }

    // Check for users with missing joinDate
    const usersWithoutJoinDate = users.filter((u) => !u.joinDate);
    if (usersWithoutJoinDate.length > 0) {
      console.log("\n⚠️  WARNING: The following users are MISSING joinDate:");
      usersWithoutJoinDate.forEach((u) => {
        console.log(`  - ${u.name} (${u.email}) - ID: ${u.id}`);
      });
      console.log(
        "\nThis will prevent these users from creating leave requests!"
      );
    } else {
      console.log("\n✅ All users have joinDate set.");
    }
  } catch (error) {
    console.error("Error checking user data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();
