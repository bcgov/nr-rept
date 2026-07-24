# REPT Frontend

React frontend application for the Real Estate Project Tracking system.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.8.x | Type safety |
| Vite | 7.x | Build tool / dev server |
| Carbon Design System | 1.x (@carbon/react) | UI components |
| React Query | 5.x | Data fetching |
| AWS Amplify | 6.x | Cognito authentication |
| React Router | 7.x | Routing |
| Vitest + Playwright | 3.x / 1.54.x | Unit/browser + E2E testing |

## 🚀 Running Locally

See the [root README's Local Development section](../README.md#local-development) — both `npm run dev` and Docker Compose workflows live there, along with the `.env` setup.

## 🔧 Configuration

### Environment Variables

Mirrors `frontend/.env.example`. Bundled into the Vite build at dev time and into `/srv/config.js` at container start in prod.

| Variable | Description | Default (local) | Default (prod) |
|----------|-------------|-----------------|----------------|
| `VITE_APP_NAME` | Application display name | REPT | Real Estate Project Tracking |
| `VITE_ZONE` | Deploy zone; AuthProvider uppercases it to pick the Cognito IdP (`<ZONE>-IDIR`) | dev | dev / test / prod |
| `VITE_BASE_PATH` | Base path when served behind a path-prefix proxy | empty | empty |
| `VITE_USER_POOLS_ID` | Cognito User Pool ID | - | - |
| `VITE_USER_POOLS_WEB_CLIENT_ID` | Cognito App Client ID | - | - |
| `VITE_LOGOUT_SITEMINDER_URL` | Federated logout: IDIR/BCeID Siteminder `logoff.cgi` base | `https://logontest7.gov.bc.ca/clp-cgi/logoff.cgi` | env logoff.cgi |
| `VITE_LOGOUT_KEYCLOAK_URL` | Federated logout: Keycloak end-session endpoint | `https://test.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout` | env KC logout URL |
| `VITE_LOGOUT_KEYCLOAK_CLIENT_ID` | Federated logout: the app's FAM/Keycloak client id | *(from FAM / Vault)* | *(from FAM / Vault)* |
| `VITE_BACKEND_URL` | API base path or URL — read by the API client | http://localhost:8080 | `/api` (relative; proxied by Caddy) |
| `NODE_ENV` | Node environment | development | production |

> **New for session/logout:** `VITE_LOGOUT_SITEMINDER_URL`, `VITE_LOGOUT_KEYCLOAK_URL`, and `VITE_LOGOUT_KEYCLOAK_CLIENT_ID` are the three variables to add for the federated logout chain (see [Authentication, Session & Logout](#-authentication-session--logout) below). All three must be set for the chain; if any is blank, logout falls back to the plain Amplify sign-out (which returns to the app origin — no separate sign-out URL variable is needed).

### Development Server Options

These are read by `vite.config.ts` to configure the dev server and HMR. Only matter when you run `npm run dev` (or compose).

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_DEV_HOST` | Dev server bind address (`0.0.0.0` if running in Docker) | localhost |
| `VITE_DEV_PORT` | Dev server port | 3000 |
| `VITE_DEV_BACKEND_TARGET` | Where Vite's `/api` proxy forwards | http://localhost:8080 |
| `VITE_HMR_HOST` | HMR WebSocket host the browser dials | localhost |
| `VITE_HMR_PORT` | HMR WebSocket port | 3000 |
| `VITE_HMR_PROTOCOL` | `ws` or `wss` | ws |

## 🔐 Authentication, Session & Logout

Auth is Cognito (FAM) via AWS Amplify. Tokens are stored in **cookies** (`CookieStorage`, configured in `src/main.tsx`) so they survive reloads. `AuthProvider` (`src/context/auth/`) owns the session and exposes `login`, `logout`, `userToken`, `ensureFreshToken`, and `forceRefreshSession`.

### Token management

- **`ensureFreshToken()`** — called before API calls (and as a throttled keepalive by the session-timeout guard). Refreshes the access token via the refresh token only when it's within 30s of expiry; otherwise a no-op. No background polling — idle users naturally lapse.
- **`forceRefreshSession()`** — unconditional refresh that rotates the refresh token and slides the 60-minute backstop. Backs the "Stay logged in" button. Rejects if the refresh token has already expired.

### Session timeout (proactive warning)

`src/components/SessionTimeout/` mounts once (in `App.tsx`, only while logged in) and enforces an **inactivity** policy:

- **30 min** of no activity (mouse/keyboard/scroll/touch) → automatic logout.
- **At 25 min** (5:00 remaining) a modal appears with a **live countdown**; the last 30s turn red.
- The dialog is a true `alertdialog` — no X, ESC/backdrop can't dismiss it, focus is trapped. The user must choose **Stay logged in** (forces `forceRefreshSession`, resets the clock) or **Log out**.
- Any activity *before* the warning resets the clock and keeps the token fresh, so an active user is never interrupted. The idle window (30 min) sits under the Cognito refresh-token TTL (60 min), so inactivity is the effective policy.
- On timeout, a `sessionStorage` flag (`rept.sessionExpired`) is set before the sign-out redirect; the Landing page reads it once on return and shows a **"Session expired"** notice.

### Logout — federated chain

The primary logout path drives the BC Gov federated chain itself so **Cognito fires last** (`src/context/auth/logoutChain.ts`):

```
Siteminder logoff.cgi → Keycloak end-session → Cognito /logout → app
```

Putting Cognito last means Keycloak's `post_logout_redirect_uri` points at the *Cognito* `/logout` URL (one stable value), so the app URL only ever has to be registered as a **Cognito sign-out URL** — never on the shared, FAM-managed Keycloak client. On logout the app clears its local Amplify token cookies (`clearStoredTokens`) up front, then navigates the chain; the final Cognito hop clears the Cognito session cookie server-side, and the app re-bootstraps logged-out on return.

The chain is built from `VITE_LOGOUT_SITEMINDER_URL`, `VITE_LOGOUT_KEYCLOAK_URL`, `VITE_LOGOUT_KEYCLOAK_CLIENT_ID`, and the existing `VITE_USER_POOLS_WEB_CLIENT_ID`. **If any of the three logout vars is blank, `buildFederatedLogoutUrl` returns `null` and logout falls back to Amplify's hosted-UI `signOut()`**, which clears the Cognito session and returns to the app origin (`config/fam/config.ts` computes this from `window.location.origin`; the origin must be registered as an Allowed sign-out URL on the Cognito app client — the same origin the chain uses as its `logout_uri`). This is the safe default for local dev if you don't have the Keycloak client id.

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (HMR enabled) |
| `npm run build` | Type-check (`tsc -b`) then `vite build` to `dist/` |
| `npm run deploy` | Used in CI: `npm ci && tsc -b && vite build` |
| `npm run preview` | Serve the production build locally for inspection |
| `npm run lint` | Run ESLint |
| `npm run test` | Vitest in watch mode |
| `npm run test:unit` | Vitest, `node` project only |
| `npm run test:browser` | Vitest, `browser` project only (Playwright-driven) |
| `npm run test:ci` | Vitest one-shot, all projects (used by CI) |
| `npm run test:watch` | Vitest in watch + coverage |
| `npm run test:coverage` | Vitest one-shot with coverage (HTML report) |
| `npm run e2e` | Playwright E2E, chromium only. Requires `E2E_BASE_URL` (see [e2e/README.md](e2e/README.md)) |
| `npm run e2e:login` | Headed auth-setup run; refreshes `e2e/.auth/user.json`. Requires `E2E_BASE_URL` |
| `npm run e2e:all-browsers` | Playwright E2E across all configured browsers. Requires `E2E_BASE_URL` |
| `npm run e2e:ui` | Playwright UI mode. Requires `E2E_BASE_URL` |
| `npm run e2e:report` | Open the last Playwright HTML report (no URL needed) |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run browser tests
npm run test:browser

# Run with coverage
npm run test:coverage
```

### Testing Libraries

| Library | Purpose |
|---------|---------|
| Vitest | Test runner |
| Testing Library | Component testing |
| Playwright | Browser testing |

## 📁 Project Structure

```
frontend/
├── src/
│   ├── assets/           # Static assets (images)
│   ├── components/       # Reusable UI components
│   │   ├── core/         # Core components (PageTitle, EmptySection, etc.)
│   │   ├── Form/         # Form components
│   │   ├── Layout/       # App shell (header, sidenav, profile panel)
│   │   └── Modal/        # Modal dialog components
│   ├── config/           # Configuration
│   │   ├── api/          # Axios + React Query keys
│   │   ├── fam/          # Cognito / FAM Amplify config
│   │   ├── react-query/  # QueryClient defaults
│   │   └── tests/        # Test-only setup (Vitest globals, MSW handlers)
│   ├── context/          # React contexts
│   │   ├── auth/         # AuthProvider + Cognito session handling
│   │   ├── layout/       # Layout state (sidenav open/closed)
│   │   ├── notification/ # Toast notifications
│   │   ├── pageTitle/    # Document title + breadcrumb
│   │   ├── preference/   # User preferences
│   │   └── theme/        # Theme (light/dark)
│   ├── hooks/            # Custom hooks (useAuthorization, etc.)
│   ├── pages/            # Route-level page components
│   ├── routes/           # Route table + ProtectedRoute
│   ├── services/         # API service modules
│   ├── styles/           # Global SCSS
│   └── utils/            # Utility functions
└── public/               # Static public files
```

## 🎨 UI Components

The application uses [Carbon Design System](https://carbondesignsystem.com/) with BC Gov theming:

- `@carbon/react` - React components
- `@carbon/icons-react` - Icon library
- `@bcgov-nr/nr-theme` - BC Gov theme

