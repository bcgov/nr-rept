import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AvatarImage from './index';

describe('AvatarImage', () => {
  it('renders initials for two-part name', () => {
    render(<AvatarImage userName="John Doe" size="large" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText('JD').parentElement).toHaveClass('profile-image large');
  });

  it('renders initials for single-part name', () => {
    render(<AvatarImage userName="Alice" size="small" />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('A').parentElement).toHaveClass('profile-image small');
  });

  it('renders empty initials for empty name', () => {
    render(<AvatarImage userName="" size="small" />);
    const initialsElement = screen.queryByTestId('avatar-initials');
    expect(initialsElement).toHaveTextContent('');
  });

  it('renders only first two initials for names with more than two parts', () => {
    render(<AvatarImage userName="John Michael Doe" size="large" />);
    expect(screen.getByText('JM')).toBeInTheDocument();
  });
});
