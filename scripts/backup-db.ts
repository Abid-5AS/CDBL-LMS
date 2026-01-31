import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs";
import path from "path";
import "dotenv/config";

// --- Local Prisma Initialization to avoid Import Issues ---
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("❌ DATABASE_URL is not set in environment variables.");
    process.exit(1);
}

const url = new URL(dbUrl);
const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
});

const prisma = new PrismaClient({ adapter });
// --------------------------------------------------------

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(process.cwd(), "backups");

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    console.log(`📦 Starting backup to ${backupFile}...`);

    // Fetch all data
    const data = {
        users: await prisma.user.findMany(),
        userProfiles: await prisma.userProfile.findMany(),
        userPreferences: await prisma.userPreferences.findMany(),
        leaves: await prisma.leaveRequest.findMany(),
        approvals: await prisma.approval.findMany(),
        balances: await prisma.balance.findMany(),
        balanceAdjustments: await prisma.balanceAdjustment.findMany(),
        holidays: await prisma.holiday.findMany(),
        policyConfigs: await prisma.policyConfig.findMany(),
        orgSettings: await prisma.orgSettings.findMany(),
        auditLogs: await prisma.auditLog.findMany(),
        leaveComments: await prisma.leaveComment.findMany(),
        leaveVersions: await prisma.leaveVersion.findMany(),
        encashmentRequests: await prisma.encashmentRequest.findMany(),
        notifications: await prisma.notification.findMany(),
        otpCodes: await prisma.otpCode.findMany(),
        approvalDelegations: await prisma.approvalDelegation.findMany(),
        escalationRules: await prisma.escalationRule.findMany(),
        hrisSyncs: await prisma.hRISSync.findMany(),
        hrisConflicts: await prisma.hRISConflict.findMany(),
        leaveTemplates: await prisma.leaveTemplate.findMany(),
        policyVersions: await prisma.policyVersion.findMany(),
        emergencyContacts: await prisma.emergencyContact.findMany(),
        bankDetails: await prisma.bankDetails.findMany(),
        userDocuments: await prisma.userDocument.findMany(),
        scheduledReports: await prisma.scheduledReport.findMany(),
        reportExecutions: await prisma.reportExecution.findMany(),
        calendarConfigs: await prisma.calendarConfig.findMany(),
        leaveCalendarMappings: await prisma.leaveCalendarMapping.findMany(),
        webhooks: await prisma.webhook.findMany(),
        webhookDeliveries: await prisma.webhookDelivery.findMany(),
        workflowPolicies: await prisma.workflowPolicy.findMany(),
    };

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    console.log(`✅ Backup completed successfully! Size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
}

main()
    .catch((e) => {
        console.error("❌ Backup failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
