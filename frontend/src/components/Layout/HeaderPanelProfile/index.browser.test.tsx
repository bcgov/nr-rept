import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HeaderPanelProfile from './index';

vi.mock('@/components/Layout/AvatarImage', () => ({
  __esModule: true,
  default: ({ userName, size }: { userName: string; size: string }) => (
    <div data-testid="avatar-image">
      {userName}-{size}
    </div>
  ),
}));

const mockToggleTheme = vi.fn();
const mockLogout = vi.fn();
const mockUser = {
  firstName: 'Jane',
  lastName: 'Doe',
  idpProvider: 'IDIR',
  userName: 'jdoe',
  email: 'jane@example.com',
};

vi.mock('@/context/auth/useAuth', () => ({
  useAuth: () => ({ logout: mockLogout, user: mockUser }),
}));
vi.mock('@/context/theme/useTheme', () => ({
  useTheme: () => ({ theme: 'g100', toggleTheme: mockToggleTheme }),
}));

const renderWithProviders = async () => {
  await act(async () => {
    render(<HeaderPanelProfile />);
  });
};

describe('HeaderPanelProfile', () => {
  it('renders user info and avatar', async () => {
    await renderWithProviders();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('IDIR\\jdoe')).toBeInTheDocument();
    expect(screen.getByText('Email: jane@example.com')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-image')).toHaveTextContent('Jane Doe-large');
  });

  it('calls toggleTheme when Change theme is clicked', async () => {
    await renderWithProviders();
    fireEvent.click(screen.getByText('Change theme'));
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('calls logout when Log out is clicked', async () => {
    await renderWithProviders();
    fireEvent.click(screen.getByText('Log out'));
    expect(mockLogout).toHaveBeenCalled();
  });
});
