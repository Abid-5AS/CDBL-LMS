import { PrismaClient } from "@prisma/client";
import { executeReport } from "../../lib/reports/executor";
import { ReportConfig } from "../../components/reports/builder/ConfigPanel";
// import { sendEmail } from "@/lib/email"; // Assuming email utility exists

const prisma = new PrismaClient();

async function processScheduledReports() {
  console.log("Starting scheduled report processing...");

  // 1. Fetch reports with a schedule
  // In a real system, we'd check if the cron expression matches current time
  // For this MVP, we'll just simulate processing all scheduled reports
  const reports = await prisma.savedReport.findMany({
    where: {
      schedule: { not: null },
    },
    include: { creator: true }
  });

  console.log(`Found ${reports.length} scheduled reports.`);

  for (const report of reports) {
    try {
      console.log(`Processing report: ${report.name} (${report.id})`);

      // 2. Execute Report
      const config = report.config as unknown as ReportConfig;
      const data = await executeReport(config);

      // 3. Generate CSV/PDF (Mock)
      const csvContent = JSON.stringify(data, null, 2); // Mock content

      // 4. Send Email
      const recipients = report.recipients ? report.recipients.split(",") : [report.creator.email];

      console.log(`Sending report to: ${recipients.join(", ")}`);
      // await sendEmail({
      //   to: recipients,
      //   subject: `Scheduled Report: ${report.name}`,
      //   body: `Here is your scheduled report.\n\n${csvContent}`,
      // });

    } catch (error) {
      console.error(`Failed to process report ${report.id}:`, error);
    }
  }

  console.log("Scheduled report processing complete.");
}

// Run if called directly
if (require.main === module) {
  processScheduledReports()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
