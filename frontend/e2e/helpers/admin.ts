import { expect, type Page } from '@playwright/test';

import { gotoProtected } from '../utils';

/**
 * Navigate to /admin and switch to the named tab. Fails fast if the saved auth
 * session lacks REPT_ADMIN (we'd be bounced to /unauthorized and the tabs would
 * never appear, which otherwise manifests as a slow timeout deep in a helper).
 *
 * The `tabName` must match the label rendered in `Admin/index.tsx`'s tab list —
 * e.g. "Contacts", "Co-users", "Requesting source", "Expense authority",
 * "Qualified receiver".
 */
export const openAdminTab = async (page: Page, tabName: string): Promise<void> => {
  await gotoProtected(page, '/admin');
  await expect(page, 'Expected /admin — landed elsewhere (missing REPT_ADMIN role?)').toHaveURL(
    /\/admin(?:\?|$|#)/,
    { timeout: 15_000 },
  );

  const adminTabs = page.getByRole('tablist', { name: 'Admin sections' });
  await expect(adminTabs).toBeVisible({ timeout: 15_000 });
  await adminTabs.getByRole('tab', { name: tabName, exact: true }).click();
};
