import { expect, type Page } from '@playwright/test';

import { gotoProtected } from '../utils';

/**
 * Submit an empty project search and click the first result, returning the
 * project ID parsed from the URL.
 */
export const openFirstProject = async (page: Page): Promise<string> => {
  await gotoProtected(page, '/projects');

  await page.getByRole('button', { name: /^search$/i }).click();

  // Bumped from 30s — the project search query joins across multiple Oracle
  // tables and routinely runs 30–60s when the backend is reached over the
  // BC Gov VPN (i.e. anyone running `E2E_BASE_URL=http://localhost:3000`
  // against a locally-running Spring Boot). The deployed dev/test backend
  // sits in the same network as Oracle and finishes in seconds, so the
  // longer ceiling is harmless in CI.
  const firstProjectLink = page.locator('a.project-search__link').first();
  await firstProjectLink.waitFor({ state: 'visible', timeout: 90_000 });

  await firstProjectLink.click();

  await page.waitForURL(/\/projects\/\d+/, { timeout: 90_000 });

  const match = page.url().match(/\/projects\/(\d+)/);
  expect(match, 'project URL should contain a numeric id').not.toBeNull();
  return match![1];
};

/**
 * Click a tab in the project detail tab bar by visible label. Always scopes
 * to the project-level tablist so we don't accidentally match a Property
 * sub-tab with the same name (e.g. "Contacts").
 */
export const openProjectTab = async (
  page: Page,
  label: 'Summary' | 'History' | 'Acquisition Request' | 'Properties' | 'Contacts' | 'Agreements',
): Promise<void> => {
  await page
    .getByRole('tablist', { name: 'Project sections' })
    .getByRole('tab', { name: label, exact: true })
    .click();
};
