import { test, expect } from '@playwright/test';

test.describe('Agentic-AI Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/chat');
  });

  test('should load chat page', async ({ page }) => {
    await expect(page).toHaveTitle(/Agentic/);
  });

  test('should have chat input', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible();
  });

  test('should show threads sidebar', async ({ page }) => {
    const sidebar = page.locator('[data-testid="thread-list"], aside nav').first();
    await expect(sidebar).toBeVisible();
  });

  test('responsive - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-results/desktop.png' });
  });

  test('responsive - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-results/mobile.png' });
  });

  test('should handle message input', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill('Hello test');
    await page.screenshot({ path: 'test-results/message-typed.png' });
  });
});
