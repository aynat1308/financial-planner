const { test, expect } = require('@playwright/test');

const KEY = 'financial-planner-data';

test('legacy asset without profit migrates to profit === balance', async ({ page }) => {
  await page.goto('/index.html');
  // Seed legacy data (no `profit` field) BEFORE the app reads storage.
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({
      assets: [{ id: 1, name: 'LegacyAcct', balance: 80000, initialBalance: 80000,
                 annualReturn: 7, taxRate: 25, accessible: true, withdrawalAge: 0, withdrawLimit: null }],
    }));
  }, KEY);
  await page.reload();
  await page.getByRole('button', { name: 'Assets' }).click();
  await expect(page.getByText('LegacyAcct')).toBeVisible();

  // The auto-save effect (index.html:806-824) re-persists migrated state on mount;
  // profit should have defaulted to balance.
  const profit = await page.evaluate((key) => {
    const data = JSON.parse(localStorage.getItem(key));
    return data.assets.find(a => a.id === 1).profit;
  }, KEY);
  expect(profit).toBe(80000);
});
