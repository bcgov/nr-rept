import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { AuthProvider } from '@/context/auth/AuthProvider';
import { PreferenceProvider } from '@/context/preference/PreferenceProvider';
import ThemeProvider from '@/context/theme/ThemeProvider';

import { LayoutHeaderPanel } from './index';

vi.mock('@/context/layout/useLayout', () => ({
  useLayout: () => ({
    isHeaderPanelOpen: true,
    closeHeaderPanel: vi.fn(),
  }),
}));

const renderWithProviders = async () => {
  const qc = new QueryClient();
  await act(async () =>
    render(
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <PreferenceProvider>
            <ThemeProvider>
              <LayoutHeaderPanel />
            </ThemeProvider>
          </PreferenceProvider>
        </AuthProvider>
      </QueryClientProvider>,
    ),
  );
};

describe('LayoutHeaderPanel', () => {
  it('renders when open', async () => {
    await renderWithProviders();
    expect(screen.getByTestId('header-panel')).toBeInTheDocument();
  });
});
