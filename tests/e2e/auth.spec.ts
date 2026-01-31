import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should login successfully with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "employee1@demo.local");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');

    // Expect to be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard|^\/$/);
    await expect(page.getByText("Welcome")).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@demo.local");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button[type="submit"]');

    // Expect error message
    await expect(page.getByText("Invalid credentials")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "employee1@demo.local");
    await page.fill('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard|^\/$/);

    // Logout
    await page.getByRole('button', { name: /user|account|profile/i }).first().click();
    await page.getByText("Log out").click();

    // Expect to be redirected to login
    await expect(page).toHaveURL("/login");
  });
});
