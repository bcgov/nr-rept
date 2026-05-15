import { expect, test } from '@playwright/test';

import {
  adminContactDisplayName,
  createAdminContact,
  deleteAdminContact,
  type CreateAdminContactOpts,
} from './helpers/admin-contact';
import { uniqueSuffix } from './utils';

test('admin contact: create then delete', async ({ page }) => {
  // validateContactName enforces XOR: (firstName + lastName) OR companyName,
  // never all three. We use the person-name branch here.
  const opts: CreateAdminContactOpts = {
    kind: 'person',
    firstName: 'E2ETest',
    lastName: uniqueSuffix(),
  };
  const displayName = adminContactDisplayName(opts);

  try {
    await createAdminContact(page, opts);
    // Sanity: row really did land in the table.
    await expect(page.locator('tr', { hasText: displayName }).first()).toBeVisible();
  } finally {
    await deleteAdminContact(page, opts);
  }
});
