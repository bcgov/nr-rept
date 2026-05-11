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

  it('renders protected routes if logged in', async () => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isLoading: false,
      isLoggedIn: true,
    });

    render(
      <PageTitleProvider>
        <AppRoutes />
      </PageTitleProvider>,
    );

    const content = await screen.findByText('Protected Page');
    expect(content).toBeTruthy();
  });
});
