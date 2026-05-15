import { expect, test } from '@playwright/test';

import { openFirstProject, openProjectTab } from './helpers/project';
import { createProperty, deleteProperty } from './helpers/property';

/**
 * Create a Property under an existing project, walk its sub-tabs, then
 * delete it. Uses the first project returned by an empty search.
 */
test('property: create then delete', async ({ page }) => {
  await openFirstProject(page);
  await openProjectTab(page, 'Properties');

  const pidFormatted = await createProperty(page);

  try {
    // The new property is auto-selected; walk its sub-tabs to make sure the
    // detail panes load. Scope to the Property tablist so the same tab names
    // on the parent Project tab bar don't collide.
    const propertySubTabs = page.getByRole('tablist', { name: 'Property sub-sections' });
    for (const tabLabel of ['Details', 'Milestones', 'Registration', 'Expropriation', 'Contacts']) {
      await propertySubTabs.getByRole('tab', { name: tabLabel, exact: true }).click();
    }
  } finally {
    await deleteProperty(page, pidFormatted);
    await expect(page.locator('tr', { hasText: pidFormatted })).toHaveCount(0, {
      timeout: 30_000,
    });
  }
});
