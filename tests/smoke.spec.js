const { test, expect } = require('@playwright/test');

test('app boots and shows nav buttons without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/index.html');

  // Babel transpiles in-browser; wait for React to mount the landing buttons.
  await expect(page.getByRole('button', { name: 'Expenses' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Incomes' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Assets' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Debts' })).toBeVisible();

  expect(errors, `console errors: ${errors.join('\n')}`).toEqual([]);
});
