import "dotenv/config";
import bcrypt from "bcryptjs";
import { Role, LeaveType } from "@/src/generated/prisma/client";
import { prisma } from "../lib/prisma";
import { initDefaultOrgSettings } from "../lib/org-settings";

const TEST_PASSWORD = "password123";

async function main() {
    console.log("🌱 Starting test system seed (2 users per role)...\n");

    // Step 1: Clear all data
    console.log("🗑️  Clearing database...");
    await prisma.$transaction([
        prisma.webhookDelivery.deleteMany(),
        prisma.webhook.deleteMany(),
        prisma.leaveCalendarMapping.deleteMany(),
        prisma.calendarConfig.deleteMany(),
        prisma.reportExecution.deleteMany(),
        prisma.scheduledReport.deleteMany(),
        prisma.userDocument.deleteMany(),
        prisma.bankDetails.deleteMany(),
        prisma.emergencyContact.deleteMany(),
        prisma.policyVersion.deleteMany(),
        prisma.leaveTemplate.deleteMany(),
        prisma.hRISConflict.deleteMany(),
        prisma.hRISSync.deleteMany(),
        prisma.escalationRule.deleteMany(),
        prisma.approvalDelegation.deleteMany(),
        prisma.notification.deleteMany(),
        prisma.otpCode.deleteMany(),
        prisma.encashmentRequest.deleteMany(),
        prisma.leaveVersion.deleteMany(),
        prisma.leaveComment.deleteMany(),
        prisma.approval.deleteMany(),
        prisma.leaveRequest.deleteMany(),
        prisma.balanceAdjustment.deleteMany(),
        prisma.balance.deleteMany(),
        prisma.policyConfig.deleteMany(),
        prisma.holiday.deleteMany(),
        prisma.auditLog.deleteMany(),
        prisma.orgSettings.deleteMany(),
        prisma.workflowPolicy.deleteMany(),
        prisma.userPreferences.deleteMany(),
        prisma.userProfile.deleteMany(),
        prisma.user.deleteMany(),
    ]);
    console.log("✅ Database cleared\n");

    // Step 2: Initialize org settings
    try {
        await initDefaultOrgSettings();
        console.log("✅ Org settings initialized\n");
    } catch (error) {
        console.warn("⚠️  Could not initialize org settings:", error);
    }

    // Step 3: Create users
    console.log("👥 Creating test users...");
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const defaultJoinDate = new Date();
    defaultJoinDate.setFullYear(defaultJoinDate.getFullYear() - 2);
    const defaultRetirementDate = new Date(defaultJoinDate);
    defaultRetirementDate.setFullYear(defaultRetirementDate.getFullYear() + 30);

    // System Admins
    const admin1 = await prisma.user.create({
        data: {
            name: "Admin One",
            email: "admin1@test.local",
            password: passwordHash,
            role: Role.SYSTEM_ADMIN,
            department: "IT",
            empCode: "ADMIN-001",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    const admin2 = await prisma.user.create({
        data: {
            name: "Admin Two",
            email: "admin2@test.local",
            password: passwordHash,
            role: Role.SYSTEM_ADMIN,
            department: "IT",
            empCode: "ADMIN-002",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    // CEOs
    const ceo1 = await prisma.user.create({
        data: {
            name: "CEO One",
            email: "ceo1@test.local",
            password: passwordHash,
            role: Role.CEO,
            department: "Executive",
            empCode: "CEO-001",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    const ceo2 = await prisma.user.create({
        data: {
            name: "CEO Two",
            email: "ceo2@test.local",
            password: passwordHash,
            role: Role.CEO,
            department: "Executive",
            empCode: "CEO-002",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    // HR Heads
    const hrhead1 = await prisma.user.create({
        data: {
            name: "HR Head One",
            email: "hrhead1@test.local",
            password: passwordHash,
            role: Role.HR_HEAD,
            department: "HR",
            empCode: "HRHEAD-001",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    const hrhead2 = await prisma.user.create({
        data: {
            name: "HR Head Two",
            email: "hrhead2@test.local",
            password: passwordHash,
            role: Role.HR_HEAD,
            department: "HR",
            empCode: "HRHEAD-002",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    // HR Admins
    const hradmin1 = await prisma.user.create({
        data: {
            name: "HR Admin One",
            email: "hradmin1@test.local",
            password: passwordHash,
            role: Role.HR_ADMIN,
            department: "HR",
            empCode: "HRADMIN-001",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    const hradmin2 = await prisma.user.create({
        data: {
            name: "HR Admin Two",
            email: "hradmin2@test.local",
            password: passwordHash,
            role: Role.HR_ADMIN,
            department: "HR",
            empCode: "HRADMIN-002",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    // Department Heads
    const manager1 = await prisma.user.create({
        data: {
            name: "Manager One",
            email: "manager1@test.local",
            password: passwordHash,
            role: Role.DEPT_HEAD,
            department: "IT",
            empCode: "MGR-001",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    const manager2 = await prisma.user.create({
        data: {
            name: "Manager Two",
            email: "manager2@test.local",
            password: passwordHash,
            role: Role.DEPT_HEAD,
            department: "Finance",
            empCode: "MGR-002",
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    // Employees
    const employee1 = await prisma.user.create({
        data: {
            name: "Employee One",
            email: "employee1@test.local",
            password: passwordHash,
            role: Role.EMPLOYEE,
            department: "IT",
            empCode: "EMP-001",
            deptHeadId: manager1.id,
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    const employee2 = await prisma.user.create({
        data: {
            name: "Employee Two",
            email: "employee2@test.local",
            password: passwordHash,
            role: Role.EMPLOYEE,
            department: "Finance",
            empCode: "EMP-002",
            deptHeadId: manager2.id,
            joinDate: defaultJoinDate,
            retirementDate: defaultRetirementDate,
        },
    });

    console.log("✅ Created 12 test users (2 per role)\n");

    // Step 4: Create holidays (2025 Bangladesh holidays - subset)
    console.log("📅 Creating holidays...");
    const holidays = [
        { date: "2025-01-01", name: "New Year's Day" },
        { date: "2025-02-21", name: "Shaheed Day & International Mother Language Day" },
        { date: "2025-03-17", name: "Bangabandhu's Birthday & National Children's Day" },
        { date: "2025-03-26", name: "Independence & National Day" },
        { date: "2025-03-29", name: "Eid-ul-Fitr" },
        { date: "2025-03-30", name: "Eid-ul-Fitr Holiday" },
        { date: "2025-03-31", name: "Eid-ul-Fitr Holiday" },
        { date: "2025-04-14", name: "Bengali New Year (Pahela Baishakh)" },
        { date: "2025-05-01", name: "May Day" },
        { date: "2025-06-05", name: "Eid-ul-Azha" },
        { date: "2025-06-06", name: "Eid-ul-Azha Holiday" },
        { date: "2025-06-07", name: "Eid-ul-Azha Holiday" },
        { date: "2025-08-15", name: "National Mourning Day" },
        { date: "2025-12-16", name: "Victory Day" },
        { date: "2025-12-25", name: "Christmas Day" },
    ];

    for (const holiday of holidays) {
        await prisma.holiday.create({
            data: {
                date: new Date(`${holiday.date}T00:00:00.000Z`),
                name: holiday.name,
                isOptional: false,
            },
        });
    }
    console.log(`✅ Created ${holidays.length} holidays\n`);

    // Step 5: Create policy configs
    console.log("📋 Creating policy configurations...");
    const policies = [
        { type: LeaveType.EARNED, maxDays: 30, minDays: 1, noticeDays: 7, carryLimit: 15 },
        { type: LeaveType.CASUAL, maxDays: 3, minDays: 1, noticeDays: 1, carryLimit: 0 },
        { type: LeaveType.MEDICAL, maxDays: 14, minDays: 1, noticeDays: 0, carryLimit: 0 },
        { type: LeaveType.MATERNITY, maxDays: 112, minDays: 30, noticeDays: 30, carryLimit: null },
        { type: LeaveType.PATERNITY, maxDays: 10, minDays: 3, noticeDays: 7, carryLimit: null },
    ];

    for (const policy of policies) {
        await prisma.policyConfig.create({
            data: {
                leaveType: policy.type,
                maxDays: policy.maxDays,
                minDays: policy.minDays,
                noticeDays: policy.noticeDays,
                carryLimit: policy.carryLimit,
            },
        });
    }
    console.log(`✅ Created ${policies.length} policy configs\n`);

    // Step 6: Create balances for all users
    console.log("💰 Creating leave balances...");
    const allUsers = [admin1, admin2, ceo1, ceo2, hrhead1, hrhead2, hradmin1, hradmin2, manager1, manager2, employee1, employee2];
    const year = new Date().getFullYear(); // Use current year (2026)

    for (const user of allUsers) {
        for (const type of [LeaveType.EARNED, LeaveType.CASUAL, LeaveType.MEDICAL]) {
            const accrued = type === LeaveType.EARNED ? 24 : type === LeaveType.CASUAL ? 10 : 14;
            await prisma.balance.create({
                data: {
                    userId: user.id,
                    type,
                    year,
                    opening: 0,
                    accrued,
                    used: 0,
                    closing: accrued,
                },
            });
        }
    }
    console.log(`✅ Created balances for ${allUsers.length} users\n`);

    // Summary
    console.log("=".repeat(60));
    console.log("✅ Test system seed completed successfully!\n");
    console.log("📊 Summary:");
    console.log("   - Users: 12 (2 per role)");
    console.log("   - Holidays: " + holidays.length);
    console.log("   - Policy Configs: " + policies.length);
    console.log("   - Leave Balances: " + (allUsers.length * 3));
    console.log("\n🔑 Test Accounts:");
    console.log("   Email pattern: [role][1-2]@test.local");
    console.log("   Password (all): " + TEST_PASSWORD);
    console.log("\n   Examples:");
    console.log("   - admin1@test.local");
    console.log("   - ceo1@test.local");
    console.log("   - hrhead1@test.local");
    console.log("   - hradmin1@test.local");
    console.log("   - manager1@test.local");
    console.log("   - employee1@test.local");
    console.log("=".repeat(60));
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
