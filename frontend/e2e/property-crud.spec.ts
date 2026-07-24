import { expect, test } from './fixtures';
import { openFirstProject, openProjectTab } from './helpers/project';
import { createProperty, deleteProperty } from './helpers/property';
import { uniqueSuffix } from './utils';

/**
 * Create a Property under an existing project, walk its five sub-tabs, drive
 * one Edit → modify → Save round-trip on the Details sub-tab to lock in the
 * edit flow, then delete the property. The other sub-tabs stay as smoke
 * clicks: each property mutation invalidates `reptKeys.properties(projectId)`
 * (the project's whole property-list query — the heavy Oracle join), and
 * doing four list-refetches against a property we're about to delete blew
 * past the global 180s test budget. Per-sub-tab edit/save coverage should
 * live in its own spec where the property under test isn't on the chopping
 * block.
 */
test('property: create, smoke-click sub-tabs, edit details, then delete', async ({ page }) => {
  await openFirstProject(page);
  await openProjectTab(page, 'Properties');

  const pidFormatted = await createProperty(page);

  try {
    const propertySubTabs = page.getByRole('tablist', { name: 'Property sub-sections' });

    // Walk every sub-tab so each panel mounts and exercises its read query.
    for (const tabLabel of ['Details', 'Milestones', 'Registration', 'Expropriation', 'Contacts']) {
      await propertySubTabs.getByRole('tab', { name: tabLabel, exact: true }).click();
    }

    // Edit/Save on Details only — `createProperty` waited for the new row in
    // the table, but `useReptPropertyComposite` still needs a moment, so wait
    // for the Edit button to be enabled before clicking it.
    await propertySubTabs.getByRole('tab', { name: 'Details', exact: true }).click();
    const editButton = page.getByRole('button', { name: /^edit$/i });
    await expect(editButton).toBeEnabled({ timeout: 60_000 });
    await editButton.click();

    const addressValue = `E2E address ${uniqueSuffix()}`;
    await page.locator('#parcelAddress').fill(addressValue);

    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(editButton).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(addressValue)).toBeVisible({ timeout: 10_000 });
  } finally {
    await deleteProperty(page, pidFormatted);
    await expect(page.locator('tr', { hasText: pidFormatted })).toHaveCount(0, {
      timeout: 30_000,
    });
  }
});
