import { expect, test } from '@playwright/test';

import {
  adminContactDisplayName,
  createAdminContact,
  deleteAdminContact,
  type CreateAdminContactOpts,
} from './helpers/admin-contact';
import { openFirstProject, openProjectTab } from './helpers/project';
import { createProperty, deleteProperty } from './helpers/property';
import { uniqueSuffix } from './utils';

/**
 * End-to-end: create an admin contact + a property, associate the contact
 * with the property, remove the association, then delete both the property
 * and the admin contact. Fully self-contained.
 */
test('property contact: associate then remove', async ({ page }) => {
  const opts: CreateAdminContactOpts = {
    kind: 'person',
    firstName: 'E2ETest',
    lastName: uniqueSuffix(),
  };
  const displayName = adminContactDisplayName(opts);
  const lastName = opts.lastName;

  await createAdminContact(page, opts);

  await openFirstProject(page);
  await openProjectTab(page, 'Properties');
  const pidFormatted = await createProperty(page);

  try {
    // The new property is auto-selected; its detail tabs are visible. Switch
    // to the property's Contacts sub-tab (scope to the Property tablist so we
    // don't accidentally click the project-level "Contacts" tab above it).
    await page
      .getByRole('tablist', { name: 'Property sub-sections' })
      .getByRole('tab', { name: 'Contacts', exact: true })
      .click();

    // Trigger button outside any modal.
    await page.getByRole('button', { name: 'Add Contact', exact: true }).first().click();

    const modal = page.locator('.add-contact-modal').filter({
      has: page.getByText('Add Contact to Property'),
    });

    await modal.locator('#propContactSearchLastName').fill(lastName);
    await modal.getByRole('button', { name: /^search$/i }).click();

    const searchRow = modal.locator('tr', { hasText: displayName }).first();
    await expect(searchRow).toBeVisible({ timeout: 30_000 });
    await searchRow.locator('input[type="radio"]').check();

    await modal.locator('select#propertyContactType').selectOption({ index: 1 });

    await modal.getByRole('button', { name: 'Add Contact', exact: true }).click();

    // Contact now shows in the property contacts table.
    const associationRow = page.locator('tr', { hasText: displayName }).first();
    await expect(associationRow).toBeVisible({ timeout: 30_000 });

    await associationRow.getByLabel('Remove contact').click();
    const removeDialog = page.getByRole('dialog', { name: /remove contact/i });
    await expect(removeDialog).toBeVisible({ timeout: 10_000 });
    // Carbon's danger button name resolves to "danger Remove"; match the
    // trailing word so the visually-hidden icon label doesn't trip us up.
    await removeDialog.getByRole('button', { name: /\bremove$/i }).click();
    // Scope to .project-table — the Add Contact modal's search results
    // (Carbon `<Table size="sm">`) also contain a row with this displayName
    // and stay in the DOM after the modal closes.
    await expect(page.locator('.project-table tr', { hasText: displayName })).toHaveCount(0, {
      timeout: 30_000,
    });
  } finally {
    // Clean up the property (must select Details tab first so the trash icon
    // on the property list is reachable — re-clicking the row works).
    await deleteProperty(page, pidFormatted);
    await deleteAdminContact(page, opts);
  }
});
