import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, afterEach, it, expect } from 'vitest';

import * as useAuthModule from '@/context/auth/useAuth';

import ProtectedRoute from './ProtectedRoute';

vi.mock('@/context/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login if user is not authenticated', () => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });

    const { container } = render(
      <MemoryRouter initialEntries={['/private']}>
        <ProtectedRoute>
          <div>Private Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    // Should render a Navigate component (no children rendered)
    expect(container.textContent).not.toContain('Private Content');
  });

  it('redirects to /unauthorized if user lacks required role', () => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { roles: ['user'] },
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute roles={['admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(container.textContent).not.toContain('Admin Content');
  });

  it('renders children if user is authenticated and has required role', () => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { roles: ['admin', 'user'] },
    });

    const { getByText } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <ProtectedRoute roles={['admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(getByText('Admin Content')).toBeTruthy();
  });

  it('renders children if user is authenticated and no roles are required', () => {
    (useAuthModule.useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { roles: ['user'] },
    });

    const { getByText } = render(
      <MemoryRouter initialEntries={['/private']}>
        <ProtectedRoute>
          <div>Private Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(getByText('Private Content')).toBeTruthy();
  });
});
