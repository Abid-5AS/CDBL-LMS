/**
 * Browser-based QA Test Script
 * 
 * This script uses browser automation to test FloatingDock across all role/page combinations.
 * 
 * Usage:
 *   1. Ensure dev server is running (npm run dev)
 *   2. Run: tsx scripts/qa-browser-test.ts
 * 
 * Note: This requires manual execution using browser MCP tools.
 * See the test plan below for systematic testing.
 */

import { DOCK_MATRIX, routeToPage, type Role, type Page, type Action } from "../lib/role-ui";
import fs from "fs";
import path from "path";

interface TestResult {
  role: Role;
  route: string;
  page: Page | undefined;
  expectedActions: Action[];
  foundActions: string[];
  normalizedFound: Action[];
  status: "match" | "mismatch" | "missing_dock" | "unknown_page";
  warnings: string[];
  screenshotPath?: string;
}

const results: TestResult[] = [];

// Test credentials
const CREDENTIALS: Record<Role, { email: string; password: string }> = {
  EMPLOYEE: { email: "employee1@demo.local", password: "demo123" },
  DEPT_HEAD: { email: "manager@demo.local", password: "demo123" },
  HR_ADMIN: { email: "hradmin@demo.local", password: "demo123" },
  HR_HEAD: { email: "hrhead@demo.local", password: "demo123" },
  CEO: { email: "ceo@demo.local", password: "demo123" },
};

const ROUTES = [
  "/dashboard",
  "/leaves",
  "/leaves/apply",
  "/approvals",
  "/employees",
  "/reports",
  "/policies",
  "/admin/audit",
];

/**
 * Map UI labels to canonical Action types
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
    "Return for Modification": "BULK_REJECT", // Approximate mapping
  };
  
  // Exact match
  if (mapping[label]) {
    return mapping[label];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(mapping)) {
    const lowerKey = key.toLowerCase();
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes(lowerKey) || lowerKey.includes(lowerLabel)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Extract dock actions from accessibility snapshot
 */
function extractActionsFromSnapshot(snapshot: string): string[] {
  const actions: string[] = [];
  
  // Find navigation "Page actions" section
  const pageActionsMatch = snapshot.match(/navigation "Page actions" \[ref=[^\]]+\]:\s*([^\[]+)/s);
  if (pageActionsMatch) {
    // Extract button labels
    const buttonMatches = snapshot.match(/button "([^"]+)" \[ref=[^\]]+\]/g) || [];
    buttonMatches.forEach((match) => {
      const label = match.replace(/button "([^"]+)".*/, "$1");
      if (label && !label.includes("Open Next.js") && !label.includes("Notifications")) {
        actions.push(label);
      }
    });
  }
  
  return [...new Set(actions)];
}

/**
 * Compare expected vs found actions
 */
function compareActions(
  role: Role,
  page: Page | undefined,
  expected: Action[],
  found: string[]
): { status: TestResult["status"]; warnings: string[]; normalized: Action[] } {
  const warnings: string[] = [];
  const normalized = found
    .map(normalizeActionLabel)
    .filter((a): a is Action => a !== null);
  
  if (!page) {
    return { 
      status: "unknown_page", 
      warnings: ["Page not recognized in routeToPage()"], 
      normalized: [] 
    };
  }
  
  if (found.length === 0) {
    return { 
      status: "missing_dock", 
      warnings: ["FloatingDock not found or has no actions"], 
      normalized: [] 
    };
  }
  
  // Check for missing expected actions
  const missing = expected.filter((exp) => !normalized.includes(exp));
  if (missing.length > 0) {
    warnings.push(`Missing expected actions: ${missing.join(", ")}`);
  }
  
  // Check for unexpected actions (not in expected list)
  const unexpected = normalized.filter((found) => !expected.includes(found));
  if (unexpected.length > 0) {
    warnings.push(`Unexpected actions: ${unexpected.join(", ")}`);
  }
  
  // Check for banned actions (employee should never see admin actions)
  if (role === "EMPLOYEE") {
    const banned = normalized.filter((a) => 
      ["EXPORT_CSV", "REPORTS", "AUDIT_LOGS", "BULK_APPROVE", "BULK_REJECT"].includes(a)
    );
    if (banned.length > 0) {
      warnings.push(`CRITICAL: Employee sees banned actions: ${banned.join(", ")}`);
    }
  }
  
  const status = warnings.length === 0 ? "match" : "mismatch";
  
  return { status, warnings, normalized };
}

/**
 * Save test result artifact
 */
function saveResult(result: TestResult) {
  const filename = `${result.role.toLowerCase()}-${result.route.replace(/\//g, "-").replace(/^-/, "") || "root"}.json`;
  const filepath = path.join(process.cwd(), "qa", "artifacts", filename);
  
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2), "utf-8");
  return filename;
}

/**
 * Add a test result
 */
export function addResult(
  role: Role,
  route: string,
  foundActions: string[],
  screenshotPath?: string
) {
  const page = routeToPage(route);
  const expectedActions = page ? (DOCK_MATRIX[role]?.[page] || []) : [];
  
  const comparison = compareActions(role, page, expectedActions, foundActions);
  
  const result: TestResult = {
    role,
    route,
    page,
    expectedActions,
    foundActions,
    normalizedFound: comparison.normalized,
    status: comparison.status,
    warnings: comparison.warnings,
    screenshotPath,
  };
  
  results.push(result);
  const filename = saveResult(result);
  
  console.log(`✅ Tested: ${role} → ${route}`);
  console.log(`   Expected: ${expectedActions.join(", ") || "none"}`);
  console.log(`   Found: ${foundActions.join(", ") || "none"}`);
  if (comparison.warnings.length > 0) {
    console.log(`   ⚠️  ${comparison.warnings.join("; ")}`);
  }
  console.log(`   💾 Saved: ${filename}\n`);
  
  return result;
}

/**
 * Generate summary report
 */
export function generateSummary() {
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
  if (unknown > 0) {
    markdown += `\n## Unknown Pages Detected\n\n`;
    results
      .filter((r) => r.status === "unknown_page")
      .forEach((result) => {
        markdown += `- ${result.route} (not mapped in routeToPage())\n`;
      });
    markdown += `\n`;
  }
  
  fs.writeFileSync(summaryPath, markdown, "utf-8");
  console.log(`\n📊 Summary saved: ${summaryPath}`);
  return summaryPath;
}

// Export for use in browser automation
export { CREDENTIALS, ROUTES, extractActionsFromSnapshot, normalizeActionLabel, results };

