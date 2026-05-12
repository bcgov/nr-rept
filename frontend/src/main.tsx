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
// Use default CookieStorage (path '/') — so Amplify's signOut()
// can reliably find and delete all Cognito cookies.
Amplify.configure(amplifyconfig);
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  new CookieStorage({
    domain: window.location.hostname,
    path: env.VITE_BASE_PATH || '/',
    secure: true, // HTTPS only
    sameSite: 'strict', // no cross-site sending
    expires: undefined, // session cookie — dies when browser closes
  }),
);

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
