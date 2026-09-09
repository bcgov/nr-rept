import { ensureFreshUser, getUserManager } from '@/services/keycloak';

/**
 * Ensures the access token is fresh before making an API call.
 *
 * - Returns immediately when the token still has comfortable life left.
 * - Renews from the refresh token when it is at or near expiry.
 * - Signs the user out and returns to the sign-in screen when the refresh token
 *   itself has expired — they were idle past the realm's thirty-minute ceiling.
 *
 * Call this at the top of every API request function.
 *
 * The staleness margin and the single-flight guard both live in
 * `services/keycloak.ts` now: oidc-client-ts already tracks token expiry, so the
 * hand-rolled `exp` arithmetic and refresh-gap bookkeeping this module used to
 * carry were duplicating it — and, being a second source of truth, could
 * disagree with it.
 */
export async function ensureSessionFresh(): Promise<void> {
  try {
    const user = await ensureFreshUser(getUserManager());

    if (!user) {
      // Nobody is signed in. Nothing to renew and nothing to sign out of — the
      // route guards will already be showing the public tree.
      return;
    }
  } catch (error) {
    // Refresh token expired or revoked — the session is over.
    // eslint-disable-next-line no-console
    console.warn('[ensureSessionFresh] Session expired — signing out.', error);

    // Left in place deliberately: signoutRedirect reads `id_token_hint` off the
    // stored user, and clearing it first sends a logout Keycloak cannot tie to a
    // session — the realm session survives and the next sign-in walks straight
    // back in. If the redirect itself fails, drop the tokens and go home.
    await getUserManager()
      .signoutRedirect()
      .catch(async () => {
        await getUserManager()
          .removeUser()
          .catch(() => undefined);
        window.location.href = import.meta.env.BASE_URL || '/';
      });
  }
}
