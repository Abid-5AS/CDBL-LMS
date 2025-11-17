import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUserJoinDates() {
  try {
    console.log("=== Fixing User Join Dates ===\n");

    // Set joinDate for all users who don't have it
    // Using a default date of 2 years ago for demo purposes
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Set retirement date 30 years from join date (for study leave validation)
    const retirementDate = new Date(twoYearsAgo);
    retirementDate.setFullYear(retirementDate.getFullYear() + 30);

    const result = await prisma.user.updateMany({
      where: {
        joinDate: null,
      },
      data: {
        joinDate: twoYearsAgo,
        retirementDate: retirementDate,
      },
    });

    console.log(`✅ Updated ${result.count} users with join dates`);
    console.log(`   Join Date: ${twoYearsAgo.toISOString().split("T")[0]}`);
    console.log(
      `   Retirement Date: ${retirementDate.toISOString().split("T")[0]}`
    );

    // Verify the fix
    const usersWithoutJoinDate = await prisma.user.count({
      where: { joinDate: null },
    });

    if (usersWithoutJoinDate === 0) {
      console.log("\n✅ SUCCESS: All users now have join dates!");
      console.log("You should now be able to create leave requests.");
    } else {
      console.log(
        `\n⚠️  WARNING: ${usersWithoutJoinDate} users still missing join dates`
      );
    }
  } catch (error) {
    console.error("Error fixing user join dates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserJoinDates();
