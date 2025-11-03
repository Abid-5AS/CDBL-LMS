/**
 * QA Automation Script: Role-Aware Dock Verification
 * 
 * Tests the FloatingDock component against the canonical matrix in lib/role-ui.ts
 * Uses browser automation to verify dock actions for each role/page combination.
 */

import { DOCK_MATRIX, routeToPage, type Role, type Page, type Action } from "../lib/role-ui";
import fs from "fs";
import path from "path";

// Test credentials from DEMO-RUN-SHEET.md
const TEST_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  EMPLOYEE: { email: "employee1@demo.local", password: "demo123" },
  DEPT_HEAD: { email: "manager@demo.local", password: "demo123" },
  HR_ADMIN: { email: "hradmin@demo.local", password: "demo123" },
  HR_HEAD: { email: "hrhead@demo.local", password: "demo123" },
  CEO: { email: "ceo@demo.local", password: "demo123" },
};

const ROUTES_TO_TEST = [
  "/dashboard",
  "/leaves",
  "/leaves/apply",
  "/approvals",
  "/employees",
  "/reports",
  "/policies",
  "/admin/audit",
];

const ARTIFACTS_DIR = path.join(process.cwd(), "qa", "artifacts");
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, "screenshots");

interface TestResult {
  role: Role;
  route: string;
  page: Page | undefined;
  expectedActions: Action[];
  foundActions: string[];
  status: "match" | "mismatch" | "missing_dock" | "unknown_page";
  warnings: string[];
}

const results: TestResult[] = [];

/**
 * Map action labels from UI to canonical Action types
 */
function normalizeActionLabel(label: string): Action | null {
  const mapping: Record<string, Action> = {
    "Apply Leave": "APPLY_LEAVE",
    "My Requests": "MY_REQUESTS",
    "Leave Requests": "MY_REQUESTS",
    "Dashboard": "DASHBOARD",
    "Go to Dashboard": "DASHBOARD",
    "Approval Queue": "APPROVAL_QUEUE",
    "Team Requests": "APPROVAL_QUEUE",
    "Review Requests": "REVIEW_REQUESTS",
    "Employee Directory": "EMPLOYEE_DIRECTORY",
    "Employees": "EMPLOYEE_DIRECTORY",
    "Reports": "REPORTS",
    "Insights": "REPORTS",
    "Audit Logs": "AUDIT_LOGS",
    "View Policy": "VIEW_POLICY",
    "Control Center": "VIEW_POLICY",
    "Export CSV": "EXPORT_CSV",
    "Approve Selected": "BULK_APPROVE",
    "Reject Selected": "BULK_REJECT",
  };
  
  // Try exact match first
  if (mapping[label]) {
    return mapping[label];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(mapping)) {
    if (label.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(label.toLowerCase())) {
      return value;
    }
  }
  
  return null;
}

/**
 * Extract actions from dock buttons
 */
function extractDockActions(pageContent: string): string[] {
  const actions: string[] = [];
  
  // Try to find button labels in various formats
  const buttonMatches = pageContent.match(/aria-label="([^"]+)"/g) || [];
  buttonMatches.forEach((match) => {
    const label = match.replace(/aria-label="([^"]+)"/, "$1");
    if (label && !label.includes("items selected")) {
      actions.push(label);
    }
  });
  
  // Also check for visible text in buttons
  const textMatches = pageContent.match(/>([^<]+)</g) || [];
  textMatches.forEach((match) => {
    const text = match.replace(/[><]/g, "").trim();
    if (text && text.length > 2 && text.length < 50 && !text.match(/^\d+$/) && !actions.includes(text)) {
      // Common dock button labels
      if (["Apply Leave", "My Requests", "Dashboard", "Approval Queue", "Export CSV", "Reports", "Audit Logs"].some(l => text.includes(l))) {
        actions.push(text);
      }
    }
  });
  
  return [...new Set(actions)]; // Remove duplicates
}

/**
 * Compare expected vs found actions
 */
function compareActions(
  role: Role,
  page: Page | undefined,
  expected: Action[],
  found: string[]
): { status: TestResult["status"]; warnings: string[] } {
  const warnings: string[] = [];
  
  if (!page) {
    return { status: "unknown_page", warnings: ["Page not recognized in routeToPage()"] };
  }
  
  if (found.length === 0) {
    return { status: "missing_dock", warnings: ["FloatingDock not found or has no actions"] };
  }
  
  // Normalize found actions
  const normalizedFound = found
    .map(normalizeActionLabel)
    .filter((a): a is Action => a !== null);
  
  // Check for missing expected actions
  const missing = expected.filter((exp) => !normalizedFound.includes(exp));
  if (missing.length > 0) {
    warnings.push(`Missing expected actions: ${missing.join(", ")}`);
  }
  
  // Check for unexpected actions (not in expected list)
  const unexpected = normalizedFound.filter((found) => !expected.includes(found));
  if (unexpected.length > 0) {
    warnings.push(`Unexpected actions: ${unexpected.join(", ")}`);
  }
  
  // Check for banned actions (employee should never see admin actions)
  if (role === "EMPLOYEE") {
    const banned = normalizedFound.filter((a) => 
      ["EXPORT_CSV", "REPORTS", "AUDIT_LOGS", "BULK_APPROVE", "BULK_REJECT"].includes(a)
    );
    if (banned.length > 0) {
      warnings.push(`CRITICAL: Employee sees banned actions: ${banned.join(", ")}`);
    }
  }
  
  const status = warnings.length === 0 ? "match" : "mismatch";
  
  return { status, warnings };
}

