import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Subtitle from './index';

describe('Subtitle', () => {
  it('renders the text prop as string', () => {
    render(<Subtitle text="Test Subtitle" />);
    const p = screen.getByText('Test Subtitle');
    expect(p).not.toBeNull();
    expect(p.tagName).toBe('P');
    expect(p).toHaveClass('subtitle-section');
  });

  it('renders the text prop as ReactNode', () => {
    render(<Subtitle text={<span>Node Subtitle</span>} />);
    const span = screen.getByText('Node Subtitle');
    expect(span).not.toBeNull();
    expect(span.tagName).toBe('SPAN');
    expect(span.parentElement).toHaveClass('subtitle-section');
  });

  it('applies custom className', () => {
    render(<Subtitle text="With Class" className="custom-class" />);
    const p = screen.getByText('With Class');
    expect(p).toHaveClass('custom-class');
    expect(p).toHaveClass('subtitle-section');
  });
});
