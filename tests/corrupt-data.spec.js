const { test, expect } = require('@playwright/test');

// Regression: older saved data stored yearlyExpenseOverrides as an OBJECT
// ({ [year]: { [categoryId]: amount } }), but every reader treats it as an
// ARRAY ({ [year]: [{ categoryId, monthlyAmount }] }) and calls .find on it.
// With object-shaped data in localStorage the whole app threw
// "TypeError: ...find is not a function" and white-screened. Loading must
// normalize old data instead of crashing.
test('object-shaped yearlyExpenseOverrides in storage does not break the app', async ({ page }) => {
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Expenses' }).waitFor();

  await page.evaluate(() => {
    localStorage.setItem('financial-planner-data', JSON.stringify({
      initialParams: { currentYear: 2026, currentLaborIncome: 20000, laborIncomeGrowth: 0, targetLaborIncome: 5000 },
      // Legacy OBJECT shape (year -> {categoryId: monthlyAmount})
      yearlyExpenseOverrides: { '2027': { '1': 5000, '2': 1200 } },
    }));
  });

  await page.reload();

  // App must still mount and be navigable (previously crashed to a blank root).
  await expect(page.getByRole('button', { name: 'Expenses' })).toBeVisible();
  await page.getByRole('button', { name: 'Expenses' }).click();
  await expect(page.getByText('Housing')).toBeVisible();

  // And the dashboard (which reads overrides via getExpensesForYear) must render.
  await page.getByRole('button', { name: 'Financial Plan' }).click();
  await expect(page.getByText('Total Wealth')).toBeVisible();
});
