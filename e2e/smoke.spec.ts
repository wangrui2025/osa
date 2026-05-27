import { test, expect } from '@playwright/test';

test.describe('OSA smoke tests', () => {
  test('homepage loads with title', async ({ page }) => {
    await page.goto('en/');
    await expect(page).toHaveTitle(/OSA/i);
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('en/');
    const themeBtn = page.locator('button[aria-label="Toggle Theme"]').first();
    await expect(themeBtn).toBeVisible();

    await themeBtn.click();
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    await themeBtn.click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('language switcher navigates to zh', async ({ page }) => {
    await page.goto('en/');
    const zhLink = page.locator('a[href="/osa/zh/"]').first();
    await expect(zhLink).toBeVisible();
    await zhLink.click();
    await expect(page).toHaveURL(/\/zh\/$/);
  });

  test('slides page renders', async ({ page }) => {
    await page.goto('en/slides/');
    await expect(page).toHaveTitle(/OSA/i);
  });

  test('poster page renders', async ({ page }) => {
    await page.goto('en/poster/');
    await expect(page).toHaveTitle(/OSA/i);
  });

  test('client-router announcer present after navigation', async ({ page }) => {
    await page.goto('en/');
    const zhLink = page.locator('a[href="/osa/zh/"]').first();
    await zhLink.click();
    await expect(page).toHaveURL(/\/zh\/$/);

    const announcer = page.locator('.astro-route-announcer');
    await expect(announcer).toHaveAttribute('aria-live', 'assertive');
    await expect(announcer).toHaveAttribute('aria-atomic', 'true');
  });
});
