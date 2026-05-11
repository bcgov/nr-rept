import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

const TestComponent = () => {
  const { user, isLoggedIn, isLoading, login, logout } = useAuth();
  return (
    <>
      <span data-testid="is-logged-in">{isLoggedIn ? 'yes' : 'no'}</span>
      <span data-testid="is-loading">{isLoading ? 'yes' : 'no'}</span>
      <span data-testid="user">{user ? user.displayName || user.userName : 'none'}</span>
      <button onClick={() => login('IDIR')}>Login</button>
      <button onClick={logout}>Logout</button>
    </>
  );
};

const renderWithProvider = async () => {
  await act(async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
  });
};

describe('AuthContext', () => {
  it('provides default auth values', async () => {
    await renderWithProvider();
    expect(screen.getByTestId('is-logged-in').textContent).toBe('no');
    expect(screen.getByTestId('is-loading').textContent).toMatch(/yes|no/);
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('throws if useAuth is used outside of AuthProvider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Broken = () => {
      useAuth();
      return null;
    };
    expect(() => render(<Broken />)).toThrow('useAuth must be used within an AuthProvider');
    errorSpy.mockRestore();
  });
});
