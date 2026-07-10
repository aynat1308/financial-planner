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

test('Profit column header is visible on the Assets view', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate((key) => localStorage.removeItem(key), KEY);
  await page.reload();
  await page.getByRole('button', { name: 'Assets' }).click();
  await expect(page.getByText('Profit (₪)')).toBeVisible();
});

test('editing profit persists across reload', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate((key) => localStorage.removeItem(key), KEY);
  await page.reload();
  await page.getByRole('button', { name: 'Assets' }).click();

  const input = page.locator('[data-testid="profit-input-3"]'); // Investment Account
  await input.fill('40000');
  await input.blur();

  await page.reload();
  await page.getByRole('button', { name: 'Assets' }).click();
  await expect(page.locator('[data-testid="profit-input-3"]')).toHaveValue('40000');

  const persisted = await page.evaluate((key) => {
    const data = JSON.parse(localStorage.getItem(key));
    return data.assets.find(a => a.id === 3).profit;
  }, KEY);
  expect(persisted).toBe(40000);
});

test('profit input is clamped to [0, balance] and reflected in the UI', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate((key) => localStorage.removeItem(key), KEY);
  await page.reload();
  await page.getByRole('button', { name: 'Assets' }).click();

  const profit = page.locator('[data-testid="profit-input-3"]'); // Investment Account, balance 100000
  await profit.fill('250000');
  await profit.blur();
  // stored profit clamps to balance (100000), and the input reflects it
  await expect(profit).toHaveValue('100000');
  const stored = await page.evaluate((key) =>
    JSON.parse(localStorage.getItem(key)).assets.find(a => a.id === 3).profit, KEY);
  expect(stored).toBe(100000);
});

test('lowering balance below profit clamps profit down', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate((key) => localStorage.removeItem(key), KEY);
  await page.reload();
  await page.getByRole('button', { name: 'Assets' }).click();

  // Investment Account seed: balance 100000, profit 100000. Lower balance to 40000.
  const balance = page.locator('[data-testid="balance-input-3"]');
  await balance.fill('40000');
  await balance.blur();

  const stored = await page.evaluate((key) => {
    const a = JSON.parse(localStorage.getItem(key)).assets.find(x => x.id === 3);
    return { balance: a.balance, profit: a.profit };
  }, KEY);
  expect(stored).toEqual({ balance: 40000, profit: 40000 });
});
