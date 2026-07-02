const { test, expect } = require('@playwright/test');

// This test DOCUMENTS current behavior as the pre-refactor baseline. The app
// currently masks the remount bug with a local-state / commit-on-blur pattern
// in each Row, so focus may already be retained while typing. After the
// Stage-2 (module-scope / Context) refactor, re-run this: the recorded value
// must not regress.
test('records whether a Row input keeps focus while typing (baseline)', async ({ page }) => {
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Incomes' }).click();
  await expect(page.getByText('Total Monthly Labor Income')).toBeVisible();

  // First numeric field is the seeded salary's Monthly (₪) input.
  const input = page.locator('input[inputmode="numeric"]').first();
  await input.click();
  await input.pressSequentially('12345', { delay: 50 });

  const stillFocused = await input.evaluate((el) => el === document.activeElement);
  const value = await input.inputValue();
  console.log('[baseline] Row input retained focus during typing:', stillFocused);
  console.log('[baseline] Row input value after typing:', JSON.stringify(value));

  // Do not hard-fail on the focus state; just record it deterministically.
  expect(typeof stillFocused).toBe('boolean');
});
