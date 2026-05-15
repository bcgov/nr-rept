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
 * Create a contact via Admin → Contacts. The form's validator enforces XOR
 * on the name: either (firstName + lastName) OR companyName — never all
 * three — so the discriminated `kind` field forces a choice.
 *
 * Returns the displayName the row shows so callers can find it later.
 */
export type CreateAdminContactOpts =
  | { kind: 'person'; firstName: string; lastName: string }
  | { kind: 'company'; companyName: string };

export const createAdminContact = async (
  page: Page,
  opts: CreateAdminContactOpts,
): Promise<string> => {
  await openAdminContactsTab(page);

  // The trigger button is outside any modal; the modal also contains a
  // "Create" submit, so we have to scope each.
  await page.getByRole('button', { name: 'Add contact', exact: true }).click();

  const modal = page.getByRole('dialog', { name: /add contact/i });
  await expect(modal).toBeVisible({ timeout: 10_000 });

  if (opts.kind === 'person') {
    await modal.locator('#contact-first').fill(opts.firstName);
    await modal.locator('#contact-last').fill(opts.lastName);
  } else {
    await modal.locator('#contact-company').fill(opts.companyName);
  }
  await modal.locator('#contact-address').fill('123 E2E Lane');
  await modal.locator('#contact-city').fill('Victoria');
  await modal.locator('#contact-province').fill('BC');
  await modal.locator('#contact-country').fill('Canada');
  await modal.locator('#contact-postal').fill('V8W2A4');

  await modal.getByRole('button', { name: /^create$/i }).click();
  await expect(modal).toBeHidden({ timeout: 30_000 });

  // Backend formats person contacts as "LastName, FirstName" (used in the
  // table cell and in the row's delete-button aria-label).
  const displayName =
    opts.kind === 'person' ? `${opts.lastName}, ${opts.firstName}` : opts.companyName;
  await expect(page.locator('tr', { hasText: displayName }).first()).toBeVisible({
    timeout: 30_000,
  });

  return displayName;
};

/** "LastName, FirstName" / "CompanyName" — matches the backend's format. */
export const adminContactDisplayName = (opts: CreateAdminContactOpts): string =>
  opts.kind === 'person' ? `${opts.lastName}, ${opts.firstName}` : opts.companyName;

/**
 * Delete an admin contact. Takes the original create-opts so it can both
 * derive the right displayName format AND narrow the list with the correct
 * filter field. Idempotent — silently returns if the page is already closed
 * (cleanup-in-finally after the test failed) or the row isn't present.
 */
export const deleteAdminContact = async (
  page: Page,
  opts: CreateAdminContactOpts,
): Promise<void> => {
  if (page.isClosed()) {
    return;
  }

  const displayName = adminContactDisplayName(opts);

  try {
    if (!page.url().includes('/admin')) {
      await openAdminContactsTab(page);
    }

    // Narrow the list to the contact so the row is on-screen.
    if (opts.kind === 'person') {
      await page.locator('#contact-filter-last').fill(opts.lastName);
    } else {
      // No filter selector wired for company-only contacts here; rely on the
      // displayName match.
    }

    const row = page.locator('tr', { hasText: displayName }).first();
    if ((await row.count()) === 0) {
      return;
    }

    await row.getByLabel(`Delete ${displayName}`).click();

    const confirmDialog = page.getByRole('dialog', { name: /delete contact/i });
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
    // Carbon's danger button has accessible name "danger Delete" (visually-
    // hidden icon label), so we can't anchor the regex to `^delete$`.
    await confirmDialog.getByRole('button', { name: /\bdelete$/i }).click();

    await expect(row).toHaveCount(0, { timeout: 30_000 });
  } catch (err) {
    // Cleanup helper — don't let a cleanup failure mask the real test error.
    if (!page.isClosed()) {
      // eslint-disable-next-line no-console
      console.warn(`deleteAdminContact("${displayName}") failed during cleanup: ${err}`);
    }
  }
};
