import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/index.scss';
import App from '@/App.tsx';
import { queryClientConfig } from '@/config/react-query/config';
import { AuthProvider } from '@/context/auth/AuthProvider';
import NotificationProvider from '@/context/notification/NotificationProvider';
import PageTitleProvider from '@/context/pageTitle/PageTitleProvider';
import { PreferenceProvider } from '@/context/preference/PreferenceProvider.tsx';
import ThemeProvider from '@/context/theme/ThemeProvider.tsx';

const queryClient = new QueryClient(queryClientConfig);

// No auth bootstrapping here any more. Amplify needed its token storage wired
// up before `configure()`, because configure() itself processed the OAuth
// callback and had to read the PKCE verifier from the same store that wrote it.
// oidc-client-ts makes the exchange an explicit call on the /authCallback route
// (pages/AuthCallback), so there is nothing to sequence at module scope — the
// UserManager is built lazily on first use in services/keycloak.ts.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <PreferenceProvider>
          <ThemeProvider>
            <NotificationProvider>
              <PageTitleProvider>
                <App />
              </PageTitleProvider>
            </NotificationProvider>
          </ThemeProvider>
        </PreferenceProvider>
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
);
