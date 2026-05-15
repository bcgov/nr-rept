import { expect, type Page } from '@playwright/test';

import { gotoProtected } from '../utils';

/**
 * Navigate to /admin → Contacts. Fails fast if the saved auth session lacks
 * REPT_ADMIN (we'd be bounced to /unauthorized and the tabs would never
 * appear, which otherwise manifests as a 120s timeout deep in a helper).
 */
const openAdminContactsTab = async (page: Page): Promise<void> => {
  await gotoProtected(page, '/admin');
  await expect(page, 'Expected /admin — landed elsewhere (missing REPT_ADMIN role?)').toHaveURL(
    /\/admin(?:\?|$|#)/,
    { timeout: 15_000 },
  );

  const adminTabs = page.getByRole('tablist', { name: 'Admin sections' });
  await expect(adminTabs).toBeVisible({ timeout: 15_000 });
  await adminTabs.getByRole('tab', { name: 'Contacts', exact: true }).click();
};

/**
 * Create a contact via Admin → Contacts. Returns the displayName the row
 * shows so callers can find it later.
 */
export const createAdminContact = async (
  page: Page,
  opts: { firstName: string; lastName: string; companyName?: string },
): Promise<string> => {
  await openAdminContactsTab(page);

  // The trigger button is outside any modal; the modal also contains a
  // "Create" submit, so we have to scope each.
  await page.getByRole('button', { name: 'Add contact', exact: true }).click();

  const modal = page.getByRole('dialog', { name: /add contact/i });
  await expect(modal).toBeVisible({ timeout: 10_000 });

  await modal.locator('#contact-first').fill(opts.firstName);
  await modal.locator('#contact-last').fill(opts.lastName);
  if (opts.companyName) {
    await modal.locator('#contact-company').fill(opts.companyName);
  }
  await modal.locator('#contact-address').fill('123 E2E Lane');
  await modal.locator('#contact-city').fill('Victoria');
  await modal.locator('#contact-province').fill('BC');
  await modal.locator('#contact-country').fill('Canada');
  await modal.locator('#contact-postal').fill('V8W2A4');

  await modal.getByRole('button', { name: /^create$/i }).click();
  await expect(modal).toBeHidden({ timeout: 30_000 });

  const displayName = `${opts.firstName} ${opts.lastName}`;
  await expect(page.locator('tr', { hasText: displayName }).first()).toBeVisible({
    timeout: 30_000,
  });

  return displayName;
};

/**
 * Delete a contact from Admin → Contacts by its displayName. Idempotent —
 * silently returns if the page is already closed (cleanup-in-finally after
 * the test failed) or the row isn't currently in the list.
 */
export const deleteAdminContact = async (page: Page, displayName: string): Promise<void> => {
  if (page.isClosed()) {
    return;
  }

  try {
    if (!page.url().includes('/admin')) {
      await openAdminContactsTab(page);
    }

    // Narrow the list to the contact so the row is on-screen.
    const lastName = displayName.split(' ').slice(1).join(' ');
    if (lastName) {
      await page.locator('#contact-filter-last').fill(lastName);
    }

    const row = page.locator('tr', { hasText: displayName }).first();
    if ((await row.count()) === 0) {
      return;
    }

    await row.getByLabel(`Delete ${displayName}`).click();

    const confirmDialog = page.getByRole('dialog', { name: /delete contact/i });
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
    await confirmDialog.getByRole('button', { name: /^delete$/i }).click();

    await expect(row).toHaveCount(0, { timeout: 30_000 });
  } catch (err) {
    // Cleanup helper — don't let a cleanup failure mask the real test error.
    if (!page.isClosed()) {
      // eslint-disable-next-line no-console
      console.warn(`deleteAdminContact("${displayName}") failed during cleanup: ${err}`);
    }
  }
};
