import { expect, test } from '@playwright/test';

import { createAdminContact, deleteAdminContact } from './helpers/admin-contact';
import { uniqueSuffix } from './utils';

test('admin contact: create then delete', async ({ page }) => {
  const suffix = uniqueSuffix();
  const firstName = 'E2ETest';
  const lastName = suffix;
  const displayName = `${firstName} ${lastName}`;

  try {
    await createAdminContact(page, { firstName, lastName, companyName: `Co ${suffix}` });
    // Sanity: row really did land in the table.
    await expect(page.locator('tr', { hasText: displayName }).first()).toBeVisible();
  } finally {
    await deleteAdminContact(page, displayName);
  }
});
