import { expect, test } from '@playwright/test';

import { createAdminContact, deleteAdminContact } from './helpers/admin-contact';
import { openFirstProject, openProjectTab } from './helpers/project';
import { uniqueSuffix } from './utils';

/**
 * Full round-trip: create a fresh admin contact, associate it with a project,
 * remove the association, then delete the admin contact. Self-contained so
 * the suite doesn't depend on whatever DEV happens to have today.
 */
test('project contact: associate then remove', async ({ page }) => {
  const suffix = uniqueSuffix();
  const firstName = 'E2ETest';
  const lastName = suffix;
  const displayName = `${firstName} ${lastName}`;

  await createAdminContact(page, { firstName, lastName });

  try {
    await openFirstProject(page);
    await openProjectTab(page, 'Contacts');

    // Trigger button outside any modal.
    await page.getByRole('button', { name: 'Add Contact', exact: true }).first().click();

    const modal = page.locator('.add-contact-modal').filter({
      has: page.getByText('Add Contact to Project'),
    });

    // Find the freshly-created contact via the unique lastName.
    await modal.locator('#searchLastName').fill(lastName);
    await modal.getByRole('button', { name: /^search$/i }).click();

    const searchRow = modal.locator('tr', { hasText: displayName }).first();
    await expect(searchRow).toBeVisible({ timeout: 30_000 });
    await searchRow.locator('input[type="radio"]').check();

    await modal.locator('select#contactType').selectOption({ index: 1 });

    await modal.getByRole('button', { name: 'Add Contact', exact: true }).click();

    // The contact now shows on the project's Contacts tab.
    const associationRow = page.locator('tr', { hasText: displayName }).first();
    await expect(associationRow).toBeVisible({ timeout: 30_000 });

    // Remove it.
    await associationRow.getByLabel('Remove contact').click();
    const removeDialog = page.getByRole('dialog', { name: /remove contact/i });
    await expect(removeDialog).toBeVisible({ timeout: 10_000 });
    await removeDialog.getByRole('button', { name: /^remove$/i }).click();
    await expect(page.locator('tr', { hasText: displayName })).toHaveCount(0, {
      timeout: 30_000,
    });
  } finally {
    await deleteAdminContact(page, displayName);
  }
});
