import { prisma } from "../lib/prisma";
import { LeaveType, Role, LeaveStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { initDefaultOrgSettings } from "../lib/org-settings";
import { countWorkingDaysSync } from "../lib/working-days";
import { normalizeToDhakaMidnight } from "../lib/date-utils";
import { getChainFor } from "../lib/workflow";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";

const YEAR = new Date().getFullYear();
const SEED_RESET = process.env.SEED_RESET === "true";

// Deterministic random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

const rng = new SeededRandom(12345);

// Departments
const DEPARTMENTS = ["IT", "HR", "Finance", "Operations"];

// First names and last names for realistic names
const FIRST_NAMES = [
  "Ahmed",
  "Fatima",
  "Hasan",
  "Ayesha",
  "Rahman",
  "Khan",
  "Ali",
  "Begum",
  "Ibrahim",
  "Sultana",
  "Mahmud",
  "Noor",
  "Karim",
  "Jahan",
  "Hossain",
  "Chowdhury",
  "Islam",
  "Akter",
  "Uddin",
  "Parvin",
  "Miah",
  "Khatun",
  "Rashid",
  "Haque",
  "Alam",
  "Siddique",
  "Mallik",
  "Bhuiyan",
];

const LAST_NAMES = [
  "Rahman",
  "Hossain",
  "Khan",
  "Ahmed",
  "Ali",
  "Islam",
  "Chowdhury",
  "Hasan",
  "Karim",
  "Uddin",
  "Miah",
  "Haque",
  "Alam",
  "Siddique",
  "Mallik",
  "Bhuiyan",
  "Begum",
  "Khatun",
  "Sultana",
  "Jahan",
];

function generateName(): string {
  const firstName = rng.pick(FIRST_NAMES);
  const lastName = rng.pick(LAST_NAMES);
  return `${firstName} ${lastName}`;
}

function generateEmail(
  name: string,
  role: Role,
  dept: string,
  index: number
): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, ".");
  if (role === Role.SYSTEM_ADMIN) return "sysadmin@cdbl.local";
  if (role === Role.CEO) return "ceo@cdbl.local";
  if (role === Role.HR_HEAD) return "hrhead@cdbl.local";
  if (role === Role.HR_ADMIN) return `hradmin${index}@cdbl.local`;
  if (role === Role.DEPT_HEAD)
    return `depthead.${dept.toLowerCase()}@cdbl.local`;
  return `${cleanName}${index}@cdbl.local`;
}

function generateEmpCode(role: Role, dept: string, index: number): string {
  if (role === Role.SYSTEM_ADMIN) return "SA001";
  if (role === Role.CEO) return "CEO001";
  if (role === Role.HR_HEAD) return "HRH001";
  if (role === Role.HR_ADMIN) return `HRA${String(index).padStart(2, "0")}`;
  if (role === Role.DEPT_HEAD) {
    const deptCode = dept.substring(0, 2).toUpperCase();
    return `${deptCode}H001`;
  }
  const deptCode = dept.substring(0, 2).toUpperCase();
  return `${deptCode}${String(index).padStart(3, "0")}`;
}

async function resetDatabase() {
  if (!SEED_RESET) return;

  console.log("🗑️  Resetting core tables...");
  await prisma.auditLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.balance.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Tables reset complete");
}

