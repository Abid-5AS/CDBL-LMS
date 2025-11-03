/**
 * Background Jobs Scheduler
 * 
 * Configures and runs scheduled jobs using node-cron
 * All times are in Asia/Dhaka timezone
 */

import cron from "node-cron";
import { processELAccrual } from "./jobs/el-accrual";
import { processCLLapse } from "./jobs/auto-lapse";
import { processOverstayCheck } from "./jobs/overstay-check";

const DHAKA_TZ = "Asia/Dhaka";

/**
 * Initialize and start all scheduled jobs
 */
export function startScheduler() {
  console.log("[Scheduler] Initializing background jobs...");

  // EL Accrual: Run on 1st of every month at 00:00 Asia/Dhaka
  // Note: cron expressions run in server timezone, so we schedule for UTC offset
  // Asia/Dhaka is UTC+6, so 00:00 Dhaka = 18:00 previous day UTC
  // We check if it's the 1st in Dhaka timezone inside the job
  cron.schedule(
    "0 18 * * *", // Every day at 18:00 UTC (check if 1st in Dhaka timezone)
    async () => {
      const { utcToZonedTime } = await import("date-fns-tz");
      const now = new Date();
      const zonedNow = utcToZonedTime(now, DHAKA_TZ);
      // Only run on 1st of month in Dhaka timezone
      if (zonedNow.getDate() === 1) {
        console.log("[Scheduler] Running EL accrual job...");
        try {
          const results = await processELAccrual();
          console.log(`[Scheduler] EL accrual completed: ${results.length} employees processed`);
        } catch (error) {
          console.error("[Scheduler] EL accrual error:", error);
        }
      }
    },
    {
      scheduled: true,
    }
  );

  // CL Auto-Lapse: Run on Dec 31 at 23:59 Asia/Dhaka
  // 23:59 Dhaka = 17:59 UTC same day
  cron.schedule(
    "59 17 31 12 *", // Dec 31, 17:59 UTC (23:59 Dhaka)
    async () => {
      console.log("[Scheduler] Running CL auto-lapse job...");
      try {
        const results = await processCLLapse();
        console.log(`[Scheduler] CL lapse completed: ${results.length} balances lapsed`);
      } catch (error) {
        console.error("[Scheduler] CL lapse error:", error);
      }
    },
    {
      scheduled: true,
    }
  );

  // Overstay Check: Run daily at midnight Asia/Dhaka
  // 00:00 Dhaka = 18:00 previous day UTC
  cron.schedule(
    "0 18 * * *", // Every day at 18:00 UTC (00:00 Dhaka next day)
    async () => {
      console.log("[Scheduler] Running overstay detection job...");
      try {
        const results = await processOverstayCheck();
        console.log(`[Scheduler] Overstay check completed: ${results.length} overstays detected`);
      } catch (error) {
        console.error("[Scheduler] Overstay check error:", error);
      }
    },
    {
      scheduled: true,
    }
  );

  console.log("[Scheduler] All jobs scheduled successfully");
  console.log("  - EL Accrual: 1st of month at 00:00 Asia/Dhaka (18:00 UTC previous day)");
  console.log("  - CL Auto-Lapse: Dec 31 at 23:59 Asia/Dhaka (17:59 UTC)");
  console.log("  - Overstay Check: Daily at 00:00 Asia/Dhaka (18:00 UTC previous day)");
  console.log(`[Scheduler] Note: Times shown are in Asia/Dhaka timezone (UTC+6)`);
}

/**
 * Start scheduler if run directly
 */
if (require.main === module) {
  console.log("Starting CDBL Leave Management Background Jobs Scheduler...");
  startScheduler();
  console.log("Scheduler running. Press Ctrl+C to stop.");

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("\n[Scheduler] Shutting down...");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n[Scheduler] Shutting down...");
    process.exit(0);
  });
}

