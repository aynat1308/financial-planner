const { test, expect } = require('@playwright/test');

const LANG_KEY = 'financial-planner-language';

test('language toggle flips dir/lang and label, and persists across reload', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate((k) => localStorage.removeItem(k), LANG_KEY);
  await page.reload();

  // Default: English / LTR.
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const toggle = page.getByTestId('lang-toggle');
  await expect(toggle).toHaveText('עברית');

  // Switch to Hebrew / RTL.
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(toggle).toHaveText('English');

  // Persists across reload.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('lang-toggle')).toHaveText('English');

  // Switch back to English.
  await page.getByTestId('lang-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByTestId('lang-toggle')).toHaveText('עברית');
});

test('nav labels translate to Hebrew and back', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate((k) => localStorage.removeItem(k), LANG_KEY);
  await page.reload();

  // English nav present.
  await expect(page.getByRole('button', { name: 'Assets' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Expenses' })).toBeVisible();

  // Switch to Hebrew: nav labels are Hebrew.
  await page.getByTestId('lang-toggle').click();
  await expect(page.getByRole('button', { name: 'נכסים' })).toBeVisible();       // Assets
  await expect(page.getByRole('button', { name: 'הוצאות' })).toBeVisible();      // Expenses
  await expect(page.getByRole('button', { name: 'תוכנית פיננסית' })).toBeVisible(); // Financial Plan

  // Switch back: English restored.
  await page.getByTestId('lang-toggle').click();
  await expect(page.getByRole('button', { name: 'Assets' })).toBeVisible();
});
