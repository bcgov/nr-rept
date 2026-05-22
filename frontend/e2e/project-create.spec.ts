import { expect, test, type Locator } from '@playwright/test';

import { openProjectTab } from './helpers/project';
import { createProperty } from './helpers/property';
import { gotoProtected, uniqueSuffix } from './utils';

/**
 * End-to-end coverage for the project lifecycle. Each test in the serial
 * block depends on the project created by the first one — Playwright's
 * `describe.serial` keeps module-scoped state intact across tests and stops
 * the chain if any earlier test fails.
 *
 * There is no UI affordance to delete a project, so each run leaves a row
 * behind named `E2E Project <suffix>` to make the residue easy to spot.
 */
test.describe.serial('project lifecycle', () => {
  let projectId = '';
  let projectName = '';
  let propertyPid = '';

  /** Fill a Carbon input/textarea only if it's actually rendered. */
  const fillIfVisible = async (locator: Locator, value: string) => {
    if (await locator.isVisible().catch(() => false)) {
      await locator.fill(value);
    }
  };

  test('create project file', async ({ page }) => {
    projectName = `E2E Project ${uniqueSuffix()}`;

    await gotoProtected(page, '/projects/create');
    await expect(page).not.toHaveURL(/\/unauthorized/);

    const submit = page.getByRole('button', { name: /create project file/i });
    await expect(submit).toBeEnabled({ timeout: 60_000 });

    await page.locator('#project-create-prefix').selectOption({ index: 1 });

    const suffix = page.locator('#project-create-suffix');
    await expect(suffix).toBeEnabled({ timeout: 30_000 });
    await suffix.selectOption({ index: 1 });

    await page.locator('#project-create-name').fill(projectName);
    await page.locator('#project-create-region').selectOption({ index: 1 });
    await page.locator('#project-create-district').selectOption({ index: 1 });
    await page.locator('#project-create-requesting-source').selectOption({ index: 1 });

    await submit.click();

    await page.waitForURL(/\/projects\/\d+/, { timeout: 60_000 });
    const match = page.url().match(/\/projects\/(\d+)/);
    expect(match, 'project URL should contain a numeric id').not.toBeNull();
    projectId = match![1];
  });

  test('History tab: edit and save', async ({ page }) => {
    expect(projectId, 'create step must populate projectId').not.toBe('');

    await gotoProtected(page, `/projects/${projectId}`);
    await openProjectTab(page, 'History');

    await page.getByRole('button', { name: /^edit$/i }).click();

    // `#projectHistory` is the largest free-text field on the form; one save
    // round-trip on it is enough to confirm the History edit path works.
    const historyValue = `E2E history note ${uniqueSuffix()}`;
    await page.locator('#projectHistory').fill(historyValue);

    await page.getByRole('button', { name: /^save$/i }).click();

    // After save the panel flips back to read-only; the value should be
    // visible there. Scope to a region that won't pick up unrelated chrome.
    await expect(page.getByRole('button', { name: /^edit$/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(historyValue)).toBeVisible({ timeout: 10_000 });
  });

  test('Acquisition Request tab: create', async ({ page }) => {
    expect(projectId, 'create step must populate projectId').not.toBe('');

    await gotoProtected(page, `/projects/${projectId}`);
    await openProjectTab(page, 'Acquisition Request');

    // Fresh projects have no acquisition request, so the empty state is
    // expected. Click through to the create form.
    await page.getByRole('button', { name: /create acquisition request/i }).click();

    // Required selects: pick first non-placeholder option.
    await page.locator('#acquisitionTypeCode').selectOption({ index: 1 });

    // Wait for funding options to populate alongside acquisition types.
    const funding = page.locator('#fundingCode');
    await expect(funding).toBeEnabled({ timeout: 30_000 });
    await funding.selectOption({ index: 1 });

    // Required dates (no defaults on this form). Two-digit zero-padding so the
    // string round-trips through flatpickr cleanly.
    await page.locator('#receivedDate').fill('2026-01-15');
    await page.locator('#targetCompletionDate').fill('2026-12-31');

    // Required free-text / numeric fields.
    await page.locator('#justification').fill('E2E justification');
    await page.locator('#propertiesDescription').fill('E2E properties description');
    await page.locator('#timberVolumeAccessed').fill('100');
    await page.locator('#responsibilityCentre').fill('E2E-RC');
    await page.locator('#serviceLine').fill('E2E-SL');
    await page.locator('#availableFunds').fill('5000');
    await page.locator('#stob').fill('E2E');

    await page.getByRole('button', { name: /^save$/i }).click();

    // On success the form flips back to view mode (Edit button reappears).
    await expect(page.getByRole('button', { name: /^edit$/i })).toBeVisible({ timeout: 30_000 });
  });

  test('Agreements tab: add agreement', async ({ page }) => {
    expect(projectId, 'create step must populate projectId').not.toBe('');

    await gotoProtected(page, `/projects/${projectId}`);
    await openProjectTab(page, 'Agreements');

    await page.getByRole('button', { name: /add agreement/i }).click();

    await page.locator('#new-agreement-type').selectOption('ACQUISITION');

    // Agreement method options are filtered by the selected type; wait for
    // the select to become enabled before picking.
    const code = page.locator('#new-agreement-code');
    await expect(code).toBeEnabled({ timeout: 30_000 });
    await code.selectOption({ index: 1 });

    // Some agreement codes (LEA/LOO/ROW/SLS/COM) light up extra required
    // fields. Fill any that render — `fillIfVisible` no-ops when they don't.
    await fillIfVisible(page.locator('#new-agreement-term'), '12');
    await fillIfVisible(page.locator('#new-agreement-bring-forward'), '2026-02-01');
    await fillIfVisible(page.locator('#new-agreement-anniversary'), '2027-01-15');
    await fillIfVisible(page.locator('#new-agreement-renegotiation'), '2028-01-15');
    await fillIfVisible(page.locator('#new-agreement-commitment'), 'E2E commitment description');

    await page.getByRole('button', { name: /save agreement/i }).click();

    // On success the form unmounts and the new row appears in the agreements
    // table. The table renders with a radio input per row.
    await expect(page.locator('input[id^="agreement-select-"]').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  /**
   * Once an agreement row exists, the workspace below the table renders three
   * sub-tabs (Details / Properties / Payments). The next three tests walk
   * each at smoke depth: a Details edit/save round-trip, plus open/empty-
   * state checks for Properties and Payments since both go deep into CRUD
   * (link properties from a property pool, build a payment with payees) and
   * the lifecycle project has neither linked properties nor payees.
   */

  test('Agreements → Details sub-tab: edit and save', async ({ page }) => {
    expect(projectId, 'create step must populate projectId').not.toBe('');

    await gotoProtected(page, `/projects/${projectId}`);
    await openProjectTab(page, 'Agreements');

    // The previously-created agreement is auto-selected and Details is the
    // default sub-tab, so we land directly on the read-only Details panel.
    // Scope subsequent button lookups to that panel so we don't race against
    // Edit buttons that live in other (hidden) project tabs.
    const detailsPanel = page.locator('.agreement-details-tab');
    await expect(detailsPanel).toBeVisible({ timeout: 30_000 });

    const editButton = detailsPanel.getByRole('button', { name: /^edit$/i });
    await expect(editButton).toBeEnabled({ timeout: 30_000 });
    await editButton.click();

    // Carbon's Checkbox overlays the underlying <input> with a visible
    // .cds--checkbox-label-text span that intercepts pointer events; clicking
    // the input id hangs in actionability. Click the label text instead —
    // same fix the radio-button tests use.
    await page.getByText('Agreement active', { exact: true }).click();

    await page.getByRole('button', { name: /save details/i }).click();

    // Back to read-only.
    await expect(detailsPanel.getByRole('button', { name: /^edit$/i })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('Agreements → Properties sub-tab: opens', async ({ page }) => {
    expect(projectId, 'create step must populate projectId').not.toBe('');

    await gotoProtected(page, `/projects/${projectId}`);
    await openProjectTab(page, 'Agreements');

    const agreementSubTabs = page.getByRole('tablist', { name: 'Agreement sections' });
    await expect(agreementSubTabs).toBeVisible({ timeout: 30_000 });
    await agreementSubTabs.getByRole('tab', { name: 'Properties', exact: true }).click();

    // The lifecycle project has no properties yet, so this agreement has
    // none linked either — the empty-state notification should render.
    await expect(
      page.getByText(/not linked to any properties/i),
    ).toBeVisible({ timeout: 30_000 });
    // And the Link properties button is rendered (disabled because the
    // project has no properties to pick from).
    await expect(
      page.getByRole('button', { name: /link properties/i }),
    ).toBeVisible();
  });

  test('Agreements → Payments sub-tab: opens new-payment modal', async ({ page }) => {
    expect(projectId, 'create step must populate projectId').not.toBe('');

    await gotoProtected(page, `/projects/${projectId}`);
    await openProjectTab(page, 'Agreements');

    const agreementSubTabs = page.getByRole('tablist', { name: 'Agreement sections' });
    await expect(agreementSubTabs).toBeVisible({ timeout: 30_000 });
    await agreementSubTabs.getByRole('tab', { name: 'Payments', exact: true }).click();

    // Empty-state notification confirms the tab rendered.
    await expect(
      page.getByText(/no payments recorded for this agreement/i),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /new payment/i }).click();

    const paymentModal = page.getByRole('dialog', { name: /new payment/i });
    await expect(paymentModal).toBeVisible({ timeout: 10_000 });

    // No property contacts exist on the lifecycle project, so the payee
    // warning should surface — confirming the modal wired up its options.
    await expect(
      paymentModal.getByText(/a property contact is required/i),
    ).toBeVisible({ timeout: 30_000 });

    await paymentModal.getByRole('button', { name: /^cancel$/i }).click();
    await expect(paymentModal).toBeHidden({ timeout: 10_000 });
  });

  /**
   * Property + Property-sub-tab coverage piggy-backs on the lifecycle
   * project. Each property mutation invalidates `reptKeys.properties(...)`
   * (the heavy project property-list query), so chaining four Edit/Save
   * cycles in one test blows past Playwright's per-test budget — splitting
   * them into siblings gives each its own 180s window. There is no delete
   * step: the lifecycle project itself is never deleted, so leaving its
   * property behind matches the existing "no cleanup" gotcha.
   */

  test('property: create under lifecycle project', async ({ page }) => {
    expect(projectId, 'create step must populate projectId').not.toBe('');

    await gotoProtected(page, `/projects/${projectId}`);
    await openProjectTab(page, 'Properties');

    propertyPid = await createProperty(page);
    expect(propertyPid).toMatch(/^\d{3}-\d{3}-\d{3}$/);
  });

  /**
   * Helper used by all four sub-tab edit tests: navigate to the lifecycle
   * project's Properties tab and assert the just-created property is
   * present (it's auto-selected because it's the only property on this
   * fresh project). Each test then drives a single sub-tab Edit/Save.
   */
  const openPropertySubTab = async (page: import('@playwright/test').Page, subTab: string) => {
    await gotoProtected(page, `/projects/${projectId}`);
    await openProjectTab(page, 'Properties');
    await expect(page.locator('tr', { hasText: propertyPid })).toBeVisible({ timeout: 60_000 });
    const propertySubTabs = page.getByRole('tablist', { name: 'Property sub-sections' });
    await propertySubTabs.getByRole('tab', { name: subTab, exact: true }).click();
  };

  test('Property → Details: edit and save', async ({ page }) => {
    expect(propertyPid, 'property step must populate propertyPid').not.toBe('');

    await openPropertySubTab(page, 'Details');

    const editButton = page.getByRole('button', { name: /^edit$/i });
    await expect(editButton).toBeEnabled({ timeout: 60_000 });
    await editButton.click();

    const addressValue = `E2E address ${uniqueSuffix()}`;
    await page.locator('#parcelAddress').fill(addressValue);

    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(editButton).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(addressValue)).toBeVisible({ timeout: 10_000 });
  });

  test('Property → Milestones: edit and save', async ({ page }) => {
    expect(propertyPid, 'property step must populate propertyPid').not.toBe('');

    await openPropertySubTab(page, 'Milestones');

    const editButton = page.getByRole('button', { name: /^edit$/i });
    await expect(editButton).toBeEnabled({ timeout: 60_000 });
    await editButton.click();

    await page.locator('#ownerContactDate').fill('2026-02-15');

    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(editButton).toBeVisible({ timeout: 30_000 });
  });

  test('Property → Registration: upsert and save', async ({ page }) => {
    expect(propertyPid, 'property step must populate propertyPid').not.toBe('');

    await openPropertySubTab(page, 'Registration');

    const editButton = page.getByRole('button', { name: /^edit$/i });
    await expect(editButton).toBeEnabled({ timeout: 60_000 });
    await editButton.click();

    await page.locator('#ltoPlanNumber').fill('E2E-PLAN');

    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(editButton).toBeVisible({ timeout: 30_000 });
  });

  test('Property → Expropriation: upsert and save', async ({ page }) => {
    expect(propertyPid, 'property step must populate propertyPid').not.toBe('');

    await openPropertySubTab(page, 'Expropriation');

    const editButton = page.getByRole('button', { name: /^edit$/i });
    await expect(editButton).toBeEnabled({ timeout: 60_000 });
    await editButton.click();

    await page.locator('#executiveApprovalDate').fill('2026-03-15');

    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(editButton).toBeVisible({ timeout: 30_000 });
  });
});
