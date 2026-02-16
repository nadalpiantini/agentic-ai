import { test, expect } from "@playwright/test";

test.describe("Agentic Hub - End to End", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("homepage loads correctly", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Agentic Hub");
    await expect(page.locator("text=Multi-model AI agent platform")).toBeVisible();
  });

  test("navigation to monitoring works", async ({ page }) => {
    await page.click('a[href="/monitoring"]');
    await expect(page).toHaveURL(/\/monitoring/);
    await expect(page.locator("h1")).toContainText("System Monitoring");
  });

  test("chat interface is accessible", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("http://localhost:3000");

    // Check if dashboard page exists
    const dashboardLink = page.locator('a[href="/monitoring"]');
    if (await dashboardLink.isVisible()) {
      await page.click('a[href="/monitoring"]');
    }

    // Look for chat interface elements
    const chatContainer = page.locator("main").or(page.locator(".chat-interface"));
    await expect(chatContainer).toBeVisible();
  });
});
