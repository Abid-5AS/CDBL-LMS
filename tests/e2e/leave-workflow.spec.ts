import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Leave Workflow
 * 
 * Tests:
 * 1. Happy path: Employee applies CL → HR Admin forward → Dept Head forward → HR Head approve
 * 2. Policy block: CL 4-day spell → blocked
 */

test.describe("Leave Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
  });

  test("Happy path: Forward chain", async ({ page }) => {
    // Note: This is a template test - requires actual test users and setup
    // Steps:
    // 1. Login as employee
    // 2. Apply for CL (3 days)
    // 3. Login as HR_ADMIN → Forward to DEPT_HEAD
    // 4. Login as DEPT_HEAD → Forward to HR_HEAD
    // 5. Login as HR_HEAD → Approve
    // 6. Verify final status is APPROVED
    // 7. Verify audit log shows full chain

    test.skip("Requires test user setup", () => {
      // TODO: Implement with actual test users
    });
  });

  test("Policy block: CL 4-day spell", async ({ page }) => {
    // Login as employee
    await page.fill('input[type="email"]', "employee1@demo.local");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');

    // Navigate to apply leave
    await page.goto("/leaves/apply");

    // Fill form: CL, 4 days
    await page.selectOption('select[name="type"]', "CASUAL");
    
    // Set dates for 4 consecutive days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 5); // 5 days from now
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 3); // 4 days total

    await page.fill('input[name="startDate"]', startDate.toISOString().split("T")[0]);
    await page.fill('input[name="endDate"]', endDate.toISOString().split("T")[0]);
    await page.fill('textarea[name="reason"]', "Need 4 days off for personal reasons");

    // Submit
    await page.click('button[type="submit"]');

    // Should see error message
    await expect(page.locator("text=CL cannot exceed 3 consecutive days")).toBeVisible();
    
    // Request should not be created
    await page.goto("/leaves");
    // Verify no new request with 4 days exists
  });
});

