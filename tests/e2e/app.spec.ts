import { test, expect } from '@playwright/test';

test.describe('Agentic-AI Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the actual chat thread page
    // Note: This assumes a thread with ID "test-thread" exists
    await page.goto('http://localhost:3000/chat/test-thread');
  });

  test('should load chat page', async ({ page }) => {
    // Check that the page loaded successfully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have chat input textarea', async ({ page }) => {
    // Look for textarea (the actual input element used)
    const input = page.locator('textarea').first();
    await expect(input).toBeVisible();
  });

  test('should have model selector', async ({ page }) => {
    // Check for model selector component
    const selector = page.locator('button:has-text("Model")').or(
      page.locator('[aria-label*="model"]')
    ).first();
    await expect(selector).toBeVisible();
  });

  test('responsive - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-results/desktop.png' });
  });

  test('responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-results/mobile.png' });
  });

  test('should have message list area', async ({ page }) => {
    // Check for the message list container
    const messageArea = page.locator('div:has-text("Agentic Hub")').or(
      page.locator('.bg-zinc-950') // Main chat area
    ).first();
    await expect(messageArea).toBeVisible();
  });
});
