import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';

import { PreferenceProvider } from '@/context/preference/PreferenceProvider';
import { CARBON_THEMES, type UserPreference } from '@/context/preference/types';

import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';

const seedStoredPreference = (preference: UserPreference) => {
  window.localStorage.setItem('userPreference', JSON.stringify(preference));
};

const TestComponent = () => {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={() => setTheme('g100')}>Set g100</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
};

const renderWithProviders = async () => {
  const qc = new QueryClient();
  await act(async () =>
    render(
      <QueryClientProvider client={qc}>
        <PreferenceProvider>
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        </PreferenceProvider>
      </QueryClientProvider>,
    ),
  );
};

describe('ThemeContext', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('hydrates the theme from stored user preferences', async () => {
    seedStoredPreference({ theme: 'g10' });
    await renderWithProviders();
    // Preference query is async; wait for the provider to sync.
    await waitFor(() => {
      expect(screen.getByTestId('theme-value').textContent).toBe('g10');
    });
  });

  it('setTheme changes the theme', async () => {
    seedStoredPreference({ theme: 'g10' });
    await renderWithProviders();
    act(() => screen.getByText('Set g100').click());
    expect(CARBON_THEMES).toContain(screen.getByTestId('theme-value').textContent);
    expect(screen.getByTestId('theme-value').textContent).toBe('g100');
  });

  it('toggleTheme toggles between white and g100', async () => {
    seedStoredPreference({ theme: 'white' });
    await renderWithProviders();

    // Wait for the preference-driven 'white' default to settle.
    await waitFor(() => {
      expect(screen.getByTestId('theme-value').textContent).toBe('white');
    });

    // Toggle should flip to g100.
    act(() => screen.getByText('Toggle').click());
    await waitFor(() => {
      expect(screen.getByTestId('theme-value').textContent).toBe('g100');
    });

    // Toggle again should flip back to white.
    act(() => screen.getByText('Toggle').click());
    await waitFor(() => {
      expect(screen.getByTestId('theme-value').textContent).toBe('white');
    });
  });

  it('throws if useTheme is used outside of ThemeProvider', async () => {
    expect(() => render(<TestComponent />)).toThrow('useTheme must be used within a ThemeProvider');
  });
});
