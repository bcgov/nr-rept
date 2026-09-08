import { Loading } from '@carbon/react';
import { useEffect, useRef, type FC } from 'react';

import { useAuth } from '@/context/auth/useAuth';

/**
 * Where Keycloak returns the browser after a successful sign-in.
 *
 * New with the move off Cognito: Amplify processed the `?code=…&state=…`
 * callback implicitly during `Amplify.configure()`, so there was no route to
 * land on. oidc-client-ts makes the exchange explicit, which is the reason this
 * page exists.
 *
 * It renders only a spinner. The exchange is quick, and on success the auth
 * state flips, `AppRoutes` swaps the public route table for the protected one,
 * and the replace below puts /dashboard in history — so Back returns to
 * wherever the user came from rather than to a spent callback URL.
 */
const AuthCallback: FC = () => {
  const { completeLogin } = useAuth();

  // StrictMode mounts effects twice in development. The authorization code is
  // single-use and its state entry is consumed by the first exchange, so a
  // second call fails on a perfectly good sign-in.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      try {
        await completeLogin();
        window.history.replaceState({}, '', `${import.meta.env.BASE_URL ?? '/'}dashboard`);
      } catch (error) {
        // A spent or tampered callback is not something the user can act on —
        // send them back to the sign-in screen rather than showing an error
        // page for a URL they never typed.
        // eslint-disable-next-line no-console
        console.error('[AuthCallback] sign-in could not be completed:', error);
        window.location.replace(import.meta.env.BASE_URL || '/');
      }
    };

    void run();
  }, [completeLogin]);

  return <Loading data-testid="auth-callback-loading" withOverlay={true} />;
};

export default AuthCallback;
