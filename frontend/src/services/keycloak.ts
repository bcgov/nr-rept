/**
 * BC Gov SSO (Keycloak) OIDC client.
 *
 * Replaces the AWS Amplify / Cognito configuration that used to live in
 * `config/fam/config.ts`. Authorization Code + PKCE against the standard realm;
 * there is no client secret, because this is a public browser client.
 *
 * Configuration comes from `env` (Vite build-time values merged with the runtime
 * `window.config` that the container entrypoint renders), so one built image is
 * still promotable between environments.
 */

import {
  UserManager,
  WebStorageStateStore,
  type User,
  type UserManagerSettings,
} from 'oidc-client-ts';

import { env } from '@/env';

/**
 * The realm's identity-provider alias, passed as `kc_idp_hint` so the user goes
 * straight to IDIR instead of Keycloak's provider-selection screen.
 *
 * **This is `azureidir`, not `idir`.** REPT uses the standard realm's
 * *IDIR - MFA* integration, which federates IDIR through Azure AD under that
 * alias — it is what comes back in `identity_provider`, and what the backend
 * normalises to `IDIR` for the audit columns.
 *
 * Getting it wrong is not an error, which is what makes it worth stating: an
 * alias the realm does not recognise is silently ignored and Keycloak falls
 * through to whatever provider the client has. On a single-provider integration
 * that means the wrong value still reaches the right place, right up until the
 * day a second provider is added.
 */
export const KC_IDP_HINT = 'azureidir';

/** Path the realm redirects back to after a successful sign-in. */
export const AUTH_CALLBACK_PATH = '/authCallback';

/**
 * How close to expiry an access token may get before it is renewed.
 *
 * Renewing only once a token has *already* expired leaves a window where every
 * request carries a token the backend refuses. The access token lives five
 * minutes on this realm, so a minute of headroom is a fifth of its life — enough
 * to cover a slow renewal and clock skew between browser and Keycloak, without
 * renewing so eagerly that the refresh token rotates for no reason.
 */
export const RENEW_WHEN_SECONDS_LEFT = 60;

let userManager: UserManager | null = null;

const buildSettings = (): UserManagerSettings => {
  const basePath = (env.VITE_BASE_PATH ?? '').replace(/\/$/, '');
  const appOrigin = `${window.location.origin}${basePath}`;

  return {
    authority: env.VITE_KEYCLOAK_URL,
    client_id: env.VITE_KEYCLOAK_CLIENT_ID,
    redirect_uri: `${appOrigin}${AUTH_CALLBACK_PATH}`,
    post_logout_redirect_uri: appOrigin || `${window.location.origin}/`,
    response_type: 'code',
    scope: 'openid profile email',

    // Tokens survive a page reload but not a closed tab. localStorage would
    // leave them readable to any script on the origin for longer than the
    // session needs.
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),

    // REPT renews on user activity and enforces its own inactivity timeout
    // (components/SessionTimeout); it deliberately runs no background poll, so
    // an idle user times out rather than being kept alive by a timer.
    automaticSilentRenew: false,

    // Everything REPT needs is on the access token now — see the claim table in
    // backend/src/main/java/.../JwtPrincipalUtil.java. A /userinfo round-trip
    // per sign-in would buy nothing.
    loadUserInfo: false,
  };
};

/**
 * The shared {@link UserManager}, created on first use rather than at module
 * evaluation: `window.config` is injected by the container entrypoint and is not
 * guaranteed to be present when this module is first imported.
 */
export const getUserManager = (): UserManager => {
  if (!userManager) {
    userManager = new UserManager(buildSettings());
  }
  return userManager;
};

/** Only for tests, which build a fresh manager per case. */
export const resetUserManager = (): void => {
  userManager = null;
};

/**
 * Whether this token is expired, or close enough that it soon will be.
 *
 * The two fields are not independent: oidc-client-ts derives `expired` from
 * `expires_in`, so an explicit `false` already means there is life left even when
 * the remaining seconds are not to hand. Only when neither says anything is
 * renewing the safer guess — an unknown expiry is exactly the case where being
 * wrong costs a refused request.
 */
export const needsRenewal = (user: Pick<User, 'expired' | 'expires_in'>): boolean => {
  const secondsLeft = user.expires_in;
  if (secondsLeft === undefined) {
    return user.expired !== false;
  }
  return secondsLeft <= RENEW_WHEN_SECONDS_LEFT;
};

/**
 * The stored user, silently renewed if their access token has expired.
 *
 * Returns null when nobody is signed in, rather than attempting a renewal — and
 * that distinction matters more than it looks. `signinSilent` renews from the
 * stored refresh token (no iframe, unaffected by third-party cookie rules) but
 * only when there is a stored user to renew from. With nothing stored,
 * oidc-client-ts falls back to a hidden-iframe flow, and since no
 * `silent_redirect_uri` is configured that attempt cannot succeed: it runs until
 * `silentRequestTimeoutInSeconds` expires, which defaults to 10.
 *
 * Every first-time visitor to the Landing page has nothing stored, so calling it
 * unconditionally would hold the page behind a spinner for ten seconds before
 * the sign-in button appeared.
 */
export const loadStoredUser = async (
  manager: Pick<UserManager, 'getUser' | 'signinSilent'>,
): Promise<User | null> => {
  const user = await manager.getUser();

  // Never signed in: there is no session to restore and nothing to renew.
  if (!user) {
    return null;
  }

  if (!needsRenewal(user)) {
    return user;
  }

  return await manager.signinSilent();
};

/**
 * The stored user, renewed only if the access token is at or near expiry.
 *
 * Cheap to call often — a no-op until the token is nearly out — which is what
 * lets the idle guard run it on user activity. That matters because REPT makes
 * no request while somebody is reading a screen: without it, a person plainly
 * still at their desk could return from five quiet minutes to a dead token.
 */
export const ensureFreshUser = async (
  manager: Pick<UserManager, 'getUser' | 'signinSilent'>,
): Promise<User | null> => {
  const user = await manager.getUser();
  if (!user) {
    return null;
  }
  return needsRenewal(user) ? await manager.signinSilent() : user;
};

/**
 * Renews regardless of how much life the access token has left.
 *
 * For "Stay logged in", where the point is not the access token but the refresh
 * token behind it: using it rotates it, which is what actually moves the
 * thirty-minute ceiling and buys the extra time the button promises.
 */
export const forceRenew = async (
  manager: Pick<UserManager, 'signinSilent'>,
): Promise<User | null> => await manager.signinSilent();
