import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';

import { useTheme } from '@/context/theme/useTheme';

import ThemeToggle from './index';

vi.mock('@/context/theme/useTheme');

describe('ThemeToggle', () => {
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'white',
      toggleTheme: mockToggleTheme,
    });
  });

  it('renders with light icon when theme is white', () => {
    (useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'white',
      toggleTheme: mockToggleTheme,
    });
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    // LightFilled icon should be present
    expect(document.querySelector('.icon')).toBeInTheDocument();
  });

  it('renders with asleep icon when theme is not white', () => {
    (useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
    });
    render(<ThemeToggle />);
    expect(document.querySelector('.icon')).toBeInTheDocument();
  });

  it('calls toggleTheme on click', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('calls toggleTheme on Enter key', () => {
    render(<ThemeToggle />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('calls toggleTheme on Space key', () => {
    render(<ThemeToggle />);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(mockToggleTheme).toHaveBeenCalled();
  });
});
