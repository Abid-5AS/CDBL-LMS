/**
 * Extract Non-Employee Emails
 * 
 * This script extracts all user emails except those with EMPLOYEE role
 * and saves them to a file.
 */

import { prisma } from "../lib/prisma";
import { writeFileSync } from "fs";
import { join } from "path";

const OUTPUT_FILE = join(process.cwd(), "non-employee-emails.txt");

async function extractNonEmployeeEmails() {
  console.log("[Extract Non-Employee Emails] Starting extraction...");

  // Get all users except employees
  const nonEmployees = await prisma.user.findMany({
    where: {
      role: {
        not: "EMPLOYEE",
      },
    },
    select: {
      email: true,
      name: true,
      role: true,
    },
    orderBy: [
      { role: "asc" },
      { email: "asc" },
    ],
  });

  console.log(`[Extract Non-Employee Emails] Found ${nonEmployees.length} non-employee users`);

  // Format emails with role and name for better readability
  const lines: string[] = [];
  lines.push(`# Non-Employee Users Email List`);
  lines.push(`# Generated on: ${new Date().toISOString()}`);
  lines.push(`# Total users: ${nonEmployees.length}`);
  lines.push("");
  lines.push(`# Format: email | name | role`);
  lines.push("");

  // Group by role for better organization
  const byRole: Record<string, typeof nonEmployees> = {};
  for (const user of nonEmployees) {
    if (!byRole[user.role]) {
      byRole[user.role] = [];
    }
    byRole[user.role].push(user);
  }

  // Write grouped by role
  for (const [role, users] of Object.entries(byRole).sort()) {
    lines.push(`## ${role} (${users.length})`);
    for (const user of users) {
      lines.push(`${user.email} | ${user.name} | ${user.role}`);
    }
    lines.push("");
  }

  // Also create a simple email-only list
  const emailOnlyLines: string[] = [];
  emailOnlyLines.push(`# Non-Employee Emails Only`);
  emailOnlyLines.push(`# Generated on: ${new Date().toISOString()}`);
  emailOnlyLines.push(`# Total: ${nonEmployees.length}`);
  emailOnlyLines.push("");
  for (const user of nonEmployees) {
    emailOnlyLines.push(user.email);
  }

  // Write to file
  const content = lines.join("\n");
  writeFileSync(OUTPUT_FILE, content, "utf-8");

  // Also write email-only version
  const emailOnlyFile = join(process.cwd(), "non-employee-emails-only.txt");
  const emailOnlyContent = emailOnlyLines.join("\n");
  writeFileSync(emailOnlyFile, emailOnlyContent, "utf-8");

  console.log(`[Extract Non-Employee Emails] Written to: ${OUTPUT_FILE}`);
  console.log(`[Extract Non-Employee Emails] Email-only list: ${emailOnlyFile}`);

  // Print summary
  console.log("\n[Summary by Role]");
  for (const [role, users] of Object.entries(byRole).sort()) {
    console.log(`  ${role}: ${users.length} users`);
  }

  return {
    total: nonEmployees.length,
    byRole,
    outputFile: OUTPUT_FILE,
    emailOnlyFile,
  };
}

// CLI entry point
if (require.main === module) {
  extractNonEmployeeEmails()
    .then((result) => {
      console.log("\n[Extract Non-Employee Emails] ✅ Completed successfully");
      console.log(`Total non-employee users: ${result.total}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("[Extract Non-Employee Emails] ❌ Error:", error);
      process.exit(1);
    });
}

export { extractNonEmployeeEmails };

