import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import TagWrapper from './TagWrapper';

import type { ReactElement } from 'react';

type TagWrapperProps = React.ComponentProps<typeof TagWrapper>;

const renderTagWrapper = (
  props: Omit<TagWrapperProps, 'children'> & { children?: ReactElement } = {
    children: <span>Wrapped Tag</span>,
  },
) => {
  const { children = <span>Wrapped Tag</span>, ...rest } = props;
  return render(<TagWrapper {...rest}>{children}</TagWrapper>);
};

describe('TagWrapper (browser)', () => {
  it('renders children inside the wrapper', () => {
    renderTagWrapper({ children: <span>Test Tag</span> });
    expect(screen.getByText('Test Tag')).toBeInTheDocument();
  });
  it('applies the correct class', () => {
    renderTagWrapper();
    const wrapper = screen.getByText('Wrapped Tag').parentElement;
    expect(wrapper).toHaveClass('under-const-wrapper');
  });
  it('renders the tag before the child when position is left', () => {
    renderTagWrapper({ position: 'left', children: <span data-testid="child">Child</span> });
    const wrapper = screen.getByTestId('child').parentElement;
    // The first element child should be the tag (with text 'Under construction')
    expect(wrapper?.firstChild?.textContent?.toLowerCase()).toContain('under construction');
    expect(wrapper?.lastChild).toBe(screen.getByTestId('child'));
  });
  it('renders the tag after the child when position is right (default)', () => {
    renderTagWrapper({ position: 'right', children: <span data-testid="child">Child</span> });
    const wrapper = screen.getByTestId('child').parentElement;
    // The last element child should be the tag (with text 'Under construction')
    expect(wrapper?.lastChild?.textContent?.toLowerCase()).toContain('under construction');
    expect(wrapper?.firstChild).toBe(screen.getByTestId('child'));
  });
  it('renders any children passed to it', () => {
    renderTagWrapper({ children: <span data-testid="custom-child">Child Content</span> });
    expect(screen.getByTestId('custom-child')).toHaveTextContent('Child Content');
  });
});
