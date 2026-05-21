import { expect, test, type Page } from '@playwright/test';

import { openAdminTab } from './helpers/admin';
import { uniqueSuffix } from './utils';

/**
 * Create-then-delete CRUD over the Admin → Expense authority section. Same
 * shape as qualified receiver: single name field + active/inactive toggle.
 */
const deleteExpenseAuthority = async (page: Page, name: string): Promise<void> => {
  if (page.isClosed()) return;
  try {
    if (!page.url().includes('/admin')) {
      await openAdminTab(page, 'Expense authority');
    }
    await page.locator('#expense-search').fill(name);

    const row = page.locator('tr', { hasText: name }).first();
    if ((await row.count()) === 0) return;

    await row.getByLabel(`Delete ${name}`).click();

    const confirmDialog = page.getByRole('dialog', { name: /delete expense authority/i });
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
    await confirmDialog.getByRole('button', { name: /\bdelete$/i }).click();

    await expect(row).toHaveCount(0, { timeout: 30_000 });
  } catch (err) {
    if (!page.isClosed()) {
      // eslint-disable-next-line no-console
      console.warn(`deleteExpenseAuthority("${name}") failed during cleanup: ${err}`);
    }
  }
};

test('admin expense authority: create then delete', async ({ page }) => {
  // EXPENSE_AUTHORITY column is VARCHAR2(20); uniqueSuffix() alone is ~18
  // chars and still e2e-prefixed, leaving a small margin under the limit.
  const name = uniqueSuffix();

  try {
    await openAdminTab(page, 'Expense authority');
    await page.getByRole('button', { name: 'Add expense authority', exact: true }).click();

    const modal = page.getByRole('dialog', { name: /add expense authority/i });
    await expect(modal).toBeVisible({ timeout: 10_000 });

    const nameInput = modal.locator('#expense-name');
    await nameInput.fill(name);
    await expect(nameInput).toHaveValue(name);
    await modal.getByRole('button', { name: /^create$/i }).click();

    await expect(modal).toBeHidden({ timeout: 30_000 });
    await expect(page.locator('tr', { hasText: name }).first()).toBeVisible({ timeout: 30_000 });
  } finally {
    await deleteExpenseAuthority(page, name);
  }
});
