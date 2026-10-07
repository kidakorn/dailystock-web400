import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/daily-stock-balance/',
  '/package-summary/',
  '/process-master/',
];

test.describe('dashboard routes', () => {
  for (const route of routes) {
    test(`renders main content at ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
      await expect(page.getByRole('main')).toBeVisible();
    });
  }
});
