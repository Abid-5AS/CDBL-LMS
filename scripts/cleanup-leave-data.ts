#!/usr/bin/env tsx
/**
 * Database Cleanup Script
 *
 * Removes all leave-related data while preserving:
 * - Users and their authentication
 * - Leave balances
 * - Holidays
 * - Policy configurations
 * - Organization settings
 *
 * This gives you a clean slate to test leave request functionality.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupLeaveData() {
  console.log("\n🧹 Starting database cleanup...\n");

  try {
    // Start a transaction to ensure all-or-nothing cleanup
    await prisma.$transaction(async (tx) => {
      // 1. Delete all notifications (includes leave-related and system notifications)
      const notifications = await tx.notification.deleteMany({});
      console.log(`✓ Deleted ${notifications.count} notifications`);

      // 2. Delete all OTP codes (these expire anyway)
      const otps = await tx.otpCode.deleteMany({});
      console.log(`✓ Deleted ${otps.count} OTP codes`);

      // 3. Delete encashment requests
      const encashments = await tx.encashmentRequest.deleteMany({});
      console.log(`✓ Deleted ${encashments.count} encashment requests`);

      // 4. Delete leave comments (will be cascaded but doing explicitly for count)
      const comments = await tx.leaveComment.deleteMany({});
      console.log(`✓ Deleted ${comments.count} leave comments`);

      // 5. Delete leave versions
      const versions = await tx.leaveVersion.deleteMany({});
      console.log(`✓ Deleted ${versions.count} leave versions`);

      // 6. Delete all approvals
      const approvals = await tx.approval.deleteMany({});
      console.log(`✓ Deleted ${approvals.count} approvals`);

      // 7. Delete all leave requests (this is the main table)
      const leaves = await tx.leaveRequest.deleteMany({});
      console.log(`✓ Deleted ${leaves.count} leave requests`);

      // 8. Clean up leave-related audit logs (optional - keeps audit trail clean)
      const auditLogs = await tx.auditLog.deleteMany({
        where: {
          action: {
            in: [
              "LEAVE_REQUEST_CREATED",
              "LEAVE_APPROVED",
              "LEAVE_REJECTED",
              "LEAVE_FORWARDED",
              "LEAVE_RETURNED",
              "LEAVE_CANCELLED",
              "LEAVE_APPROVE",
            ],
          },
        },
      });
      console.log(`✓ Deleted ${auditLogs.count} leave-related audit logs`);

      console.log("\n✅ Cleanup completed successfully!");
      console.log("\nPreserved data:");
      const userCount = await tx.user.count();
      const balanceCount = await tx.balance.count();
      const holidayCount = await tx.holiday.count();
      const policyCount = await tx.policyConfig.count();

      console.log(`  - ${userCount} users`);
      console.log(`  - ${balanceCount} leave balances`);
      console.log(`  - ${holidayCount} holidays`);
      console.log(`  - ${policyCount} policy configurations`);
    });

    console.log("\n🎉 Database is clean and ready for testing!\n");
  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupLeaveData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