async function createUsers() {
  const users: Array<{
    id: number;
    role: Role;
    department: string;
    email: string;
  }> = [];
  const password = await bcrypt.hash("demo123", 10);

  // 1. SYSTEM_ADMIN
  const sysAdminEmpCode = "SA001";
  // Handle empCode conflict by updating conflicting user's empCode
  const existingSysAdminEmpCode = await prisma.user.findFirst({ where: { empCode: sysAdminEmpCode, email: { not: "sysadmin@cdbl.local" } } });
  if (existingSysAdminEmpCode) {
    await prisma.user.update({ where: { id: existingSysAdminEmpCode.id }, data: { empCode: `SA001_OLD_${Date.now()}` } });
  }
  
  const sysAdmin = await prisma.user.upsert({
    where: { email: "sysadmin@cdbl.local" },
    update: { role: Role.SYSTEM_ADMIN, department: "IT", empCode: sysAdminEmpCode },
    create: {
      name: "System Administrator",
      email: "sysadmin@cdbl.local",
      role: Role.SYSTEM_ADMIN,
      empCode: sysAdminEmpCode,
      department: "IT",
      password,
    },
  });
  users.push({
    id: sysAdmin.id,
    role: Role.SYSTEM_ADMIN,
    department: "IT",
    email: sysAdmin.email,
  });

  // 2. CEO
  const ceoEmpCode = "CEO001";
  // Handle empCode conflict by updating conflicting user's empCode
  const existingCeoEmpCode = await prisma.user.findFirst({ where: { empCode: ceoEmpCode, email: { not: "ceo@cdbl.local" } } });
  if (existingCeoEmpCode) {
    await prisma.user.update({ where: { id: existingCeoEmpCode.id }, data: { empCode: `CEO001_OLD_${Date.now()}` } });
  }
  
  const ceo = await prisma.user.upsert({
    where: { email: "ceo@cdbl.local" },
    update: { role: Role.CEO, department: "Executive", empCode: ceoEmpCode },
    create: {
      name: "Chief Executive Officer",
      email: "ceo@cdbl.local",
      role: Role.CEO,
      empCode: ceoEmpCode,
      department: "Executive",
      password,
    },
  });
  users.push({
    id: ceo.id,
    role: Role.CEO,
    department: "Executive",
    email: ceo.email,
  });

  // 3. HR_HEAD
  const hrHeadEmpCode = "HRH001";
  // Handle empCode conflict by updating conflicting user's empCode
  const existingHrHeadEmpCode = await prisma.user.findFirst({ where: { empCode: hrHeadEmpCode, email: { not: "hrhead@cdbl.local" } } });
  if (existingHrHeadEmpCode) {
    await prisma.user.update({ where: { id: existingHrHeadEmpCode.id }, data: { empCode: `HRH001_OLD_${Date.now()}` } });
  }
  
  const hrHead = await prisma.user.upsert({
    where: { email: "hrhead@cdbl.local" },
    update: { role: Role.HR_HEAD, department: "HR", empCode: hrHeadEmpCode },
    create: {
      name: "HR Head",
      email: "hrhead@cdbl.local",
      role: Role.HR_HEAD,
      empCode: hrHeadEmpCode,
      department: "HR",
      password,
    },
  });
  users.push({
    id: hrHead.id,
    role: Role.HR_HEAD,
    department: "HR",
    email: hrHead.email,
  });

  // 4. HR_ADMIN (1)
  const hrAdminName = "HR Admin";
  const hrAdminEmail = "hradmin1@cdbl.local";
  const hrAdminEmpCode = generateEmpCode(Role.HR_ADMIN, "HR", 1);
  // Handle empCode conflict by updating conflicting user's empCode
  const existingHrAdminEmpCode = await prisma.user.findFirst({ where: { empCode: hrAdminEmpCode, email: { not: hrAdminEmail } } });
  if (existingHrAdminEmpCode) {
    await prisma.user.update({ where: { id: existingHrAdminEmpCode.id }, data: { empCode: `${hrAdminEmpCode}_OLD_${Date.now()}` } });
  }
  
  const hrAdmin = await prisma.user.upsert({
    where: { email: hrAdminEmail },
    update: { role: Role.HR_ADMIN, department: "HR", empCode: hrAdminEmpCode },
    create: {
      name: hrAdminName,
      email: hrAdminEmail,
      role: Role.HR_ADMIN,
      empCode: hrAdminEmpCode,
      department: "HR",
      password,
    },
  });
  users.push({
    id: hrAdmin.id,
    role: Role.HR_ADMIN,
    department: "HR",
    email: hrAdmin.email,
  });

  // 5. DEPT_HEAD (3 total - IT, HR, Finance)
  const deptHeads: Array<{ id: number; department: string; email: string }> =
    [];
  const selectedDepts = ["IT", "HR", "Finance"]; // Select 3 departments
  for (const dept of selectedDepts) {
    const name = `Head of ${dept}`;
    const email = `depthead.${dept.toLowerCase()}@cdbl.local`;
    const empCode = generateEmpCode(Role.DEPT_HEAD, dept, 1);

    // Handle empCode conflict by updating conflicting user's empCode
    const existingEmpCode = await prisma.user.findFirst({ where: { empCode, email: { not: email } } });
    if (existingEmpCode) {
      await prisma.user.update({ where: { id: existingEmpCode.id }, data: { empCode: `${empCode}_OLD_${Date.now()}` } });
    }

    const deptHead = await prisma.user.upsert({
      where: { email },
      update: { role: Role.DEPT_HEAD, department: dept, empCode },
      create: {
        name,
        email,
        role: Role.DEPT_HEAD,
        empCode,
        department: dept,
        password,
      },
    });
    users.push({
      id: deptHead.id,
      role: Role.DEPT_HEAD,
      department: dept,
      email: deptHead.email,
    });
    deptHeads.push({
      id: deptHead.id,
      department: dept,
      email: deptHead.email,
    });
  }

  // 6. EMPLOYEE (12 total - 4 per department for IT, HR, Finance)
  const employeeDepts = ["IT", "HR", "Finance"]; // Match selected departments
  for (const dept of employeeDepts) {
    const deptHeadId = deptHeads.find((dh) => dh.department === dept)?.id;
    if (!deptHeadId) continue;

    const employeesPerDept = 4; // 4 per department = 12 total
    for (let i = 1; i <= employeesPerDept; i++) {
      const name = generateName();
      const email = generateEmail(name, Role.EMPLOYEE, dept, i);
      const empCode = generateEmpCode(Role.EMPLOYEE, dept, i);

      // Handle empCode conflict by updating conflicting user's empCode
      const existingEmpCode = await prisma.user.findFirst({ where: { empCode, email: { not: email } } });
      if (existingEmpCode) {
        await prisma.user.update({ where: { id: existingEmpCode.id }, data: { empCode: `${empCode}_OLD_${Date.now()}` } });
      }

      const employee = await prisma.user.upsert({
        where: { email },
        update: {
          role: Role.EMPLOYEE,
          department: dept,
          deptHeadId,
          empCode,
        },
    create: {
          name,
          email,
          role: Role.EMPLOYEE,
          empCode,
          department: dept,
          deptHeadId,
          password,
        },
      });
      users.push({
        id: employee.id,
        role: Role.EMPLOYEE,
        department: dept,
        email: employee.email,
      });
    }
  }

  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function createBalances(users: Array<{ id: number; role: Role }>) {
  const employees = users.filter((u) => u.role === Role.EMPLOYEE);
  const balances: Array<{ userId: number; type: LeaveType; used: number }> = [];

  for (const user of employees) {
    // Match requirements: Earned Leave 23/24, Casual Leave 4/10, Medical Leave 10/14
    // This means: Earned Used=1, Casual Used=6, Medical Used=4
    // But vary slightly for realism
    const earnedUsed = rng.nextInt(1, 2); // 1-2 used, leaving 23-22 remaining
    const casualUsed = rng.nextInt(4, 6); // 4-6 used, leaving 6-4 remaining
    const medicalUsed = rng.nextInt(4, 6); // 4-6 used, leaving 10-8 remaining

    for (const type of [
      LeaveType.EARNED,
      LeaveType.CASUAL,
      LeaveType.MEDICAL,
    ] as LeaveType[]) {
      const used =
        type === LeaveType.EARNED
          ? earnedUsed
          : type === LeaveType.CASUAL
          ? casualUsed
          : medicalUsed;
      const accrued =
        type === LeaveType.EARNED ? 24 : type === LeaveType.CASUAL ? 10 : 14;
      const closing = Math.max(accrued - used, 0);

      await prisma.balance.upsert({
        where: { userId_type_year: { userId: user.id, type, year: YEAR } },
        update: { used, closing },
        create: {
          userId: user.id,
          type,
          year: YEAR,
          opening: 0,
          accrued,
          used,
          closing,
      },
    });

      balances.push({ userId: user.id, type, used });
    }
  }

  // Also create balances for non-employees
  for (const user of users.filter((u) => u.role !== Role.EMPLOYEE)) {
    for (const type of [
      LeaveType.EARNED,
      LeaveType.CASUAL,
      LeaveType.MEDICAL,
    ] as LeaveType[]) {
      const accrued =
        type === LeaveType.EARNED ? 24 : type === LeaveType.CASUAL ? 10 : 14;
      await prisma.balance.upsert({
        where: { userId_type_year: { userId: user.id, type, year: YEAR } },
        update: {},
    create: {
          userId: user.id,
          type,
          year: YEAR,
          opening: 0,
          accrued,
          used: 0,
          closing: accrued,
        },
      });
    }
  }

  console.log(`✅ Created balances for ${users.length} users`);
  return balances;
}

async function createHolidays() {
  const holidays = [
    { date: `${YEAR}-01-01T00:00:00.000Z`, name: "New Year's Day" },
    {
      date: `${YEAR}-02-21T00:00:00.000Z`,
      name: "Shaheed Day and International Mother Language Day",
    },
    {
      date: `${YEAR}-03-26T00:00:00.000Z`,
      name: "Independence & National day",
    },
    { date: `${YEAR}-03-29T00:00:00.000Z`, name: "Eid-ul-Fitr" },
    { date: `${YEAR}-03-30T00:00:00.000Z`, name: "Eid-ul-Fitr" },
    { date: `${YEAR}-03-31T00:00:00.000Z`, name: "Eid-ul-Fitr" },
    { date: `${YEAR}-04-01T00:00:00.000Z`, name: "Eid-ul-Fitr" },
    { date: `${YEAR}-04-14T00:00:00.000Z`, name: "Bengali New Year's day" },
    { date: `${YEAR}-05-01T00:00:00.000Z`, name: "May Day" },
    { date: `${YEAR}-06-05T00:00:00.000Z`, name: "Eid-ul-Azha" },
    { date: `${YEAR}-06-06T00:00:00.000Z`, name: "Eid-ul-Azha" },
    { date: `${YEAR}-06-07T00:00:00.000Z`, name: "Eid-ul-Azha" },
    {
      date: `${YEAR}-07-01T00:00:00.000Z`,
      name: "Trading Holiday (Bank Holiday)",
    },
    { date: `${YEAR}-08-15T00:00:00.000Z`, name: "National Mourning Day" },
    { date: `${YEAR}-12-16T00:00:00.000Z`, name: "Victory Day" },
  ];

  // Add next year holidays
  const nextYear = YEAR + 1;
  holidays.push(
    { date: `${nextYear}-01-01T00:00:00.000Z`, name: "New Year's Day" },
    {
      date: `${nextYear}-02-21T00:00:00.000Z`,
      name: "Shaheed Day and International Mother Language Day",
    },
    {
      date: `${nextYear}-03-26T00:00:00.000Z`,
      name: "Independence & National day",
    }
  );

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { date: new Date(holiday.date) },
      update: { name: holiday.name },
    create: {
        date: new Date(holiday.date),
        name: holiday.name,
        isOptional: false,
      },
    });
  }

  console.log(`✅ Created ${holidays.length} holidays`);
  return holidays.map((h) => ({
    date: normalizeToDhakaMidnight(new Date(h.date)).toISOString().slice(0, 10),
    name: h.name,
  }));
}

