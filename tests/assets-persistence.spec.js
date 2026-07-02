const { test, expect } = require('@playwright/test');

async function openAssets(page) {
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Assets' }).click();
  await expect(page.getByText('Hishtalmut')).toBeVisible();
}

test('a saved change persists across reload (localStorage)', async ({ page }) => {
  await openAssets(page);

  // Mutate state, then confirm it survives a reload of the same context.
  await expect(page.getByText('New Asset')).toHaveCount(0);
  await page.getByRole('button', { name: '+ Add Asset' }).click();
  await expect(page.getByText('New Asset')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Assets' }).click();
  await expect(page.getByText('New Asset')).toBeVisible();

  const stored = await page.evaluate(() =>
    localStorage.getItem('financial-planner-data'));
  expect(stored, 'expected persisted state in localStorage').not.toBeNull();
});
