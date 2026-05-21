import { expect, test, type Page } from '@playwright/test';

import { openAdminTab } from './helpers/admin';
import { uniqueSuffix } from './utils';

/**
 * Create-then-delete CRUD over the Admin → Qualified receiver section.
 * Simpler shape than co-users/requesting-sources: single name field +
 * active/inactive toggle (defaults to active).
 */
const deleteQualifiedReceiver = async (page: Page, name: string): Promise<void> => {
  if (page.isClosed()) return;
  try {
    if (!page.url().includes('/admin')) {
      await openAdminTab(page, 'Qualified receiver');
    }
    await page.locator('#qualified-search').fill(name);

    const row = page.locator('tr', { hasText: name }).first();
    if ((await row.count()) === 0) return;

    await row.getByLabel(`Delete ${name}`).click();

    const confirmDialog = page.getByRole('dialog', { name: /delete qualified receiver/i });
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
    await confirmDialog.getByRole('button', { name: /\bdelete$/i }).click();

    await expect(row).toHaveCount(0, { timeout: 30_000 });
  } catch (err) {
    if (!page.isClosed()) {
      // eslint-disable-next-line no-console
      console.warn(`deleteQualifiedReceiver("${name}") failed during cleanup: ${err}`);
    }
  }
};

test('admin qualified receiver: create then delete', async ({ page }) => {
  // QUALIFIED_RECEIVER column is VARCHAR2(20); uniqueSuffix() alone is ~18
  // chars and still e2e-prefixed, leaving a small margin under the limit.
  const name = uniqueSuffix();

  try {
    await openAdminTab(page, 'Qualified receiver');
    await page.getByRole('button', { name: 'Add qualified receiver', exact: true }).click();

    const modal = page.getByRole('dialog', { name: /add qualified receiver/i });
    await expect(modal).toBeVisible({ timeout: 10_000 });

    const nameInput = modal.locator('#qualified-name');
    await nameInput.fill(name);
    await expect(nameInput).toHaveValue(name);
    await modal.getByRole('button', { name: /^create$/i }).click();

    await expect(modal).toBeHidden({ timeout: 30_000 });
    await expect(page.locator('tr', { hasText: name }).first()).toBeVisible({ timeout: 30_000 });
  } finally {
    await deleteQualifiedReceiver(page, name);
  }
});
