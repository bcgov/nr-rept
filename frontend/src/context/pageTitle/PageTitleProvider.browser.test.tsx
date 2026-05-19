import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PageTitleProvider } from './PageTitleProvider';
import { usePageTitle } from './usePageTitle';

// The component reads env.VITE_APP_NAME and joins it with the page title.
// vite.config's `test.env` doesn't propagate into project-scoped browser
// tests, so we mock the env module to provide a deterministic value.
vi.mock('@/env', () => ({
  env: { VITE_APP_NAME: 'Real Estate Project Tracking' },
}));

describe('PageTitleProvider', () => {
  function TestComponent() {
    const { pageTitle, setPageTitle } = usePageTitle();
    return (
      <div>
        <span data-testid="page-title">{pageTitle}</span>
        <button onClick={() => setPageTitle('New Title')}>Set Title</button>
      </div>
    );
  }

  it('provides a default page title', () => {
    render(
      <PageTitleProvider>
        <TestComponent />
      </PageTitleProvider>,
    );
    expect(screen.getByTestId('page-title').textContent).toBe('Vitest Browser Tester');
  });

  it('updates the page title when setPageTitle is called', async () => {
    render(
      <PageTitleProvider>
        <TestComponent />
      </PageTitleProvider>,
    );
    await act(async () => screen.getByText('Set Title').click());
    expect(screen.getByTestId('page-title').textContent).toBe(
      'Real Estate Project Tracking - New Title',
    );
  });

  it('shares the page title across multiple consumers', async () => {
    function AnotherComponent() {
      const { pageTitle } = usePageTitle();
      return <span data-testid="another-title">{pageTitle}</span>;
    }
    render(
      <PageTitleProvider>
        <TestComponent />
        <AnotherComponent />
      </PageTitleProvider>,
    );
    await act(async () => screen.getByText('Set Title').click());
    expect(screen.getByTestId('another-title').textContent).toBe(
      'Real Estate Project Tracking - New Title',
    );
  });

  it('should fail if no provider is present', () => {
    expect(() => render(<TestComponent />)).toThrow(
      'usePageTitle must be used within a PageTitleProvider',
    );
  });
});
