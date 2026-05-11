# REPT Frontend

React frontend application for the Real Estate Project Tracking system.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool |
| Carbon Design System | 1.x | UI components |
| React Query | 5.x | Data fetching |
| AWS Amplify | 6.x | Cognito authentication |
| React Router | 7.x | Routing |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   VITE_APP_NAME=REPT
   VITE_ZONE=dev
   VITE_USER_POOLS_ID=your-cognito-pool-id
   VITE_USER_POOLS_WEB_CLIENT_ID=your-cognito-client-id
   VITE_REDIRECT_SIGN_OUT=http://localhost:3000
   VITE_BACKEND_URL=http://localhost:8080
   ```

### Running Locally

```bash
# Install dependencies
npm ci

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

### Running with Docker

```bash
# Build the image
docker build -t rept-frontend \
  --build-arg VITE_USER_POOLS_ID=your-pool-id \
  --build-arg VITE_USER_POOLS_WEB_CLIENT_ID=your-client-id \
  .

# Run the container
docker run -p 3000:3000 rept-frontend
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | REPT |
| `VITE_ZONE` | Environment (dev/test/prod) | dev |
| `VITE_USER_POOLS_ID` | Cognito User Pool ID | - |
| `VITE_USER_POOLS_WEB_CLIENT_ID` | Cognito App Client ID | - |
| `VITE_REDIRECT_SIGN_OUT` | Logout redirect URL | http://localhost:3000 |
| `VITE_BACKEND_URL` | Backend API URL | http://localhost:8080 |

### Development Server Options

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_DEV_HOST` | Dev server host | localhost |
| `VITE_DEV_PORT` | Dev server port | 3000 |
| `VITE_HMR_HOST` | HMR host | localhost |
| `VITE_HMR_PORT` | HMR port | 3000 |

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:browser` | Run browser tests |
| `npm run test:coverage` | Run tests with coverage |

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
│   │   ├── core/         # Core components (PageTitle, etc.)
│   │   ├── Form/         # Form components
│   │   └── Layout/       # Layout components
│   ├── config/           # Configuration
│   │   ├── api/          # API configuration
│   │   ├── fam/          # Cognito/FAM config
│   │   └── react-query/  # React Query config
│   ├── context/          # React contexts
│   │   ├── auth/         # Authentication
│   │   ├── layout/       # Layout state
│   │   ├── notification/ # Toast notifications
│   │   ├── pageTitle/    # Page title
│   │   ├── preference/   # User preferences
│   │   └── theme/        # Theme (light/dark)
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   ├── routes/           # Routing configuration
│   ├── services/         # API services
│   ├── styles/           # Global styles
│   └── utils/            # Utility functions
└── public/               # Static public files
```

## 🎨 UI Components

The application uses [Carbon Design System](https://carbondesignsystem.com/) with BC Gov theming:

- `@carbon/react` - React components
- `@carbon/icons-react` - Icon library
- `@bcgov-nr/nr-theme` - BC Gov theme

## 📚 Documentation

- [Frontend Architecture](../docs/frontend-architecture.md)
- [Architecture Overview](../docs/architecture-overview.md)