/**
 * Save test result artifact
 */
function saveArtifact(role: Role, route: string, result: TestResult) {
  const filename = `${role.toLowerCase()}-${route.replace(/\//g, "-").replace(/^-/, "") || "root"}.json`;
  const filepath = path.join(ARTIFACTS_DIR, filename);
  
  fs.writeFileSync(
    filepath,
    JSON.stringify(result, null, 2),
    "utf-8"
  );
  
  console.log(`  💾 Saved artifact: ${filename}`);
}

/**
 * Generate summary report
 */
function generateSummary() {
  const summaryPath = path.join(process.cwd(), "qa", "QA_AUTOMATED_SUMMARY.md");
  
  let markdown = `# QA Automated Summary: Role-Aware Dock Verification\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Test Coverage:** ${results.length} role/page combinations\n\n`;
  
  // Statistics
  const matches = results.filter((r) => r.status === "match").length;
  const mismatches = results.filter((r) => r.status === "mismatch").length;
  const missing = results.filter((r) => r.status === "missing_dock").length;
  const unknown = results.filter((r) => r.status === "unknown_page").length;
  
  markdown += `## Statistics\n\n`;
  markdown += `- ✅ Matches: ${matches}\n`;
  markdown += `- ❌ Mismatches: ${mismatches}\n`;
  markdown += `- ⚠️  Missing Dock: ${missing}\n`;
  markdown += `- ❓ Unknown Pages: ${unknown}\n\n`;
  
  // Detailed table
  markdown += `## Detailed Results\n\n`;
  markdown += `| Role | Page | Expected Actions | Found Actions | Status |\n`;
  markdown += `|------|------|------------------|---------------|--------|\n`;
  
  results.forEach((result) => {
    const statusEmoji = 
      result.status === "match" ? "✅" :
      result.status === "mismatch" ? "❌" :
      result.status === "missing_dock" ? "⚠️" :
      "❓";
    
    const expectedStr = result.expectedActions.length > 0 
      ? result.expectedActions.join(", ") 
      : "*none*";
    const foundStr = result.foundActions.length > 0 
      ? result.foundActions.join(", ") 
      : "*none*";
    const pageStr = result.page || result.route;
    
    markdown += `| ${result.role} | ${pageStr} | ${expectedStr} | ${foundStr} | ${statusEmoji} |\n`;
  });
  
  // Warnings section
  const resultsWithWarnings = results.filter((r) => r.warnings.length > 0);
  if (resultsWithWarnings.length > 0) {
    markdown += `\n## Warnings\n\n`;
    resultsWithWarnings.forEach((result) => {
      markdown += `### ${result.role} → ${result.route}\n\n`;
      result.warnings.forEach((warning) => {
        markdown += `- ⚠️ ${warning}\n`;
      });
      markdown += `\n`;
    });
  }
  
  // Unknown pages
  const unknownPages = results.filter((r) => r.status === "unknown_page");
  if (unknownPages.length > 0) {
    markdown += `\n## Unknown Pages Detected\n\n`;
    unknownPages.forEach((result) => {
      markdown += `- ${result.route} (not mapped in routeToPage())\n`;
    });
    markdown += `\n`;
  }
  
  fs.writeFileSync(summaryPath, markdown, "utf-8");
  console.log(`\n📊 Summary saved: ${summaryPath}`);
}

/**
 * Main test execution (to be called from browser automation)
 */
export async function runQATests() {
  console.log("🧪 Starting QA Automated Dock Verification...\n");
  
  // This will be orchestrated by browser automation
  // The actual browser testing will happen in the main execution
  console.log("📋 Test matrix prepared:");
  console.log(`   - Roles: ${Object.keys(TEST_CREDENTIALS).join(", ")}`);
  console.log(`   - Routes: ${ROUTES_TO_TEST.join(", ")}`);
  console.log(`   - Total combinations: ${Object.keys(TEST_CREDENTIALS).length * ROUTES_TO_TEST.length}\n`);
}

export { TEST_CREDENTIALS, ROUTES_TO_TEST, results, extractDockActions, compareActions, saveArtifact, generateSummary };

