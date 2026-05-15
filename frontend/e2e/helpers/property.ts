import { expect, type Page } from '@playwright/test';

import { buildTestPid } from '../utils';

/**
 * Add a new Property to the currently-open project. Caller must already be
 * on the project's Properties tab. Returns the formatted PID so the row can
 * be found later.
 */
export const createProperty = async (page: Page): Promise<string> => {
  const pidDigits = buildTestPid();
  const pidFormatted = `${pidDigits.slice(0, 3)}-${pidDigits.slice(3, 6)}-${pidDigits.slice(6)}`;

  await page.getByRole('button', { name: 'Add Property' }).first().click();

  await page.locator('#parcelIdentifier').fill(pidDigits);
  await page.locator('select#landTitleOfficeCode').selectOption({ index: 1 });
  await page.locator('select#acquisitionCode').selectOption({ index: 1 });
  await page.locator('select#electoralDistrictCode').selectOption({ index: 1 });
  await page.locator('select#orgUnitNumber').selectOption({ index: 1 });
  await page.locator('#parcelArea').fill('1');
  await page.locator('#projectArea').fill('0.5');
  await page.locator('#city').fill('E2E Test City');
  await page.locator('#legalDescription').fill('E2E test legal description');

  await page.getByRole('button', { name: /create property/i }).click();

  await expect(page.locator('tr', { hasText: pidFormatted })).toBeVisible({
    timeout: 30_000,
  });

  return pidFormatted;
};

/**
 * Delete a property by formatted PID. Idempotent — returns silently if the
 * page is closed or the row isn't present.
 */
export const deleteProperty = async (page: Page, pidFormatted: string): Promise<void> => {
  if (page.isClosed()) {
    return;
  }

  try {
    const row = page.locator('tr', { hasText: pidFormatted });
    if ((await row.count()) === 0) {
      return;
    }
    await row.getByLabel('Delete property').click();

    const confirmDialog = page.getByRole('dialog', { name: /delete property/i });
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
    await confirmDialog.getByRole('button', { name: /^delete$/i }).click();

    await expect(row).toHaveCount(0, { timeout: 30_000 });
  } catch (err) {
    if (!page.isClosed()) {
      // eslint-disable-next-line no-console
      console.warn(`deleteProperty("${pidFormatted}") failed during cleanup: ${err}`);
    }
  }
};
