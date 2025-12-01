# Database Reset & Test Data Seeding Guide

**Purpose**: Setup, reset, and manage test database for QA testing
**Version**: 1.0
**Status**: Ready to implement

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Database Reset Methods](#database-reset-methods)
3. [Test Data Seeding](#test-data-seeding)
4. [Reset Scripts](#reset-scripts)
5. [Data Verification](#data-verification)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Complete Setup in 2 Minutes

```bash
# 1. Ensure MySQL is running
mysql -u user -p -e "SELECT 1;"

# 2. Reset database with migrations and seeds
npx prisma migrate reset --force

# 3. Start server
npm run dev

# 4. Verify in browser
# Open http://localhost:3000
# Should see dashboard with test user
```

---

## Database Reset Methods

### Method 1: Complete Reset (RECOMMENDED)

Completely wipes database, re-applies migrations, and re-seeds data.

```bash
# Reset everything (will prompt for confirmation)
npx prisma migrate reset

# Or force without prompt (for automation)
npx prisma migrate reset --force

# Expected output:
# ✓ Successfully reset your database
# ✓ Ran 6 migrations
# ✓ Seeded the database
```

**Use when**:
- Starting fresh testing cycle
- Database corrupted
- Need clean state
- Testing migration

---

### Method 2: Soft Reset (Keep Structure)

Keeps database schema but clears all data.

```bash
# First, delete data from tables (respecting foreign keys)
npx prisma db execute --stdin << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE LeaveComment;
TRUNCATE TABLE Notification;
TRUNCATE TABLE Approval;
TRUNCATE TABLE LeaveRequest;
TRUNCATE TABLE Balance;
TRUNCATE TABLE Holiday;
TRUNCATE TABLE AuditLog;
TRUNCATE TABLE User;

SET FOREIGN_KEY_CHECKS = 1;
EOF

# Then reseed
npm run seed
```

**Use when**:
- Keeping migrations
- Quick data reset
- Between test cycles

---

### Method 3: Selective Reset

Reset only specific tables or user data.

```bash
# Reset only leave requests for an employee
npx prisma db execute --stdin << 'EOF'
DELETE FROM LeaveRequest WHERE userId = 'user-emp-001';
DELETE FROM Approval WHERE leaveRequestId IN (
  SELECT id FROM LeaveRequest WHERE userId = 'user-emp-001'
);
DELETE FROM LeaveComment WHERE leaveRequestId IN (
  SELECT id FROM LeaveRequest WHERE userId = 'user-emp-001'
);
EOF

# Reset balances for employee
npx prisma db execute --stdin << 'EOF'
DELETE FROM Balance WHERE userId = 'user-emp-001';
EOF
```

**Use when**:
- Testing specific user scenarios
- Clearing test requests
- Keeping other data intact

---

### Method 4: Via API Endpoint

Create admin API endpoint for database reset.

**File**: `app/api/admin/reset-database/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * TESTING ONLY ENDPOINT
 * POST /api/admin/reset-database
 * Resets test database and reseeds
 */
export async function POST(request: NextRequest) {
  // Security checks
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Endpoint not available in production" },
      { status: 403 }
    );
  }

  // Optional: Check for reset token in header
  const resetToken = request.headers.get("x-reset-token");
  if (resetToken !== process.env.RESET_TOKEN && process.env.RESET_TOKEN) {
    return NextResponse.json(
      { error: "Invalid reset token" },
      { status: 401 }
    );
  }

  try {
    console.log("Starting database reset...");

    // Delete data in reverse order (foreign key constraints)
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;

    // Delete all records from tables
    await prisma.leaveComment.deleteMany();
    console.log("✓ Cleared LeaveComment");

    await prisma.notification.deleteMany();
    console.log("✓ Cleared Notifications");

    await prisma.approval.deleteMany();
    console.log("✓ Cleared Approvals");

    await prisma.leaveRequest.deleteMany();
    console.log("✓ Cleared LeaveRequest");

    await prisma.balance.deleteMany();
    console.log("✓ Cleared Balance");

    await prisma.holiday.deleteMany();
    console.log("✓ Cleared Holiday");

    await prisma.auditLog.deleteMany();
    console.log("✓ Cleared AuditLog");

    await prisma.user.deleteMany();
    console.log("✓ Cleared User");

    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;

    // Reseed data
    await seedDatabase();

    return NextResponse.json({
      success: true,
      message: "Database reset and reseeded successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Reset failed:", error);
    return NextResponse.json(
      {
        error: "Database reset failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function seedDatabase() {
  // ... seed code here (see Test Data Seeding section)
}
```

**Usage**:

```bash
# Call the endpoint
curl -X POST http://localhost:3000/api/admin/reset-database \
  -H "Content-Type: application/json" \
  -H "x-reset-token: your-reset-token"
```

---

## Test Data Seeding

### Seed File Location

**File**: `prisma/seed.ts`

### Complete Seed Script

```typescript
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  try {
    // ============================================
    // 1. CREATE TEST USERS
    // ============================================

    const hashedPassword = await bcrypt.hash("Test@123456", 10);

    const users = await Promise.all([
      // CEO
      prisma.user.create({
        data: {
          id: "user-ceo-001",
          email: "ceo@cdbl.com",
          name: "Chief Executive Officer",
          password: hashedPassword,
          role: "CEO",
          department: "Executive",
          designation: "Chief Executive Officer",
          joiningDate: new Date("2020-01-01"),
          isActive: true,
          gender: "M",
        },
      }),

      // HR Head
      prisma.user.create({
        data: {
          id: "user-hrhead-001",
          email: "hrhead@cdbl.com",
          name: "HR Head",
          password: hashedPassword,
          role: "HR_HEAD",
          department: "Human Resources",
          designation: "Head of HR",
          joiningDate: new Date("2020-06-15"),
          isActive: true,
          gender: "F",
          supervisorId: "user-ceo-001",
        },
      }),

      // HR Admin
      prisma.user.create({
        data: {
          id: "user-hradmin-001",
          email: "hradmin@cdbl.com",
          name: "HR Admin",
          password: hashedPassword,
          role: "HR_ADMIN",
          department: "Human Resources",
          designation: "HR Administrator",
          joiningDate: new Date("2021-03-01"),
          isActive: true,
          gender: "M",
          supervisorId: "user-hrhead-001",
        },
      }),

      // Department Head
      prisma.user.create({
        data: {
          id: "user-depthead-001",
          email: "depthead@cdbl.com",
          name: "Department Head",
          password: hashedPassword,
          role: "DEPT_HEAD",
          department: "Operations",
          designation: "Department Head",
          joiningDate: new Date("2019-09-10"),
          isActive: true,
          gender: "M",
          supervisorId: "user-hrhead-001",
        },
      }),

      // Employee 1 (Operations)
      prisma.user.create({
        data: {
          id: "user-emp-001",
          email: "employee1@cdbl.com",
          name: "Employee One",
          password: hashedPassword,
          role: "EMPLOYEE",
          department: "Operations",
          designation: "Senior Officer",
          joiningDate: new Date("2018-05-20"),
          isActive: true,
          gender: "M",
          supervisorId: "user-depthead-001",
        },
      }),

      // Employee 2 (Finance)
      prisma.user.create({
        data: {
          id: "user-emp-002",
          email: "employee2@cdbl.com",
          name: "Employee Two",
          password: hashedPassword,
          role: "EMPLOYEE",
          department: "Finance",
          designation: "Finance Officer",
          joiningDate: new Date("2019-11-15"),
          isActive: true,
          gender: "F",
          supervisorId: "user-hrhead-001",
        },
      }),

      // Employee 3 (IT)
      prisma.user.create({
        data: {
          id: "user-emp-003",
          email: "employee3@cdbl.com",
          name: "Employee Three",
          password: hashedPassword,
          role: "EMPLOYEE",
          department: "IT",
          designation: "IT Officer",
          joiningDate: new Date("2020-07-01"),
          isActive: true,
          gender: "M",
          supervisorId: "user-ceo-001",
        },
      }),
    ]);

    console.log(`✓ Created ${users.length} test users`);

    // ============================================
    // 2. CREATE HOLIDAYS FOR 2025
    // ============================================

    const holidays = await Promise.all([
      prisma.holiday.create({
        data: {
          date: new Date("2025-01-26"),
          name: "Republic Day",
          type: "NATIONAL",
          description: "National Holiday",
          createdBy: "user-ceo-001",
        },
      }),
      prisma.holiday.create({
        data: {
          date: new Date("2025-03-17"),
          name: "Bengali New Year",
          type: "NATIONAL",
          description: "Bengali New Year",
          createdBy: "user-ceo-001",
        },
      }),
      prisma.holiday.create({
        data: {
          date: new Date("2025-08-15"),
          name: "Independence Day",
          type: "NATIONAL",
          description: "National Holiday",
          createdBy: "user-ceo-001",
        },
      }),
      prisma.holiday.create({
        data: {
          date: new Date("2025-12-16"),
          name: "Victory Day",
          type: "NATIONAL",
          description: "National Holiday",
          createdBy: "user-ceo-001",
        },
      }),
      prisma.holiday.create({
        data: {
          date: new Date("2025-12-25"),
          name: "Christmas",
          type: "OPTIONAL",
          description: "Optional Holiday",
          createdBy: "user-ceo-001",
        },
      }),
    ]);

    console.log(`✓ Created ${holidays.length} holidays`);

    // ============================================
    // 3. CREATE LEAVE BALANCES FOR ALL USERS
    // ============================================

    const leaveTypes = [
      { type: "CASUAL_LEAVE", opening: 5, accrued: 8.33, used: 2 },
      { type: "MEDICAL_LEAVE", opening: 0, accrued: 11.67, used: 1 },
      { type: "EARNED_LEAVE", opening: 15, accrued: 15, used: 5 },
      { type: "EXTRA_LEAVE_WITH_PAY", opening: 0, accrued: 0, used: 0 },
      { type: "EXTRA_LEAVE_WITHOUT_PAY", opening: 0, accrued: 0, used: 0 },
    ];

    let balanceCount = 0;
    for (const user of users) {
      for (const leave of leaveTypes) {
        await prisma.balance.create({
          data: {
            userId: user.id,
            leaveType: leave.type,
            fiscalYear: 2025,
            opening: leave.opening,
            accrued: leave.accrued,
            used: leave.used,
            available:
              leave.opening + leave.accrued - leave.used,
            lastUpdated: new Date(),
            updatedBy: "system",
          },
        });
        balanceCount++;
      }
    }

    console.log(`✓ Created ${balanceCount} leave balances`);

    // ============================================
    // 4. CREATE SAMPLE LEAVE REQUESTS (Optional)
    // ============================================

    // Create one approved leave for each employee
    const sampleLeaves = await Promise.all([
      prisma.leaveRequest.create({
        data: {
          id: "leave-emp1-001",
          userId: "user-emp-001",
          leaveType: "CASUAL_LEAVE",
          startDate: new Date("2025-12-01"),
          endDate: new Date("2025-12-03"),
          reason: "Family vacation",
          dayCount: 3,
          status: "APPROVED",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          updatedAt: new Date(),
          submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          approvalChain: {
            step1: { approvedBy: "user-hradmin-001", approvedAt: new Date() },
            step2: { approvedBy: "user-depthead-001", approvedAt: new Date() },
            step3: { approvedBy: "user-hrhead-001", approvedAt: new Date() },
          },
        },
      }),

      prisma.leaveRequest.create({
        data: {
          id: "leave-emp2-001",
          userId: "user-emp-002",
          leaveType: "MEDICAL_LEAVE",
          startDate: new Date("2025-12-08"),
          endDate: new Date("2025-12-10"),
          reason: "Medical appointment and recovery",
          dayCount: 3,
          status: "PENDING",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          updatedAt: new Date(),
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          medicalCertificate: "cert-emp2-001.pdf",
          approvalChain: {
            step1: { approvedBy: "user-hradmin-001", approvedAt: new Date() },
            step2: null,
          },
        },
      }),

      prisma.leaveRequest.create({
        data: {
          id: "leave-emp3-001",
          userId: "user-emp-003",
          leaveType: "EARNED_LEAVE",
          startDate: new Date("2025-12-15"),
          endDate: new Date("2025-12-19"),
          reason: "Year-end vacation",
          dayCount: 5,
          status: "DRAFT",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    ]);

    console.log(`✓ Created ${sampleLeaves.length} sample leave requests`);

    // ============================================
    // 5. CREATE APPROVALS FOR PENDING LEAVES
    // ============================================

    await prisma.approval.create({
      data: {
        id: "approval-emp2-001",
        leaveRequestId: "leave-emp2-001",
        approverRole: "HR_ADMIN",
        approverUserId: "user-hradmin-001",
        status: "APPROVED",
        comments: "Approved for medical leave",
        approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    console.log("✓ Created sample approvals");

    // ============================================
    // 6. CREATE SAMPLE NOTIFICATIONS
    // ============================================

    await prisma.notification.create({
      data: {
        id: "notif-emp2-001",
        userId: "user-emp-002",
        type: "LEAVE_APPROVED",
        title: "Leave Approved",
        message: "Your medical leave from Dec 08-10 has been approved.",
        referenceId: "leave-emp2-001",
        referenceType: "LEAVE_REQUEST",
        isRead: false,
        createdAt: new Date(),
      },
    });

    console.log("✓ Created sample notifications");

    // ============================================
    // 7. CREATE AUDIT LOG ENTRIES
    // ============================================

    await prisma.auditLog.create({
      data: {
        id: "audit-001",
        userId: "user-emp-001",
        action: "CREATE_LEAVE_REQUEST",
        entityType: "LEAVE_REQUEST",
        entityId: "leave-emp1-001",
        changes: {
          created: {
            leaveType: "CASUAL_LEAVE",
            startDate: "2025-12-01",
            endDate: "2025-12-03",
          },
        },
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0...",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    console.log("✓ Created audit logs");

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nTest Users Created:");
    console.log("┌─────────────────────────────────────────┐");
    console.log("│ Email          │ Password     │ Role     │");
    console.log("├─────────────────────────────────────────┤");
    console.log("│ ceo@cdbl.com   │ Test@123456  │ CEO      │");
    console.log("│ hrhead@cdbl.com│ Test@123456  │ HR_HEAD  │");
    console.log("│ hradmin@cdbl.com│ Test@123456 │ HR_ADMIN │");
    console.log("│ depthead@cdbl.com│ Test@123456│ DEPT_HEAD│");
    console.log("│ employee1@cdbl.com│ Test@123456│EMPLOYEE │");
    console.log("│ employee2@cdbl.com│ Test@123456│EMPLOYEE │");
    console.log("│ employee3@cdbl.com│ Test@123456│EMPLOYEE │");
    console.log("└─────────────────────────────────────────┘");
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

### Add Seed Command to package.json

```json
{
  "scripts": {
    "seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset --force"
  }
}
```

**Run seed**:

```bash
npm run seed
```

---

## Reset Scripts

### Script 1: Full Database Reset

**File**: `scripts/reset-database.sh`

```bash
#!/bin/bash

echo "🔄 Resetting database..."

# Run Prisma reset
npx prisma migrate reset --force

if [ $? -eq 0 ]; then
    echo "✅ Database reset successfully"
    echo ""
    echo "📊 Summary:"
    echo "  • Database wiped"
    echo "  • All migrations applied"
    echo "  • Test data seeded"
    echo ""
    echo "👤 Test users available:"
    echo "  • ceo@cdbl.com"
    echo "  • hrhead@cdbl.com"
    echo "  • hradmin@cdbl.com"
    echo "  • depthead@cdbl.com"
    echo "  • employee1@cdbl.com"
    echo "  • employee2@cdbl.com"
    echo "  • employee3@cdbl.com"
    echo ""
    echo "🔑 Password for all: Test@123456"
else
    echo "❌ Database reset failed"
    exit 1
fi
```

**Usage**:

```bash
chmod +x scripts/reset-database.sh
./scripts/reset-database.sh
```

---

### Script 2: Soft Reset (Clear Data Only)

**File**: `scripts/soft-reset-database.sh`

```bash
#!/bin/bash

echo "🧹 Performing soft reset (keeping schema)..."

# Delete data from tables
npx prisma db execute --stdin << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE LeaveComment;
TRUNCATE TABLE Notification;
TRUNCATE TABLE Approval;
TRUNCATE TABLE LeaveRequest;
TRUNCATE TABLE LeaveVersion;
TRUNCATE TABLE Balance;
TRUNCATE TABLE Holiday;
TRUNCATE TABLE AuditLog;
TRUNCATE TABLE User;

SET FOREIGN_KEY_CHECKS = 1;
EOF

if [ $? -eq 0 ]; then
    echo "✓ Cleared all data"

    # Reseed
    echo "🌱 Reseeding test data..."
    npm run seed

    if [ $? -eq 0 ]; then
        echo "✅ Soft reset completed successfully"
    else
        echo "❌ Reseeding failed"
        exit 1
    fi
else
    echo "❌ Soft reset failed"
    exit 1
fi
```

**Usage**:

```bash
chmod +x scripts/soft-reset-database.sh
./scripts/soft-reset-database.sh
```

---

### Script 3: Clear User Data Only

**File**: `scripts/clear-user-data.sh`

```bash
#!/bin/bash

USER_ID=${1:-"user-emp-001"}

echo "🗑️  Clearing data for user: $USER_ID"

npx prisma db execute --stdin << EOF
-- Delete leave-related data for user
DELETE FROM LeaveComment
WHERE leaveRequestId IN (
  SELECT id FROM LeaveRequest WHERE userId = '$USER_ID'
);

DELETE FROM Approval
WHERE leaveRequestId IN (
  SELECT id FROM LeaveRequest WHERE userId = '$USER_ID'
);

DELETE FROM LeaveVersion
WHERE leaveRequestId IN (
  SELECT id FROM LeaveRequest WHERE userId = '$USER_ID'
);

DELETE FROM LeaveRequest WHERE userId = '$USER_ID';

-- Delete balance data
DELETE FROM Balance WHERE userId = '$USER_ID';

-- Delete notifications
DELETE FROM Notification WHERE userId = '$USER_ID';

-- Delete audit logs
DELETE FROM AuditLog WHERE userId = '$USER_ID';
EOF

if [ $? -eq 0 ]; then
    echo "✅ User data cleared successfully"
else
    echo "❌ Clear failed"
    exit 1
fi
```

**Usage**:

```bash
chmod +x scripts/clear-user-data.sh
./scripts/clear-user-data.sh user-emp-001
./scripts/clear-user-data.sh user-emp-002
```

---

## Data Verification

### Check Users

```bash
# Via Prisma CLI
npx prisma db execute --stdin << 'EOF'
SELECT id, email, name, role, department, isActive
FROM User
ORDER BY role;
EOF
```

**Expected output**: 7 users with different roles

### Check Balances

```bash
npx prisma db execute --stdin << 'EOF'
SELECT u.email, b.leaveType, b.opening, b.accrued, b.used, b.available
FROM Balance b
JOIN User u ON b.userId = u.id
WHERE u.email = 'employee1@cdbl.com'
ORDER BY b.leaveType;
EOF
```

**Expected**: 5 leave type balances for each user

### Check Holidays

```bash
npx prisma db execute --stdin << 'EOF'
SELECT DATE(date) as holiday_date, name, type
FROM Holiday
ORDER BY date;
EOF
```

**Expected**: 5 holidays for 2025

### Verify with Prisma Studio

```bash
# Visual database explorer
npx prisma studio
```

Opens: `http://localhost:5555`

---

## Troubleshooting

### Error: Database doesn't exist

**Solution**:

```bash
# Create database
mysql -u user -p -e "CREATE DATABASE cdbl_leave_test;"

# Then reset
npx prisma migrate reset --force
```

### Error: Foreign key constraint failed

**Solution**:

```bash
# Manually disable foreign keys before reset
npx prisma db execute --stdin << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;
SET FOREIGN_KEY_CHECKS = 1;
EOF

# Then try reset again
npx prisma migrate reset --force
```

### Error: Password authentication failed

**Solution**:

```bash
# Verify MySQL credentials
mysql -u user -p database_name -e "SELECT 1;"

# Update DATABASE_URL if needed
# Edit .env.local with correct credentials
```

### Seeding fails with duplicate key error

**Solution**:

```bash
# Delete all data first
npx prisma db execute --stdin << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE User;
TRUNCATE TABLE Balance;
TRUNCATE TABLE Holiday;
TRUNCATE TABLE LeaveRequest;
TRUNCATE TABLE Approval;
SET FOREIGN_KEY_CHECKS = 1;
EOF

# Then run seed again
npm run seed
```

### Prisma not finding types

**Solution**:

```bash
# Regenerate Prisma client
npx prisma generate

# Then try seed again
npm run seed
```

---

## Complete Testing Setup Checklist

- [ ] MySQL is running
- [ ] DATABASE_URL set in .env.local
- [ ] Node dependencies installed (`npm install`)
- [ ] Database created (`mysql -e "CREATE DATABASE..."`)
- [ ] Migrations applied (`npx prisma migrate deploy`)
- [ ] Test data seeded (`npm run seed`)
- [ ] 7 test users created
- [ ] 5 holidays loaded
- [ ] All users have balance entries
- [ ] Sample leave requests created
- [ ] Application starts (`npm run dev`)
- [ ] Dashboard accessible (`http://localhost:3000`)
- [ ] Auth bypass enabled in .env.local

---

## Next Steps

1. Reset database: `npx prisma migrate reset --force`
2. Verify data: `npx prisma studio`
3. Start server: `npm run dev`
4. Enable auth bypass: Update `.env.local`
5. Begin testing: Follow `QA_TESTING_GUIDE.md`

---

**Document Version**: 1.0
**Last Updated**: November 14, 2025
**Status**: Ready for Implementation
