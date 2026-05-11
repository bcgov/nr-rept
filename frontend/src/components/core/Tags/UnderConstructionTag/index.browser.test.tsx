import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import UnderConstructionTag from './index';

// Helper to render the tag with props
const renderTag = (props = {}) => {
  render(<UnderConstructionTag {...props} />);
};

describe('UnderConstructionTag (browser)', () => {
  it('renders the default under construction tag', () => {
    renderTag();
    expect(screen.getByText(/under construction/i)).toBeInTheDocument();
  });

  it('shows correct tooltip label for page type', () => {
    renderTag({ type: 'page' });
    // Tooltip label is rendered in the DOM, but may be hidden; check for its presence
    expect(screen.getByText(/this page is under development/i)).toBeInTheDocument();
  });

  it('shows correct tooltip label for feature type', () => {
    renderTag({ type: 'feature' });
    expect(screen.getByText(/this feature is under development/i)).toBeInTheDocument();
  });
});
