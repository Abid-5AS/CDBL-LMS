import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Leave Workflow
 * 
 * Tests:
 * 1. Happy path: Employee applies EL → HR Admin forward → Dept Head forward → HR Head approve
 */

test.describe("Leave Workflow", () => {
  test.slow(); // This test involves multiple logins and steps

  test("Happy path: Full Approval Chain (EL)", async ({ page }) => {
    const reason = `E2E Test Leave ${Date.now()}`;

    // ----------------------------------------------------------------
    // Step 1: Employee Applies for Leave
    // ----------------------------------------------------------------
    await test.step("Employee applies for EL", async () => {
      await page.goto("/login");
      await page.fill('input[type="email"]', "employee1@demo.local");
      await page.fill('input[type="password"]', "demo123");
      await page.click('button[type="submit"]');
      // Wait for any dashboard or home page
      await expect(page).toHaveURL(/\/dashboard|^\/$/);

      await page.goto("/leaves/apply");

      // Select Earned Leave
      await page.click('button[role="combobox"]');
      await page.click('div[role="option"]:has-text("Earned Leave")');

      // Set dates (next month to be safe)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + 30);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2);

      // Fill dates
      await page.fill('input[name="startDate"]', startDate.toISOString().split("T")[0]);
      await page.fill('input[name="endDate"]', endDate.toISOString().split("T")[0]);

      await page.fill('textarea[name="reason"]', reason);
      await page.click('button[type="submit"]');

      // Verify success toast or redirect
      await expect(page.getByText("Leave request submitted")).toBeVisible();

      // Logout
      await page.getByRole('button', { name: /user|account|profile/i }).first().click();
      await page.getByText("Log out").click();
      await expect(page).toHaveURL("/login");
    });

    // ----------------------------------------------------------------
    // Step 2: HR Admin Forwards
    // ----------------------------------------------------------------
    await test.step("HR Admin forwards to Dept Head", async () => {
      await page.goto("/login");
      await page.fill('input[type="email"]', "hradmin@demo.local");
      await page.fill('input[type="password"]', "demo123");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard|^\/$/);

      await page.goto("/approvals");

      // Find the request
      const row = page.getByRole('row').filter({ hasText: reason });
      await expect(row).toBeVisible();

      // Click View/Action
      await row.getByRole('button', { name: /view|details/i }).click();

      // Expect Forward button
      await page.getByRole('button', { name: "Forward" }).click();

      // Select Dept Head in modal if required
      if (await page.getByRole('combobox', { name: /forward to/i }).isVisible()) {
        await page.getByRole('combobox', { name: /forward to/i }).click();
        await page.getByRole('option', { name: /dept head|manager/i }).first().click();
      }

      await page.getByRole('button', { name: /submit|confirm/i }).click();

      await expect(page.getByText("Leave request forwarded")).toBeVisible();

      // Logout
      await page.getByRole('button', { name: /user|account|profile/i }).first().click();
      await page.getByText("Log out").click();
    });

    // ----------------------------------------------------------------
    // Step 3: Dept Head Forwards
    // ----------------------------------------------------------------
    await test.step("Dept Head forwards to HR Head", async () => {
      await page.goto("/login");
      await page.fill('input[type="email"]', "manager@demo.local");
      await page.fill('input[type="password"]', "demo123");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard|^\/$/);

      await page.goto("/approvals");
      const row = page.getByRole('row').filter({ hasText: reason });
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: /view|details/i }).click();

      await page.getByRole('button', { name: "Forward" }).click();

      if (await page.getByRole('combobox', { name: /forward to/i }).isVisible()) {
        await page.getByRole('combobox', { name: /forward to/i }).click();
        await page.getByRole('option', { name: /hr head/i }).click();
      }

      await page.getByRole('button', { name: /submit|confirm/i }).click();

      await expect(page.getByText("Leave request forwarded")).toBeVisible();

      // Logout
      await page.getByRole('button', { name: /user|account|profile/i }).first().click();
      await page.getByText("Log out").click();
    });

    // ----------------------------------------------------------------
    // Step 4: HR Head Approves
    // ----------------------------------------------------------------
    await test.step("HR Head approves", async () => {
      await page.goto("/login");
      await page.fill('input[type="email"]', "hrhead@demo.local");
      await page.fill('input[type="password"]', "demo123");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard|^\/$/);

      await page.goto("/approvals");
      const row = page.getByRole('row').filter({ hasText: reason });
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: /view|details/i }).click();

      await page.getByRole('button', { name: "Approve" }).click();
      // Confirm approval
      await page.getByRole('button', { name: /confirm|approve/i }).last().click();

      await expect(page.getByText("Leave request approved")).toBeVisible();

      // Logout
      await page.getByRole('button', { name: /user|account|profile/i }).first().click();
      await page.getByText("Log out").click();
    });

    // ----------------------------------------------------------------
    // Step 5: Verify Final Status
    // ----------------------------------------------------------------
    await test.step("Verify final status as Employee", async () => {
      await page.goto("/login");
      await page.fill('input[type="email"]', "employee1@demo.local");
      await page.fill('input[type="password"]', "demo123");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard|^\/$/);

      await page.goto("/leaves");
      const row = page.getByRole('row').filter({ hasText: reason });
      await expect(row).toContainText("APPROVED");
    });
  });
});
