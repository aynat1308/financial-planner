const { test, expect } = require('@playwright/test');

async function openIncomes(page) {
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Incomes' }).click();
  await expect(page.getByText('Total Monthly Labor Income')).toBeVisible();
}

test('default labor-income total reflects the seeded salary', async ({ page }) => {
  await openIncomes(page);
  // Seed: Main Job 20,000/mo -> total renders "₪20,000(₪240,000/yr)".
  await expect(page.getByText('Main Job')).toBeVisible();
  await expect(page.getByText(/₪20,000/).first()).toBeVisible();
});

test('adding a salary adds a new editable row', async ({ page }) => {
  await openIncomes(page);
  await expect(page.getByText('New Salary')).toHaveCount(0);
  await page.getByRole('button', { name: '+ Add Salary' }).click();
  await expect(page.getByText('New Salary')).toBeVisible();
});
