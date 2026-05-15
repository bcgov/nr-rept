import { existsSync } from 'node:fs';

import { test as setup, expect } from '@playwright/test';

import { STORAGE_STATE } from './utils';

/**
 * Auth setup — runs once per `playwright test` invocation, as a dependency
 * of every browser project. Behaviour:
 *
 *   • If e2e/.auth/user.json already exists, do nothing and let the browser
 *     projects load it via `storageState`. Cheap no-op on every CI/local run
 *     after the initial login.
 *   • Otherwise, drive the IDIR sign-in interactively and save the result.
 *     This branch only works when invoked headed (`npm run e2e:login`,
 *     which also wipes any stale state first via its `pree2e:login` hook).
 *
 * Re-run `npm run e2e:login` whenever the Cognito tokens expire (symptom:
 * tests start bouncing to the IDIR domain or hit 401s).
 */
setup('authenticate via IDIR', async ({ page }) => {
  if (existsSync(STORAGE_STATE)) {
    return;
  }

  await page.goto('/');

  await page.getByTestId('landing-button__idir').click();

  // Hand control to the human — finish IDIR + MFA, app redirects to /dashboard.
  // We wait up to 5 minutes for that to happen.
  await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), {
    timeout: 5 * 60_000,
  });

  // Sanity check: the side menu should render once auth + roles resolve.
  await expect(page.getByTestId('side-nav-link-Project Search')).toBeVisible({
    timeout: 30_000,
  });

  await page.context().storageState({ path: STORAGE_STATE });
});
