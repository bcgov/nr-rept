// src/components/PageTitle/PageTitle.browser.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import PageTitleProvider from '@/context/pageTitle/PageTitleProvider';

import PageTitle from './index';

// Helper function to render PageTitle with props
const renderPageTitle = (
  props: React.ComponentProps<typeof PageTitle> & { children?: React.ReactNode },
) => {
  render(
    <MemoryRouter>
      <PageTitleProvider>
        <PageTitle {...props}>{props.children}</PageTitle>
      </PageTitleProvider>
    </MemoryRouter>,
  );
};

describe('PageTitle (browser)', () => {
  it('renders title and subtitle', () => {
    renderPageTitle({ title: 'Test Title', subtitle: 'Test Subtitle' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Title');
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders breadcrumbs', async () => {
    const user = userEvent.setup();

    const breadCrumbs = [
      { name: 'Home', path: '/' },
      { name: 'Dashboard', path: '/dashboard' },
    ];

    renderPageTitle({ title: 'With Breadcrumbs', breadCrumbs });

    const dashboardCrumb = screen.getByText('Dashboard');
    expect(dashboardCrumb).toBeInTheDocument();

    // We're not mocking navigation here — just verifying it doesn't crash
    await user.click(dashboardCrumb);
  });

  it('renders the experimental tag when experimental is true', () => {
    renderPageTitle({ title: 'Experimental Page', experimental: true });
    // UnderConstructionTag renders a tag with text 'Under Construction' by default
    expect(screen.getByText(/under construction/i)).toBeInTheDocument();
  });

  it('renders children components', () => {
    renderPageTitle({
      title: 'With Children',
      children: <span data-testid="custom-child">Child Content</span>,
    });
    expect(screen.getByTestId('custom-child')).toHaveTextContent('Child Content');
  });
});
