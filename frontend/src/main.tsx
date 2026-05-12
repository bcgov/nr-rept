import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage } from 'aws-amplify/utils';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/index.scss';
import App from '@/App.tsx';
import amplifyconfig from '@/config/fam/config';
import { queryClientConfig } from '@/config/react-query/config';
import { AuthProvider } from '@/context/auth/AuthProvider';
import NotificationProvider from '@/context/notification/NotificationProvider';
import PageTitleProvider from '@/context/pageTitle/PageTitleProvider';
import { PreferenceProvider } from '@/context/preference/PreferenceProvider.tsx';
import ThemeProvider from '@/context/theme/ThemeProvider.tsx';
import { env } from '@/env';

const queryClient = new QueryClient(queryClientConfig);

// Configure AWS Amplify with Cognito; store tokens in cookies so they
// survive page reloads and are accessible to the service worker.
//
// Storage MUST be set BEFORE Amplify.configure(): in v6, configure() can
// trigger immediate OAuth-callback processing when the URL contains
// ?code=...&state=..., and that processing reads the OAuth flow state
// (PKCE verifier, state, nonce) from whatever storage is active at that
// moment. If we configure first and swap storage afterward, the callback
// handler reads from the default (localStorage) while signInWithRedirect
// wrote to the swapped-in CookieStorage — silent miss, no token POST.
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  new CookieStorage({
    domain: window.location.hostname,
    path: env.VITE_BASE_PATH || '/',
    secure: true, // HTTPS only
    sameSite: 'strict', // no cross-site sending
    expires: undefined, // session cookie — dies when browser closes
  }),
);
Amplify.configure(amplifyconfig);

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
