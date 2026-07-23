import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { LayoutHeader } from '@/components/Layout/LayoutHeader';
import { AuthProvider } from '@/context/auth/AuthProvider';
import { LayoutProvider } from '@/context/layout/LayoutProvider';
import { PreferenceProvider } from '@/context/preference/PreferenceProvider';
import ThemeProvider from '@/context/theme/ThemeProvider';

// Pin the app name so the header text assertion below isn't sensitive to
// what gets loaded from .env in the test runner. `vi.mock` is hoisted, so
// placing it below the imports is purely a style-rule fix (import/first);
// it still runs before any of the imported modules execute.
vi.mock('@/env', () => ({
  env: { VITE_APP_NAME: 'Real Estate Project Tracking' },
}));

const renderWithProviders = async () => {
  const qc = new QueryClient();
  await act(async () =>
    render(
      <AuthProvider>
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <PreferenceProvider>
              <ThemeProvider>
                <LayoutProvider>
                  <LayoutHeader />
                </LayoutProvider>
              </ThemeProvider>
            </PreferenceProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </AuthProvider>,
    ),
  );
};

describe('LayoutHeader', () => {
  it('renders header with title Real Estate Project Tracking', async () => {
    await renderWithProviders();
    const header = await screen.findByTestId('bc-header__header');
    expect(header).toBeInTheDocument();

    const title = await screen.findByText(/Real Estate Project Tracking/i);
    expect(title).toBeInTheDocument();
  });

  it('toggles side nav when menu button is clicked', async () => {
    await renderWithProviders();

    // The nav is popped out by default, so the menu button starts as "Close menu".
    const toggleButton = await screen.findByLabelText(/close menu/i);
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    // After pulling the nav back, the aria-label flips to "Open menu".
    expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument();
  });
});
