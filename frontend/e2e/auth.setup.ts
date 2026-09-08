import { existsSync, writeFileSync } from 'node:fs';

import { test as setup, expect } from '@playwright/test';

import { SESSION_STORAGE_STATE, STORAGE_STATE } from './utils';

/**
 * Auth setup. Runs once per `playwright test` invocation, as a dependency of
 * every browser project. Three behaviours, in priority order:
 *
 *   1. Both saved-state files already exist → do nothing (cached state).
 *   2. E2E_IDIR_USER + E2E_IDIR_PASSWORD are set → drive the IDIR login
 *      programmatically. See the MFA note below before relying on this.
 *   3. Neither of the above → fall back to the interactive flow: open the
 *      headed browser and wait up to 5 minutes for a human to complete the
 *      IDIR sign-in. Used locally via `npm run e2e:login`.
 *
 * Re-run `npm run e2e:login` whenever the saved tokens expire (symptom: tests
 * bouncing to the login domain or hitting 401s). **That window is now 30
 * minutes, not 60** — the BC Gov SSO refresh token is half the life of the
 * Cognito one it replaced, so cached state goes stale twice as fast.
 *
 * ## Programmatic login and MFA
 *
 * REPT signs in through the standard realm's **IDIR - MFA** integration, which
 * federates to Azure AD and can require a second factor. A second factor is, by
 * design, not something a stored password can satisfy — so the programmatic
 * path below works only for an account whose MFA is satisfied without
 * interaction (a CI service account with a conditional-access exemption). It is
 * left in place because that arrangement is the usual one, but if CI starts
 * timing out at the Microsoft sign-in page, this is why, and no selector change
 * will fix it.
 */
setup('authenticate via IDIR', async ({ page, context }) => {
  // Both halves are required. The tokens live in sessionStorage, so a stale
  // user.json on its own is not a session — see e2e/utils.ts.
  if (existsSync(STORAGE_STATE) && existsSync(SESSION_STORAGE_STATE)) {
    return;
  }

  const idirUser = process.env.E2E_IDIR_USER;
  const idirPassword = process.env.E2E_IDIR_PASSWORD;
  const programmatic = Boolean(idirUser && idirPassword);

  await page.goto('/');
  await page.getByTestId('landing-button__idir').click();

  if (programmatic) {
    // The sign-in pages are on other origins: Keycloak (loginproxy) hands off
    // to Azure AD (login.microsoftonline.com) because of the `azureidir` IdP
    // hint. The Microsoft form is what the selectors below target — the old
    // Siteminder/Logon7 `input[name="user"]` fields belonged to Cognito's
    // federation path and no longer appear.
    await page.waitForURL(/loginproxy|login\.microsoftonline\.com|logon/i, { timeout: 60_000 });

    await page.locator('input[type="email"], input[name="loginfmt"]').first().fill(idirUser!);
    await page.locator('input[type="submit"], button[type="submit"]').first().click();

    await page.locator('input[type="password"], input[name="passwd"]').first().fill(idirPassword!);
    await page.locator('input[type="submit"], button[type="submit"]').first().click();

    // "Stay signed in?" — dismissed when it appears, absent otherwise.
    await page
      .locator('input#idBtn_Back, input[value="No"]')
      .first()
      .click({ timeout: 5_000 })
      .catch(() => undefined);
  }

  // Whether interactive or programmatic, wait for the redirect back to
  // /dashboard. The route now passes through /authCallback, where the
  // authorization code is exchanged before the app replaces the URL.
  // Interactive flow gets 5 min for a human; programmatic gets 2.
  await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), {
    timeout: programmatic ? 2 * 60_000 : 5 * 60_000,
  });

  // Sanity check: the side menu should render once auth + roles resolve.
  await expect(page.getByTestId('side-nav-link-Project Search')).toBeVisible({
    timeout: 30_000,
  });

  await context.storageState({ path: STORAGE_STATE });

  // Saved separately because Playwright's storageState does not capture
  // sessionStorage, and that is where the tokens are.
  const session = await page.evaluate(() => JSON.stringify(window.sessionStorage));
  writeFileSync(SESSION_STORAGE_STATE, session);
});
