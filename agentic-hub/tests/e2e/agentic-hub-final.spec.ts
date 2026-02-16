import { test, expect } from "@playwright/test";

test.describe("Agentic Hub - System End-to-End", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("homepage loads with all elements", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Agentic Hub");
    await expect(page.locator("text=Multi-model AI agent platform")).toBeVisible();
    await expect(page.locator('a[href="/monitoring"]')).toBeVisible();
  });

  test("navigation to monitoring works", async ({ page }) => {
    await page.click('a[href="/monitoring"]');
    await expect(page).toHaveURL(/\/monitoring/);
    await expect(page.locator("h1")).toContainText("System Monitoring");
  });

  test("agent system is operational", async ({ page }) => {
    // Verify the system is running by checking monitoring page
    await page.goto("http://localhost:3000/monitoring");

    await expect(page.locator("h1")).toContainText("System Monitoring");
    await expect(page.locator("text=LangGraph agents system operational")).toBeVisible();
  });

  test("all main pages are accessible", async ({ page }) => {
    // Test homepage
    await page.goto("http://localhost:3000");
    await expect(page.locator("h1")).toContainText("Agentic Hub");

    // Test monitoring page
    await page.goto("http://localhost:3000/monitoring");
    await expect(page.locator("h1")).toContainText("System Monitoring");

    // Return to home
    await page.goto("http://localhost:3000");
    await expect(page.locator("h1")).toContainText("Agentic Hub");
  });
});
