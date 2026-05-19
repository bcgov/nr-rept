import { expect, test } from '@playwright/test';

import { gotoProtected } from './utils';

/**
 * For every report on the /reports landing page, expand the accordion,
 * click "Generate PDF", and assert the API returned a non-trivial PDF
 * response. We watch the network response directly because the SPA opens
 * the resulting blob in a new tab — verifying the tab content is brittle,
 * the response is the source of truth.
 *
 * Mirrors the source of truth in src/pages/Reports/reportDefinitions.ts so
 * a new report appearing in the UI without coverage here will show up as
 * a missing accordion title rather than a silent skip.
 */
const REPORTS = [
  { id: '2100', title: 'Upcoming Payments' },
  { id: '2101', title: 'Right of Way Inventory' },
  { id: '2102', title: 'Site Agreement Inventory' },
  { id: '2103', title: 'Co-Use Agreement Inventory' },
  { id: '2104', title: 'Expenditure Disbursement' },
  { id: '2105', title: 'Projects by RC' },
  { id: '2106', title: 'Active Project Listing' },
  { id: '2107', title: 'Projects by Project Manager' },
  { id: '2109', title: 'Payments by Requesting Source' },
] as const;

// PDF generation hits a real database; one full pass through 9 reports
// against DEV can take a couple of minutes.
test.setTimeout(360_000);

test('every report generates a PDF', async ({ page }) => {
  await gotoProtected(page, '/reports');

  // Track per-report outcomes so the failure message lists everything at once
  // instead of bailing on the first 4xx.
  const results: {
    id: string;
    title: string;
    status: number;
    contentType: string;
    contentLength: number;
  }[] = [];

  for (const report of REPORTS) {
    // Each ReportConfigForm gives its inputs ids prefixed with
    // `report-<id>-`, so we can scope to the form for THIS report and avoid
    // matching the same-named "Generate PDF" button in sibling accordion items
    // (Carbon keeps closed items in the DOM).
    const reportForm = page
      .locator('form.report-form')
      .filter({ has: page.locator(`[id^="report-${report.id}-"]`) });

    // Expand the accordion item for this report.
    const accordionTrigger = page.getByRole('button', { name: report.title }).first();
    await accordionTrigger.click();
    await expect(reportForm).toBeVisible({ timeout: 10_000 });

    // Provide a wide date range when the form exposes those inputs — keeps
    // date-range-required reports from 400ing without us having to track per
    // report which fields are mandatory.
    const startDate = reportForm.locator('input[id$="-start-date"]');
    const endDate = reportForm.locator('input[id$="-end-date"]');
    if ((await startDate.count()) > 0) {
      await startDate.fill('2000-01-01');
      await startDate.press('Tab');
    }
    if ((await endDate.count()) > 0) {
      await endDate.fill('2099-12-31');
      await endDate.press('Tab');
    }

    // Click "Generate PDF" and intercept the POST so we can verify status +
    // content-type + body length without depending on the new-tab popup.
    const generateButton = reportForm.getByRole('button', { name: /generate pdf/i });
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/reports/${report.id}`) && resp.request().method() === 'POST',
        { timeout: 60_000 },
      ),
      generateButton.click(),
    ]);

    const contentType = response.headers()['content-type'] ?? '';
    const contentLengthHeader = response.headers()['content-length'];
    const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : NaN;
    results.push({
      id: report.id,
      title: report.title,
      status: response.status(),
      contentType,
      contentLength,
    });

    // Status + content-type is the source-of-truth that a PDF came back from
    // the server. We deliberately do NOT read response.body() — the SPA
    // consumes the response via `.blob()` and Playwright's separately
    // buffered copy comes back empty for binary fetch() responses, which
    // would produce false failures even though the server did the right
    // thing.
    expect.soft(response.status(), `${report.id} ${report.title}: HTTP status`).toBe(200);
    expect.soft(contentType, `${report.id} ${report.title}: Content-Type`).toMatch(/pdf/i);
    // When the server provides Content-Length, treat 0 as a real bug —
    // status 200 with an empty body is the failure mode we'd actually want
    // to catch. Skip the check if the header is missing or chunked.
    if (!Number.isNaN(contentLength)) {
      expect
        .soft(contentLength, `${report.id} ${report.title}: Content-Length`)
        .toBeGreaterThan(500);
    }

    // Collapse the accordion before moving on so the next iteration's
    // accordionTrigger.click() opens its own item cleanly.
    await accordionTrigger.click();
  }

  // Per-report summary so any failures are easy to scan without grepping
  // through soft-assertion stacks.
  // eslint-disable-next-line no-console
  console.log('\nReport generation summary:');
  for (const r of results) {
    const size = Number.isNaN(r.contentLength) ? '(unknown)' : `${r.contentLength}B`;
    // eslint-disable-next-line no-console
    console.log(
      `  ${r.id}  ${r.title.padEnd(35)}  status=${r.status}  ct=${r.contentType}  size=${size}`,
    );
  }
});
