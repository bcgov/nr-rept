# Playwright E2E

These tests hit a real REPT backend. They default to the deployed **DEV**
environment (`https://rept-a582fc-dev.apps.silver.devops.gov.bc.ca`); override
with `E2E_BASE_URL=...` to point at local dev or another deployed env.

## One-time auth bootstrap

Cognito + BC Gov IDIR can't be scripted headlessly. Run the setup project
once interactively to capture an authenticated session:

```bash
npm run e2e:login
```

A Chromium window opens, navigates to the landing page, and clicks **Log in
with IDIR**. Finish the IDIR sign-in (and any MFA) by hand. Once the app
lands on `/dashboard`, the session is saved to `e2e/.auth/user.json` (gitignored).

Re-run `npm run e2e:login` whenever the saved session expires — you'll know
because tests start bouncing back to the IDIR domain or seeing 401s.

## Running the suite

```bash
npm run e2e            # chromium only (default)
npm run e2e:all-browsers   # chromium + chrome + firefox + safari + edge
npm run e2e:ui         # Playwright's interactive UI
npm run e2e:report     # open the last HTML report
```

All non-setup projects depend on `setup`, so Playwright will yell if you
haven't run the login bootstrap yet.

## What's covered

- **`smoke.spec.ts`** — visits every protected route (`/dashboard`,
  `/projects`, `/projects/create`, `/admin`, `/reports`, `/reports/:id`)
  plus the 404 path, walks all six project-detail tabs on the first listed
  project, and asserts the global error boundary never takes over.
- **`property-crud.spec.ts`** — picks the first project, creates a Property
  with the minimum-required fields, walks its sub-tabs, then deletes it.
- **`property-contact-crud.spec.ts`** — creates an admin contact + a
  property, associates the contact with the property, removes the
  association, then deletes both.
- **`project-contact-crud.spec.ts`** — creates an admin contact, associates
  it with a project, removes the association, deletes the contact.
- **`admin-contact-crud.spec.ts`** — admin Contacts tab: create, then delete.

Every CRUD spec uses a `try { ... } finally { cleanup }` so a failed
assertion still removes the test row from DEV.

## Notes & gotchas

- **Project creation is not exercised** — the UI doesn't expose a delete
  for projects, so creating one would leave permanent debris in DEV.
- **Test data names** are suffixed with `e2e-<timestamp>-<rand>` to avoid
  collisions and to make leftover rows easy to spot/clean.
- **Required selects** use `selectOption({ index: 1 })` to pick the first
  non-placeholder option — fine for smoke coverage, but be aware the tests
  don't validate any business rules tied to specific option values.
- **Reports tab** is read-only here. If a report needs interactive form
  filling, treat it as out of scope until those endpoints exist.
