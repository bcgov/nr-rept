import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { AuthProvider } from '@/context/auth/AuthProvider';
import { LayoutProvider } from '@/context/layout/LayoutProvider';
import { PreferenceProvider } from '@/context/preference/PreferenceProvider';
import ThemeProvider from '@/context/theme/ThemeProvider';
import APIs from '@/services/APIs';

import Layout from './index';

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
          path: '/settings/profile',
          isMenuItem: true,
        },
      ],
    },
  ],
}));

vi.mock('@/services/APIs', () => {
  return {
    default: {
      user: {
        getUserPreferences: vi.fn(),
        updateUserPreferences: vi.fn(),
      },
    },
  };
});

// Dummy child component for testing
const DummyChild = () => <div data-testid="dummy-child">Hello Child</div>;

describe('Layout (browser)', () => {
  it('renders header, grid, and children', async () => {
    (APIs.user.getUserPreferences as vi.Mock).mockResolvedValue({ theme: 'g10' });

    const qc = new QueryClient();
    await act(async () =>
      render(
        <AuthProvider>
          <BrowserRouter>
            <QueryClientProvider client={qc}>
              <PreferenceProvider>
                <ThemeProvider>
                  <LayoutProvider>
                    <Layout>
                      <DummyChild />
                    </Layout>
                  </LayoutProvider>
                </ThemeProvider>
              </PreferenceProvider>
            </QueryClientProvider>
          </BrowserRouter>
        </AuthProvider>,
      ),
    );

    // Header
    expect(document.querySelector('.cds--header')).not.toBeNull();
    // Content body
    expect(document.querySelector('.cds--content')).not.toBeNull();
    // Grid
    expect(document.querySelector('.layout-grid')).not.toBeNull();
    // Children
    expect(screen.getByTestId('dummy-child').textContent).toBe('Hello Child');
  });
});
