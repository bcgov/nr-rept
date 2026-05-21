import { expect, test } from '@playwright/test';

import { openFirstProject, openProjectTab } from './helpers/project';
import { createProperty, deleteProperty } from './helpers/property';
import { uniqueSuffix } from './utils';

/**
 * Create a Property under an existing project, drive an edit + save on each
 * of the four editable sub-tabs (Details, Milestones, Registration,
 * Expropriation), then delete the property. The Contacts sub-tab is left as
 * a smoke click because its full CRUD lives in `property-contact-crud.spec.ts`.
 *
 * Each sub-tab uses the same Edit → modify one field → Save pattern. The
 * post-save assertion is that the read-only view returns (Edit button
 * reappears) — meaning the mutation succeeded and the form unmounted.
 */
test('property: create, edit each sub-tab, then delete', async ({ page }) => {
  await openFirstProject(page);
  await openProjectTab(page, 'Properties');

  const pidFormatted = await createProperty(page);

  try {
    const propertySubTabs = page.getByRole('tablist', { name: 'Property sub-sections' });

    // `createProperty` only waits for the new row in the table — the
    // `useReptPropertyComposite` queries (details, milestones, etc.) still
    // need to come back before the Edit button renders. Each sub-tab below
    // does the same wait: assert Edit is enabled before clicking, so a slow
    // Oracle response surfaces as a clear timeout instead of consuming the
    // full 180s test budget on a generic click hang.
    const editButton = () => page.getByRole('button', { name: /^edit$/i });
    const saveButton = () => page.getByRole('button', { name: /^save$/i });

    // Details — edit Property Address (plain text, not required).
    await propertySubTabs.getByRole('tab', { name: 'Details', exact: true }).click();
    await expect(editButton()).toBeEnabled({ timeout: 60_000 });
    await editButton().click();
    const addressValue = `E2E address ${uniqueSuffix()}`;
    await page.locator('#parcelAddress').fill(addressValue);
    await saveButton().click();
    await expect(editButton()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(addressValue)).toBeVisible({ timeout: 10_000 });

    // Milestones — set Owner Contact Date.
    await propertySubTabs.getByRole('tab', { name: 'Milestones', exact: true }).click();
    await expect(editButton()).toBeEnabled({ timeout: 60_000 });
    await editButton().click();
    await page.locator('#ownerContactDate').fill('2026-02-15');
    await saveButton().click();
    await expect(editButton()).toBeVisible({ timeout: 30_000 });

    // Registration — upserts a registration record on this property.
    await propertySubTabs.getByRole('tab', { name: 'Registration', exact: true }).click();
    await expect(editButton()).toBeEnabled({ timeout: 60_000 });
    await editButton().click();
    await page.locator('#ltoPlanNumber').fill('E2E-PLAN');
    await saveButton().click();
    await expect(editButton()).toBeVisible({ timeout: 30_000 });

    // Expropriation — upserts an expropriation record on this property.
    await propertySubTabs.getByRole('tab', { name: 'Expropriation', exact: true }).click();
    await expect(editButton()).toBeEnabled({ timeout: 60_000 });
    await editButton().click();
    await page.locator('#executiveApprovalDate').fill('2026-03-15');
    await saveButton().click();
    await expect(editButton()).toBeVisible({ timeout: 30_000 });

    // Contacts — smoke click only; full CRUD lives in property-contact-crud.
    await propertySubTabs.getByRole('tab', { name: 'Contacts', exact: true }).click();
  } finally {
    await deleteProperty(page, pidFormatted);
    await expect(page.locator('tr', { hasText: pidFormatted })).toHaveCount(0, {
      timeout: 30_000,
    });
  }
});
