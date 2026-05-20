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
| `VITE_REDIRECT_SIGN_OUT` | Cognito logout redirect URL | http://localhost:3000 | route-host URL |
| `VITE_BACKEND_URL` | API base path or URL — read by the API client | http://localhost:8080 | `/api` (relative; proxied by Caddy) |
| `NODE_ENV` | Node environment | development | production |

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
| `npm run e2e` | Playwright E2E, chromium only |
| `npm run e2e:login` | Headed run of the auth-setup project (refreshes `e2e/.auth/user.json`) |
| `npm run e2e:all-browsers` | Playwright E2E across all configured browsers |
| `npm run e2e:ui` | Playwright UI mode |
| `npm run e2e:report` | Open the last Playwright HTML report |

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

