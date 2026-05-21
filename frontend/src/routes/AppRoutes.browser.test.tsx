import { render, screen } from '@testing-library/react';
import { vi, describe, afterEach, it, expect } from 'vitest';

import * as useAuthModule from '@/context/auth/useAuth';
import PageTitleProvider from '@/context/pageTitle/PageTitleProvider';

import AppRoutes from './AppRoutes';

vi.mock('@/context/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/routes/routePaths', () => ({
  getPublicRoutes: () => [{ path: '/', element: <div>Public Page</div> }],
  getNoRoleRoutes: () => [{ path: '/', element: <div>No Role Page</div> }],
  getProtectedRoutes: () => [{ path: '/', element: <div>Protected Page</div> }],
}));

describe('AppRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner when auth is loading', () => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isLoading: true,
      isLoggedIn: false,
    });

    render(
      <PageTitleProvider>
        <AppRoutes />
      </PageTitleProvider>,
    );

    const status = screen.getByTestId('loading');
    expect(status).toBeTruthy();
    expect(status.textContent?.toLowerCase()).toContain('loading');
  });

  it('renders public routes if not logged in', async () => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isLoading: false,
      isLoggedIn: false,
    });

    render(
      <PageTitleProvider>
        <AppRoutes />
      </PageTitleProvider>,
    );

    const content = await screen.findByText('Public Page');
    expect(content).toBeTruthy();
  });

  it('renders protected routes if logged in with a recognized role', async () => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isLoading: false,
      isLoggedIn: true,
      user: { roles: ['REPT_VIEWER'] },
    });

    render(
      <PageTitleProvider>
        <AppRoutes />
      </PageTitleProvider>,
    );

    const content = await screen.findByText('Protected Page');
    expect(content).toBeTruthy();
  });

  it('renders no-role routes if logged in without any recognized role', async () => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isLoading: false,
      isLoggedIn: true,
      user: { roles: [] },
    });

    render(
      <PageTitleProvider>
        <AppRoutes />
      </PageTitleProvider>,
    );

    const content = await screen.findByText('No Role Page');
    expect(content).toBeTruthy();
  });
});
