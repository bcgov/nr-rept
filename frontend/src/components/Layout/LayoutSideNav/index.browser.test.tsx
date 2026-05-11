import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { AuthProvider } from '@/context/auth/AuthProvider';

import { LayoutSideNav } from './index';

vi.mock('@/context/layout/useLayout', () => ({
  useLayout: () => ({ isSideNavExpanded: true }),
}));

vi.mock('@/routes/routePaths', () => ({
  getMenuEntries: () => [
    {
      id: 'Dashboard',
      path: '/dashboard',
      isMenuItem: true,
    },
    {
      id: 'Settings',
      path: '/settings',
      isMenuItem: true,
      children: [
        {
          id: 'Profile',
          path: 'profile',
          isMenuItem: true,
        },
      ],
    },
  ],
}));

const renderWithProviders = async (pathname = '/dashboard') => {
  window.history.pushState({}, '', pathname);
  await act(async () =>
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={[pathname]}>
          <LayoutSideNav />
        </MemoryRouter>
      </AuthProvider>,
    ),
  );
};

describe('LayoutSideNav', () => {
  it('renders menu links and menu items', async () => {
    await renderWithProviders('/dashboard');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('marks the correct link as active', async () => {
    await renderWithProviders('/settings/profile');
    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink).toHaveClass('cds--side-nav__link--current');
  });
});
