import { render, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthContext, type AuthContextType } from './AuthContext';
import { AuthProvider } from './AuthProvider';

const signinRedirect = vi.fn(async () => undefined);
const signoutRedirect = vi.fn(async () => undefined);
const removeUser = vi.fn(async () => undefined);

vi.mock('@/services/keycloak', () => ({
  KC_IDP_HINT: 'azureidir',
  getUserManager: () => ({ signinRedirect, signoutRedirect, removeUser }),
  loadStoredUser: vi.fn(async () => null),
  ensureFreshUser: vi.fn(async () => null),
  forceRenew: vi.fn(async () => null),
}));

vi.mock('./authUtils', () => ({
  parseToken: vi.fn((profile) => ({ userName: profile?.idir_username, privileges: {} })),
}));

/** Renders the provider and hands back its context once it has settled. */
const renderProvider = async (): Promise<AuthContextType> => {
  let context: AuthContextType | undefined;
  render(
    <AuthProvider>
      <AuthContext.Consumer>
        {(value) => {
          context = value;
          return null;
        }}
      </AuthContext.Consumer>
    </AuthProvider>,
  );
  await waitFor(() => expect(context?.isLoading).toBe(false));
  return context!;
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom refuses real navigation; the fallback path calls it.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign: vi.fn(), replace: vi.fn() },
    });
  });

  it('sends the user to IDIR through the azureidir hint', async () => {
    const context = await renderProvider();

    await act(async () => {
      context.login();
    });

    // Not `idir`: the standard realm federates IDIR via Azure AD, and an alias
    // the realm does not recognise is silently ignored rather than refused.
    expect(signinRedirect).toHaveBeenCalledWith({
      extraQueryParams: { kc_idp_hint: 'azureidir' },
    });
  });

  it('signs out through Keycloak without clearing the stored user first', async () => {
    const context = await renderProvider();

    await act(async () => {
      await context.logout();
    });

    expect(signoutRedirect).toHaveBeenCalled();
    // oidc-client-ts reads `id_token_hint` off the stored user and removes it
    // itself. Removing it first sends a logout Keycloak cannot attribute to a
    // session, so the realm session survives the sign-out.
    expect(removeUser).not.toHaveBeenCalled();
  });

  it('falls back to a local sign-out when the redirect fails', async () => {
    signoutRedirect.mockRejectedValueOnce(new Error('realm unreachable'));
    const context = await renderProvider();

    await act(async () => {
      await context.logout();
    });

    // The realm session may survive — we cannot reach it — but this browser's
    // must not, so the page must never be left showing a live session.
    expect(removeUser).toHaveBeenCalled();
  });

  it('publishes no user when nothing is stored', async () => {
    const context = await renderProvider();

    expect(context.isLoggedIn).toBe(false);
    expect(context.userToken()).toBeUndefined();
  });

  it('restores a stored session on mount', async () => {
    const { loadStoredUser } = await import('@/services/keycloak');
    vi.mocked(loadStoredUser).mockResolvedValueOnce({
      access_token: 'stored-token',
      profile: { idir_username: 'JSMITH' },
    } as never);

    const context = await renderProvider();

    expect(context.isLoggedIn).toBe(true);
    expect(context.userToken()).toBe('stored-token');
    expect(context.user?.userName).toBe('JSMITH');
  });

  it('shares one renewal between concurrent callers', async () => {
    const { ensureFreshUser } = await import('@/services/keycloak');
    vi.mocked(ensureFreshUser).mockResolvedValue({
      access_token: 'renewed',
      profile: {},
    } as never);

    const context = await renderProvider();

    // Every signinSilent rotates the refresh token; racing rotations against
    // each other is how a session dies while somebody is using it.
    await act(async () => {
      await Promise.all([
        context.ensureFreshToken(),
        context.ensureFreshToken(),
        context.ensureFreshToken(),
      ]);
    });

    expect(vi.mocked(ensureFreshUser)).toHaveBeenCalledTimes(1);
  });
});
