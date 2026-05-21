import { expect, test, type Page } from '@playwright/test';

import { openAdminTab } from './helpers/admin';
import { uniqueSuffix } from './utils';

/**
 * Create-then-delete CRUD over the Admin → Requesting source section. Uses
 * the "external" branch (free-text name) so we don't depend on the
 * OrgUnitSelector. Also locks in the recent edit that removed the Org Unit
 * column from this table.
 */
const deleteRequestingSource = async (page: Page, name: string): Promise<void> => {
  if (page.isClosed()) return;
  try {
    if (!page.url().includes('/admin')) {
      await openAdminTab(page, 'Requesting source');
    }
    await page.locator('#requesting-search').fill(name);

    const row = page.locator('tr', { hasText: name }).first();
    if ((await row.count()) === 0) return;

    await row.getByLabel(`Delete ${name}`).click();

    const confirmDialog = page.getByRole('dialog', { name: /delete requesting source/i });
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
    await confirmDialog.getByRole('button', { name: /\bdelete$/i }).click();

    await expect(row).toHaveCount(0, { timeout: 30_000 });
  } catch (err) {
    if (!page.isClosed()) {
      // eslint-disable-next-line no-console
      console.warn(`deleteRequestingSource("${name}") failed during cleanup: ${err}`);
    }
  }
};

test('admin requesting source: create then delete', async ({ page }) => {
  const name = `E2E Source ${uniqueSuffix()}`;

  try {
    await openAdminTab(page, 'Requesting source');
    await page.getByRole('button', { name: 'Add requesting source', exact: true }).click();

    const modal = page.getByRole('dialog', { name: /add requesting source/i });
    await expect(modal).toBeVisible({ timeout: 10_000 });

    // Click the label text — Carbon's RadioButton overlays the <input> with a
    // styled <span class="cds--radio-button__appearance"> that intercepts
    // pointer events, so clicking the input itself hangs in actionability.
    await modal.getByText('External - custom name', { exact: true }).click();
    await modal.locator('#requesting-name').fill(name);
    await modal.getByRole('button', { name: /^create$/i }).click();

    await expect(modal).toBeHidden({ timeout: 30_000 });

    // Locked-in regression: no Org Unit column header (was removed recently).
    const tableHeader = page.locator('table thead').first();
    await expect(tableHeader).not.toContainText('Org unit');

    await expect(page.locator('tr', { hasText: name }).first()).toBeVisible({ timeout: 30_000 });
  } finally {
    await deleteRequestingSource(page, name);
  }
});
