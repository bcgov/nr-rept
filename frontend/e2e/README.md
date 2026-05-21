# Playwright E2E

These tests hit a real REPT backend (Cognito, Oracle, the works).
`E2E_BASE_URL` is **required** — the suite has no built-in default. The
GitHub Actions workflows compute it from the PR slot or `test`/`prod` target
automatically; for local runs you set it yourself.

## Setting `E2E_BASE_URL`

| Where you're pointing | Value |
|---|---|
| Local Vite dev server + local Spring Boot (over VPN to Oracle) | `http://localhost:3000` |
| Deployed PR preview (slot-bucketed; see `pr-open.yml`) | `https://nr-rept-<PR % 50>.apps.silver.devops.gov.bc.ca` |
| Deployed TEST | `https://nr-rept-test.apps.silver.devops.gov.bc.ca` |

Always inline the var when invoking npm scripts so it's scoped to that
process, e.g.:

```bash
E2E_BASE_URL=http://localhost:3000 npm run e2e
```

If you forget, the suite fails fast at module-load with a clear error
rather than silently targeting a stale URL.

## One-time auth bootstrap

Cognito + BC Gov IDIR can't be scripted headlessly. Run the setup project
once interactively to capture an authenticated session:

```bash
E2E_BASE_URL=http://localhost:3000 npm run e2e:login
```

A Chromium window opens, navigates to the landing page, and clicks **Log in
with IDIR**. Finish the IDIR sign-in (and any MFA) by hand. Once the app
lands on `/dashboard`, the session is saved to `e2e/.auth/user.json` (gitignored).

The saved session is scoped to the `E2E_BASE_URL` you logged in against —
switching targets means re-running `e2e:login` against the new URL. Also
re-run whenever the session expires (you'll know because tests start
bouncing back to the IDIR domain or seeing 401s).

## Running the suite

```bash
E2E_BASE_URL=http://localhost:3000 npm run e2e               # chromium only (default)
E2E_BASE_URL=http://localhost:3000 npm run e2e:all-browsers  # chromium + chrome + firefox + safari + edge
E2E_BASE_URL=http://localhost:3000 npm run e2e:ui            # Playwright's interactive UI
npm run e2e:report                                           # open last report (no URL needed)
```

Run a single spec or filter by name:

```bash
E2E_BASE_URL=http://localhost:3000 npm run e2e -- admin-co-user-crud
E2E_BASE_URL=http://localhost:3000 npm run e2e -- admin-
```

All non-setup projects depend on `setup`, so Playwright will yell if you
haven't run the login bootstrap yet.

## What's covered

- **`smoke.spec.ts`** — visits every protected route (`/dashboard`,
  `/projects`, `/projects/create`, `/admin`, `/reports`, `/reports/:id`)
  plus the 404 path, walks all six project-detail tabs on the first listed
  project, and asserts the global error boundary never takes over.
- **`project-create.spec.ts`** — `describe.serial` lifecycle: creates a
  project file, then exercises History (edit + save), Acquisition Request
  (create with all required fields), Agreements (add agreement), and each
  of the three Agreement sub-tabs (Details edit/save, Properties empty-
  state, Payments new-payment modal) — all against the same project. Each
  later test reuses the `projectId` captured by the first one. No cleanup
  — see the gotcha below.
- **`property-crud.spec.ts`** — picks the first project, creates a Property
  with the minimum-required fields, drives an edit/save on each of the
  four editable Property sub-tabs (Details, Milestones, Registration,
  Expropriation), smoke-clicks Contacts, then deletes the property.
- **`property-contact-crud.spec.ts`** — creates an admin contact + a
  property, associates the contact with the property, removes the
  association, then deletes both.
- **`project-contact-crud.spec.ts`** — creates an admin contact, associates
  it with a project, removes the association, deletes the contact.
- **`admin-contact-crud.spec.ts`** — admin Contacts tab: create, then delete.
- **`admin-co-user-crud.spec.ts`** — admin Co-users tab (external branch):
  create, then delete. Also asserts the table has no `Org unit` column
  (regression net for that column's recent removal).
- **`admin-requesting-source-crud.spec.ts`** — admin Requesting Source tab
  (external branch): create, then delete; same `Org unit` regression net.
- **`admin-qualified-receiver-crud.spec.ts`** — admin Qualified Receiver
  tab: name-only + active toggle CRUD.
- **`admin-expense-authority-crud.spec.ts`** — admin Expense Authority tab:
  same shape as qualified receiver.

Every CRUD spec uses a `try { ... } finally { cleanup }` so a failed
assertion still removes the test row from the namespace.

## Notes & gotchas

- **Project creation has no cleanup** — the UI doesn't expose a delete for
  projects, so `project-create.spec.ts` intentionally leaves a row behind
  each run. The project name is prefixed `E2E Project` + the suffix so the
  residue is easy to spot in `/projects` searches.
- **Test data names** are suffixed with `e2e-<timestamp>-<rand>` to avoid
  collisions and to make leftover rows easy to spot/clean. Two admin specs
  use the suffix alone (no human-readable prefix) because their backing
  Oracle columns are `VARCHAR2(20)` — see `admin-{qualified-receiver,expense-authority}-crud.spec.ts`.
- **Required selects** use `selectOption({ index: 1 })` to pick the first
  non-placeholder option — fine for smoke coverage, but be aware the tests
  don't validate any business rules tied to specific option values.
- **Reports tab** is read-only here. If a report needs interactive form
  filling, treat it as out of scope until those endpoints exist.
- **Local-backend latency**: `helpers/project.ts:openFirstProject` waits up
  to 90s for the project search to return. The query joins across multiple
  Oracle tables and routinely runs 30–60s when the backend is hit over the
  BC Gov VPN (i.e. `E2E_BASE_URL=http://localhost:3000`). Deployed
  environments return in seconds, so the longer ceiling is harmless in CI.