function getNextWorkingDay(
  date: Date,
  holidays: Array<{ date: string }>
): Date {
  let next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (
    next.getDay() >= 5 ||
    holidays.some(
      (h) =>
        h.date === normalizeToDhakaMidnight(next).toISOString().slice(0, 10)
    )
  ) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

async function createCertificateFile(leaveId: number): Promise<string> {
  const uploadDir = path.join(process.cwd(), "private", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const filename = `medical-cert-${leaveId}-${randomUUID()}.pdf`;
  const filePath = path.join(uploadDir, filename);

  // Create a minimal PDF placeholder (PDF header + minimal content)
  const pdfContent = Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
178
%%EOF`
  );

  await fs.writeFile(filePath, pdfContent);
  return filename;
}

async function createLeaveRequests(
  users: Array<{ id: number; role: Role; department: string; email: string }>,
  holidays: Array<{ date: string; name: string }>
) {
  const employees = users.filter((u) => u.role === Role.EMPLOYEE);
  const hrAdmins = users.filter((u) => u.role === Role.HR_ADMIN);
  const deptHeads = users.filter((u) => u.role === Role.DEPT_HEAD);
  const hrHead = users.find((u) => u.role === Role.HR_HEAD);
  const ceo = users.find((u) => u.role === Role.CEO);

  if (!hrAdmins.length || !deptHeads.length || !hrHead || !ceo) {
    console.warn("⚠️  Missing approvers, skipping leave requests");
    return;
  }

  const today = normalizeToDhakaMidnight(new Date());
  const next90Days = new Date(today);
  next90Days.setDate(next90Days.getDate() + 90);

  let leaveId = 1;
  let approvalId = 1;
  const leaveRequests: Array<{
    id: number;
    requesterId: number;
    status: LeaveStatus;
    type: LeaveType;
  }> = [];

  for (const employee of employees) {
    const deptHead = deptHeads.find(
      (dh) => dh.department === employee.department
    );
    if (!deptHead) continue;

    const hrAdmin = hrAdmins[0]; // Use first HR admin
    const approvers = [hrAdmin, deptHead, hrHead, ceo];

    // Create 6-10 leave requests per employee
    const numRequests = rng.nextInt(6, 10);

    for (let i = 0; i < numRequests; i++) {
      const leaveType = rng.pick([
        LeaveType.EARNED,
        LeaveType.CASUAL,
        LeaveType.MEDICAL,
      ]);
      let status: LeaveStatus;
      let startDate: Date;
      let endDate: Date;
      let workingDays: number;
      let needsCertificate = false;
      let certificateUrl: string | null = null;
      let fitnessCertificateUrl: string | null = null;

      // Determine status distribution: APPROVED (60%), PENDING (20%), REJECTED (10%), RETURNED (10%)
      const statusRoll = rng.next();
      if (statusRoll < 0.6) {
        status = "APPROVED";
      } else if (statusRoll < 0.8) {
        status = "PENDING";
      } else if (statusRoll < 0.9) {
        status = "REJECTED";
      } else if (statusRoll < 0.95) {
        status = "RETURNED";
      } else if (statusRoll < 0.97) {
        status = "CANCELLATION_REQUESTED";
      } else if (statusRoll < 0.99) {
        status = "OVERSTAY_PENDING";
      } else {
        status = "CANCELLED";
      }

      // Generate dates - distribute across past 6 months and upcoming 1 month
      if (
        status === "APPROVED" ||
        status === "PENDING" ||
        status === "SUBMITTED"
      ) {
        // Future dates (upcoming 1 month) - create some overlaps within departments
        const daysFromNow = rng.nextInt(1, 30); // Upcoming month
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() + daysFromNow);
        startDate = getNextWorkingDay(startDate, holidays);

        const duration =
          leaveType === LeaveType.EARNED
            ? rng.nextInt(3, 10)
            : leaveType === LeaveType.CASUAL
            ? rng.nextInt(1, 3)
            : rng.nextInt(1, 8);
        endDate = new Date(startDate);
        for (let j = 1; j < duration; j++) {
          endDate = getNextWorkingDay(endDate, holidays);
        }
      } else {
        // Past dates (past 6 months = ~180 days) for other statuses
        const daysAgo = rng.nextInt(1, 180); // Past 6 months
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() - daysAgo);
        const duration = rng.nextInt(1, 5);
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - duration);
      }

      startDate = normalizeToDhakaMidnight(startDate);
      endDate = normalizeToDhakaMidnight(endDate);
      workingDays = countWorkingDaysSync(startDate, endDate, holidays);

      // Medical leave certificate requirements
      if (leaveType === LeaveType.MEDICAL) {
        if (workingDays > 3) {
          needsCertificate = true;
          if (status === "APPROVED") {
            const certFile = await createCertificateFile(leaveId);
            certificateUrl = certFile;
          }
        }
        if (workingDays > 7 && status === "APPROVED") {
          // ML > 7 days requires fitness certificate on return
          // For seed data, we'll leave this null for some to test the requirement
          if (rng.next() > 0.5) {
            const fitnessCertFile = await createCertificateFile(leaveId);
            fitnessCertificateUrl = fitnessCertFile;
          }
        }
      }

      // Generate realistic reason
      const reasons: Record<LeaveType, string[]> = {
        EARNED: [
          "Family vacation and personal time",
          "Family wedding celebration",
          "Personal errands and rest",
          "Family gathering and reunion",
        ],
        CASUAL: [
          "Personal errands and appointments",
          "Family commitments",
          "Urgent personal work",
          "Short personal break",
        ],
        MEDICAL: [
          "Medical consultation and treatment",
          "Health check-up and follow-up",
          "Medical treatment and recovery",
          "Doctor's appointment and medication",
        ],
        MATERNITY: ["Maternity leave for childbirth"],
        PATERNITY: ["Paternity leave for newborn"],
        STUDY: ["Study leave for professional development"],
        SPECIAL_DISABILITY: ["Special disability leave"],
        QUARANTINE: ["Quarantine period as per medical advice"],
        EXTRAWITHPAY: ["Extra leave with pay as approved"],
        EXTRAWITHOUTPAY: ["Extra leave without pay"],
      };
      const reasonOptions = reasons[leaveType] || [`Leave request for ${leaveType.toLowerCase()} leave`];
      const reason = rng.pick(reasonOptions);

      // Create leave request
      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: leaveType,
          startDate,
          endDate,
          workingDays,
          reason,
          status,
          policyVersion: "v2.0",
          needsCertificate,
          certificateUrl,
          fitnessCertificateUrl,
        },
      });

      leaveRequests.push({
        id: leave.id,
        requesterId: employee.id,
        status,
        type: leaveType,
      });

      // Create approval chain for APPROVED, PENDING, REJECTED, RETURNED
      if (["APPROVED", "PENDING", "REJECTED", "RETURNED"].includes(status)) {
        const chain = getChainFor(leaveType);
        const chainApprovers = chain
          .map((role) => approvers.find((a) => a.role === role))
          .filter(Boolean) as Array<{ id: number; role: Role; email: string }>;

        if (chainApprovers.length > 0) {
          const finalDecision =
            status === "APPROVED"
              ? "APPROVED"
              : status === "REJECTED"
              ? "REJECTED"
              : "PENDING";
          const daysAgo = rng.nextInt(1, 30);

          for (let step = 0; step < chainApprovers.length; step++) {
            const approver = chainApprovers[step];
            const isLast = step === chainApprovers.length - 1;
            // For PENDING status: only create approvals up to the current pending step
            // If finalDecision is PENDING, stop before the last step (leave it pending for the last approver)
            const shouldStopAtThisStep = finalDecision === "PENDING" && isLast;
            if (shouldStopAtThisStep) {
              break; // Don't create approval for the pending step - it's waiting for approval
            }
            
            const decision = isLast
              ? finalDecision === "APPROVED"
                ? "APPROVED"
                : finalDecision === "REJECTED"
                ? "REJECTED"
                : "FORWARDED" // This shouldn't be reached due to break above
              : "FORWARDED";

            await prisma.approval.create({
              data: {
                leaveId: leave.id,
                step: step + 1,
                approverId: approver.id,
                decision: decision as any,
                toRole: isLast ? null : chainApprovers[step + 1]?.role || null,
                comment: isLast
                  ? `${finalDecision} by ${approver.role}`
                  : `Forwarded to ${chainApprovers[step + 1]?.role || "next"}`,
                decidedAt:
                  isLast && finalDecision !== "PENDING"
                    ? new Date(
                        Date.now() - (daysAgo - step * 2) * 24 * 60 * 60 * 1000
                      )
                    : null,
        },
      });

            await prisma.auditLog.create({
          data: {
                actorEmail: approver.email,
                action: isLast ? `LEAVE_${finalDecision}` : "LEAVE_FORWARD",
                targetEmail: employee.email,
                details: {
                  leaveId: leave.id,
                  actorRole: approver.role,
                  toRole: isLast
                    ? null
                    : chainApprovers[step + 1]?.role || null,
                  step: step + 1,
                },
                createdAt:
                  isLast && finalDecision !== "PENDING"
                    ? new Date(
                        Date.now() - (daysAgo - step * 2) * 24 * 60 * 60 * 1000
                      )
                    : new Date(),
          },
        });
      }
    }
  }

      leaveId++;
    }
  }

  console.log(`✅ Created ${leaveRequests.length} leave requests`);
  return leaveRequests;
}

/**
 * Create specific pending requests for IT department head
 * These requests should have HR_ADMIN forwarding to DEPT_HEAD
 */
async function createPendingRequestsForITDeptHead(
  itEmployees: Array<{ id: number; email: string; name: string }>,
  itDeptHead: { id: number; role: Role; email: string },
  hrAdmin: { id: number; role: Role; email: string },
  holidays: Array<{ date: Date }>
): Promise<void> {
  if (!itEmployees.length || !itDeptHead || !hrAdmin) {
    console.warn("⚠️  Missing IT employees or dept head, skipping pending requests");
    return;
  }

  const today = normalizeToDhakaMidnight(new Date());
  const rng = new SeededRandom(42);

  // Create 2-3 pending requests specifically for IT dept head
  const numPending = Math.min(3, itEmployees.length);
  const selectedEmployees = itEmployees.slice(0, numPending);

  for (const employee of selectedEmployees) {
    // Use EARNED or MEDICAL (not CASUAL as it has different chain)
    const leaveType = rng.pick([LeaveType.EARNED, LeaveType.MEDICAL]);
    const chain = getChainFor(leaveType);

    // Generate future dates (upcoming 2-3 weeks)
    const daysFromNow = rng.nextInt(14, 21);
    let startDate = new Date(today);
    startDate.setDate(startDate.getDate() + daysFromNow);
    startDate = getNextWorkingDay(startDate, holidays);

    const duration = leaveType === LeaveType.EARNED ? rng.nextInt(3, 7) : rng.nextInt(2, 5);
    let endDate = new Date(startDate);
    for (let j = 1; j < duration; j++) {
      endDate = getNextWorkingDay(endDate, holidays);
    }

    startDate = normalizeToDhakaMidnight(startDate);
    endDate = normalizeToDhakaMidnight(endDate);
    const workingDays = countWorkingDaysSync(startDate, endDate, holidays);

    const reasons: Record<LeaveType, string[]> = {
      EARNED: [
        "Family vacation and personal time",
        "Family wedding celebration",
        "Personal errands and rest",
      ],
      MEDICAL: [
        "Medical consultation and treatment",
        "Health check-up and follow-up",
        "Medical treatment and recovery",
      ],
      CASUAL: [],
      MATERNITY: [],
      PATERNITY: [],
      STUDY: [],
      SPECIAL_DISABILITY: [],
      QUARANTINE: [],
      EXTRAWITHPAY: [],
      EXTRAWITHOUTPAY: [],
    };

    const reasonOptions = reasons[leaveType] || [`Leave request for ${leaveType.toLowerCase()} leave`];
    const reason = rng.pick(reasonOptions);

    // Create leave request with PENDING status
    const leave = await prisma.leaveRequest.create({
      data: {
        requesterId: employee.id,
        type: leaveType,
        startDate,
        endDate,
        workingDays,
        reason,
        status: "PENDING",
        policyVersion: "v2.0",
        needsCertificate: leaveType === LeaveType.MEDICAL && workingDays > 3,
        certificateUrl: null,
        fitnessCertificateUrl: null,
      },
    });

    // Create approval chain: HR_ADMIN forwards to DEPT_HEAD
    // Step 1: HR_ADMIN forwards to DEPT_HEAD
    await prisma.approval.create({
      data: {
        leaveId: leave.id,
        step: 1,
        approverId: hrAdmin.id,
        decision: "FORWARDED",
        toRole: "DEPT_HEAD",
        comment: "Forwarded to Department Head for approval",
        decidedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    });

    // Step 2: DEPT_HEAD approval is NOT created - it's pending
    // This is what makes it show up in DEPT_HEAD's pending queue

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorEmail: hrAdmin.email,
        action: "LEAVE_FORWARD",
        targetEmail: employee.email,
        details: {
          leaveId: leave.id,
          actorRole: hrAdmin.role,
          toRole: "DEPT_HEAD",
          step: 1,
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`   ✅ Created pending ${leaveType} request for ${employee.name} (ID: ${leave.id})`);
  }

  console.log(`✅ Created ${numPending} pending requests for IT Department Head`);
}

async function main() {
  console.log("🌱 Starting seed process...");

  await resetDatabase();

  // Initialize org settings
  try {
    await initDefaultOrgSettings();
    console.log("✅ Initialized orgSettings");
  } catch (error) {
    console.warn("⚠️  Could not initialize orgSettings:", error);
  }

  // Create users
  const users = await createUsers();

  // Re-fetch users to ensure valid IDs
  const allUsers = await prisma.user.findMany({
    select: { id: true, role: true, email: true },
  });
  const usersWithRoles = allUsers.map((u) => ({
    id: u.id,
    role: u.role as Role,
    email: u.email,
  }));

  // Create balances
  await createBalances(usersWithRoles);

  // Create holidays
  const holidays = await createHolidays();

  // Create leave requests
  await createLeaveRequests(usersWithRoles, holidays);

  // Create specific pending requests for IT department head
  const allUsersWithDept = await prisma.user.findMany({
    select: { id: true, role: true, email: true, department: true },
  });
  
  const itDeptHeadFull = allUsersWithDept.find(
    (u) => u.role === Role.DEPT_HEAD && u.department === "IT"
  );
  const itEmployeesFull = allUsersWithDept.filter(
    (u) => u.role === Role.EMPLOYEE && u.department === "IT"
  );
  const hrAdminFull = allUsersWithDept.find((u) => u.role === Role.HR_ADMIN);

  if (itDeptHeadFull && itEmployeesFull.length > 0 && hrAdminFull) {
    await createPendingRequestsForITDeptHead(
      itEmployeesFull.map((e) => {
        // Get name from user record if available, otherwise use email prefix
        const userRecord = allUsers.find((au) => au.id === e.id);
        return { id: e.id, email: e.email, name: userRecord?.name || e.email.split("@")[0] };
      }),
      { id: itDeptHeadFull.id, role: itDeptHeadFull.role as Role, email: itDeptHeadFull.email },
      { id: hrAdminFull.id, role: hrAdminFull.role as Role, email: hrAdminFull.email },
      holidays.map((h) => ({ date: new Date(h.date) }))
    );
  } else {
    console.warn("⚠️  Could not find IT dept head or employees for pending requests");
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("📋 All passwords: demo123");
  console.log(`\n👥 Users created: ${users.length}`);
  console.log("   - 1 SYSTEM_ADMIN (sysadmin@cdbl.local)");
  console.log("   - 1 CEO (ceo@cdbl.local)");
  console.log("   - 1 HR_HEAD (hrhead@cdbl.local)");
  console.log("   - 1 HR_ADMIN (hradmin1@cdbl.local)");
  console.log("   - 3 DEPT_HEAD (IT, HR, Finance)");
  console.log("   - 12 EMPLOYEE (4 per department)");
}

if (require.main === module) {
  main()
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
