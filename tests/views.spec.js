const { test, expect } = require('@playwright/test');

async function boot(page) {
  await page.goto('/index.html');
  await expect(page.getByRole('button', { name: 'Expenses' })).toBeVisible();
}

test('each nav button reveals its view', async ({ page }) => {
  await boot(page);

  await page.getByRole('button', { name: 'Incomes' }).click();
  await expect(page.getByText('Total Monthly Labor Income')).toBeVisible();

  // Debts default to empty, so the balance totals only appear once entries
  // exist. Anchor on the always-present section controls instead.
  await page.getByRole('button', { name: 'Debts' }).click();
  await expect(page.getByRole('button', { name: '+ Add Loan' })).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Add Mortgage' })).toBeVisible();

  await page.getByRole('button', { name: 'Assets' }).click();
  await expect(page.getByText('Total Assets').first()).toBeVisible();

  await page.getByRole('button', { name: 'Financial Plan' }).click();
  await expect(page.getByText('Total Wealth')).toBeVisible();
  await expect(page.getByText('Financial Independence')).toBeVisible();
});
