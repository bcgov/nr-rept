import { expect, test, type Page } from '@playwright/test';

import { openFirstProject } from './helpers/project';
import { gotoProtected } from './utils';

/**
 * Smoke check that every protected route renders without throwing. We don't
 * assert deep UI state — just that the page mounts and the global error
 * boundary doesn't take over.
 */

const assertNoGlobalError = async (page: Page) => {
  // GlobalErrorPage renders this heading; if we see it, the page crashed.
  await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0);
};

test.describe('page coverage', () => {
  test('dashboard renders', async ({ page }) => {
    await gotoProtected(page, '/dashboard');
    await expect(page.getByTestId('side-nav-link-Dashboard')).toBeVisible();
    await assertNoGlobalError(page);
  });

  test('project search renders', async ({ page }) => {
    await gotoProtected(page, '/projects');
    await expect(page.getByRole('button', { name: /^search$/i })).toBeVisible();
    await assertNoGlobalError(page);
  });

  test('add project file form renders (REPT_ADMIN)', async ({ page }) => {
    await gotoProtected(page, '/projects/create');
    // Either the create form is visible or we got bounced to /unauthorized.
    // Both outcomes mean the route mounted without crashing.
    await expect(page).toHaveURL(/\/projects\/create|\/unauthorized/);
    await assertNoGlobalError(page);
  });

  test('reports landing renders', async ({ page }) => {
    await gotoProtected(page, '/reports');
    await expect(page.getByTestId('side-nav-link-Reports')).toBeVisible();
    await assertNoGlobalError(page);
  });

  test('admin renders (REPT_ADMIN)', async ({ page }) => {
    await gotoProtected(page, '/admin');
    await expect(page).toHaveURL(/\/admin|\/unauthorized/);
    await assertNoGlobalError(page);
  });

  test('404 renders for unknown route', async ({ page }) => {
    await gotoProtected(page, '/this-route-does-not-exist');
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
    await assertNoGlobalError(page);
  });

  test('project detail + every project tab renders', async ({ page }) => {
    const projectId = await openFirstProject(page);
    expect(projectId).toMatch(/^\d+$/);

    // Scope to the project-level tablist — visiting Properties auto-selects a
    // property whose own "Contacts" sub-tab would otherwise collide here.
    const projectTabs = page.getByRole('tablist', { name: 'Project sections' });

    for (const label of [
      'Summary',
      'History',
      'Acquisition Request',
      'Properties',
      'Contacts',
      'Agreements',
    ] as const) {
      await projectTabs.getByRole('tab', { name: label, exact: true }).click();
      await assertNoGlobalError(page);
    }
  });

  // Note: /reports/:reportId isn't actually reachable from the UI right now
  // (the landing page uses an accordion that inlines ReportConfigForm rather
  // than linking out). Coverage for the report-generation flow lives in
  // reports.spec.ts, which exercises every report on the landing page end
  // to end and verifies the API returns a real PDF.
});
