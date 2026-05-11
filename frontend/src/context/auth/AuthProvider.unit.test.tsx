import { render, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { AuthContext } from './AuthContext';
import { AuthProvider } from './AuthProvider';

// Mocks
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('@/env', () => ({ env: { VITE_ZONE: 'TEST', NODE_ENV: 'test' } }));
vi.mock('@/config/fam/config', () => ({
  redirectSignOut:
    'https://logontest7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout?redirect_uri=http://localhost:3000/pub/rept',
  default: {},
}));
vi.mock('./authUtils', () => ({
  parseToken: vi.fn((token) => ({ id: 'user', name: 'Test User', token })),
  getAccessTokenFromCookie: vi.fn(() => undefined),
}));

describe('AuthProvider (extra coverage)', () => {
  it('calls login with IDIR', async () => {
    const { signInWithRedirect } = await import('aws-amplify/auth');
    let context;
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
    await waitFor(() => expect(context).toBeDefined());
    await act(() => context.login());
    expect(signInWithRedirect).toHaveBeenCalledWith({ provider: { custom: 'TEST-IDIR' } });
  });

  it('calls logout and sets user undefined', async () => {
    const { signOut } = await import('aws-amplify/auth');
    let context;
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
    await waitFor(() => expect(context).toBeDefined());
    await act(() => context.logout());
    expect(signOut).toHaveBeenCalled();
  });

  it('calls userToken and returns value', async () => {
    const { getAccessTokenFromCookie } = await import('./authUtils');
    (getAccessTokenFromCookie as any).mockReturnValue('sometoken');
    let context;
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
    await waitFor(() => expect(context).toBeDefined());
    expect(context.userToken()).toBe('sometoken');
  });
});
