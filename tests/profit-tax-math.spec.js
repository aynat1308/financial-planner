const { test, expect } = require('@playwright/test');

async function helpers(page) {
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Assets' }).click(); // ensure app booted
  return page;
}

test('taxOnWithdrawal taxes only the proportional profit', async ({ page }) => {
  await helpers(page);
  const r = await page.evaluate(() =>
    window.__plannerTax.taxOnWithdrawal(100000, 30000, 25, 10000));
  expect(r).toEqual({ tax: 750, newBalance: 90000, newProfit: 27000 });
});

test('profit=0 yields zero tax', async ({ page }) => {
  await helpers(page);
  const r = await page.evaluate(() =>
    window.__plannerTax.taxOnWithdrawal(100000, 0, 25, 10000));
  expect(r.tax).toBe(0);
  expect(r.newProfit).toBe(0);
});

test('profit=balance matches old flat-rate behavior', async ({ page }) => {
  await helpers(page);
  const r = await page.evaluate(() =>
    window.__plannerTax.taxOnWithdrawal(100000, 100000, 25, 10000));
  expect(r.tax).toBe(2500); // 10000 * 25%
});

test('balance=0 is guarded (no divide-by-zero)', async ({ page }) => {
  await helpers(page);
  const r = await page.evaluate(() =>
    window.__plannerTax.taxOnWithdrawal(0, 0, 25, 0));
  expect(r.tax).toBe(0);
  expect(Number.isNaN(r.newProfit)).toBe(false);
});

test('applyGrowth adds all growth to profit', async ({ page }) => {
  await helpers(page);
  const r = await page.evaluate(() => window.__plannerTax.applyGrowth(100000, 30000, 7));
  expect(r).toEqual({ balance: 107000, profit: 37000 });
});
