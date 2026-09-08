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
| oidc-client-ts | 3.x | BC Gov SSO (Keycloak) authentication |
| React Router | 7.x | Routing |
| Vitest + Playwright | 3.x / 1.54.x | Unit/browser + E2E testing |

## 🚀 Running Locally

See the [root README's Local Development section](../README.md#local-development) — both `npm run dev` and Docker Compose workflows live there, along with the `.env` setup.

## 🔧 Configuration

### Environment Variables

Mirrors `frontend/.env.example`. Bundled into the Vite build at dev time and into `/srv/config.js` at container start in prod.

| Variable | Description | Default (local) | Default (prod) |
|----------|-------------|-----------------|----------------|
| `VITE_APP_NAME` | Application display name | Real Estate Project Tracking | Real Estate Project Tracking |
| `VITE_BASE_PATH` | Base path when served behind a path-prefix proxy | empty | empty |
| `VITE_KEYCLOAK_URL` | BC Gov SSO realm issuer URI | `https://dev.loginproxy.gov.bc.ca/auth/realms/standard` | env realm URI |
| `VITE_KEYCLOAK_CLIENT_ID` | The CSS integration's client id | *(from CSS)* | *(from CSS)* |
| `VITE_BACKEND_URL` | API base path — read by the API client | `/api` (relative; proxied by Vite) | `/api` (relative; proxied by Caddy) |
| `NODE_ENV` | Node environment | development | production |

> **`VITE_KEYCLOAK_URL` is the issuer URI, not an endpoint.** oidc-client-ts discovers authorize / token / end-session from it, which is why the move off Cognito *removed* variables rather than renaming them: `VITE_USER_POOLS_ID`, `VITE_USER_POOLS_WEB_CLIENT_ID` and the three `VITE_LOGOUT_*` values are all gone.
>
> `VITE_KEYCLOAK_CLIENT_ID` must match the backend's `KEYCLOAK_CLIENT_ID`: the API checks it as the token's `azp` and refuses anything else.
>
> **`VITE_BACKEND_URL` is `/api` everywhere, including local.** The `/api` segment is part of the backend's own routes — every controller is mapped `@RequestMapping("/api/...")` under context-path `/` — and neither the Vite dev proxy nor Caddy rewrites the path. Callers pass `/rept/...` and this value supplies the prefix. Setting it to `http://localhost:8080` drops the `/api` segment, so every request 404s.
>
> The redirect URIs are derived from the runtime origin, not configured — sign-in returns to `<origin><base path>/authCallback` and sign-out to `<origin><base path>`. Both must be registered on the CSS integration.

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

Auth is **BC Gov SSO (Keycloak)** via [`oidc-client-ts`](https://github.com/authts/oidc-client-ts), administered through CSS — Authorization Code + PKCE, no client secret. `src/services/keycloak.ts` owns the `UserManager`; `AuthProvider` (`src/context/auth/`) owns the session and exposes `login`, `logout`, `userToken`, `ensureFreshToken`, `forceRefreshSession`, and `completeLogin`.

Tokens live in **`sessionStorage`** — they survive a reload but not a closed tab, and localStorage would leave them readable to any script on the origin for longer than the session needs.

Sign-in goes straight to IDIR via `kc_idp_hint=azureidir`. **That alias is the *IDIR - MFA* integration, not plain `idir`** — and an alias the realm doesn't recognise is silently ignored rather than refused, so a wrong value looks like it works.

### Token lifetimes

The realm gives us a **5-minute access token** and a **30-minute refresh token**. The refresh token is the real ceiling: once it's gone, nothing brings the session back.

- **`ensureFreshToken()`** — called before API calls and as a throttled keepalive by the session-timeout guard. Renews only when the access token is within 60s of expiry; otherwise a no-op. Concurrent callers share one renewal, because every renewal *rotates* the refresh token and racing rotations is how a live session dies. No background polling — idle users lapse naturally.
- **`forceRefreshSession()`** — unconditional renewal that rotates the refresh token and slides the 30-minute backstop. Backs "Stay logged in". Rejects once the refresh token has expired.

### Session timeout (proactive warning)

`src/components/SessionTimeout/` mounts once (in `App.tsx`, only while logged in) and enforces an **inactivity** policy:

- **25 min** of no activity (mouse/keyboard/scroll/touch) → automatic logout.
- **At 20 min** (5:00 remaining) a modal appears with a **live countdown**; the last 30s turn red.
- The dialog is a true `alertdialog` — no X, ESC/backdrop can't dismiss it, focus is trapped. The user must choose **Stay logged in** (forces `forceRefreshSession`, resets the clock) or **Log out**.
- Any activity *before* the warning resets the clock and keeps the token fresh, so an active user is never interrupted.

**Why 25 and not 30.** The idle window has to sit *under* the refresh-token ceiling, not on it. At exactly 30 minutes the timer fires at the same moment the refresh token dies — the sign-out races its own credentials, and "Stay logged in" is a button that can't keep its promise. Five minutes of headroom means the dialog is always backed by a token that still works. (Against Cognito's 60-minute refresh token, 30 was comfortably under the ceiling; it no longer is.)

On timeout a `sessionStorage` flag (`rept.sessionExpired`) is set before the sign-out redirect; the Landing page reads it once on return and shows a **"Session expired"** notice.

### Sign-in and sign-out

Sign-in redirects to the realm and returns to **`/authCallback`** (`src/pages/AuthCallback/`), which exchanges the authorization code and replaces the URL with `/dashboard`. That route is new: Amplify processed the callback implicitly inside `configure()`, whereas oidc-client-ts makes the exchange an explicit call.

Sign-out is a single `signoutRedirect()`. The old four-hop chain (`Siteminder → Keycloak → Cognito → app`) existed only so Cognito could fire last; with Cognito gone, so is the chain and its three `VITE_LOGOUT_*` variables.

> **Don't clear the stored user before signing out.** oidc-client-ts reads `id_token_hint` off it and removes it itself. Clearing first sends a logout Keycloak can't attribute to a session — the realm session survives, and the next sign-in walks straight back in without a prompt. If the redirect itself throws, `logout()` falls back to `removeUser()` and navigates home, so the app is never left showing a signed-out page on top of a live session.

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
│   │   ├── react-query/  # QueryClient defaults
│   │   └── tests/        # Test-only setup (Vitest globals, MSW handlers)
│   ├── context/          # React contexts
│   │   ├── auth/         # AuthProvider + Keycloak session handling
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

