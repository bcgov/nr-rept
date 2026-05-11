import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import { LayoutHeader } from '@/components/Layout/LayoutHeader';
import { AuthProvider } from '@/context/auth/AuthProvider';
import { LayoutProvider } from '@/context/layout/LayoutProvider';
import { PreferenceProvider } from '@/context/preference/PreferenceProvider';
import ThemeProvider from '@/context/theme/ThemeProvider';

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

    const toggleButton = await screen.findByLabelText(/open menu/i);
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    // After toggling once, aria-label should change to "Close menu"
    expect(screen.getByLabelText(/close menu/i)).toBeInTheDocument();
  });
});
