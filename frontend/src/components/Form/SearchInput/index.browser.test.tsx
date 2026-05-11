import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import SearchInput from './index'; // co-located with the component (e.g., index.tsx)

/**
 * Browser component tests
 * - Runs with Playwright provider via @vitest/browser
 * - setup-files: src/config/tests/setup-browser.ts + custom-matchers.ts
 */

const setup = (overrides: Partial<React.ComponentProps<typeof SearchInput>> = {}) => {
  const props = {
    id: 'search-input',
    label: 'Search',
    placeholder: 'Search...',
    value: '',
    onChange: vi.fn(),
    ...overrides,
  };
  render(<SearchInput {...props} />);
  const input = screen.getByRole('searchbox', { name: props.placeholder });

  return { props, input };
};

describe('SearchInput (browser)', () => {
  it('renders with accessible label and placeholder', () => {
    const { props } = setup();
    // Root wrapper rendered
    expect(screen.getByTestId(props.id)).toBeInTheDocument();
    // Input is labeled for accessibility
    expect(screen.getByRole('searchbox', { name: props.placeholder })).toBeInTheDocument();
    // Clear button (from Carbon) should be present by its accessible name
    expect(screen.getByLabelText('Clear search input')).toBeInTheDocument();
  });

  it('calls onChange with typed value when Enter blurs the input', async () => {
    const { input, props } = setup({ value: '' });
    await userEvent.type(input, 'hello{enter}');
    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onChange on blur with the current value (without pressing Enter)', async () => {
    const { input, props } = setup({ value: '' });
    await userEvent.type(input, 'carbon');
    // Trigger blur explicitly; component onKeyDown handles Enter, but blur should work as well
    (input as HTMLInputElement).blur();
    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith('carbon');
  });

  it('respects initial default value and appends typed text', async () => {
    const { input, props } = setup({ value: 'abc' });
    await userEvent.type(input, '123{enter}');
    expect(props.onChange).toHaveBeenCalledWith('abc123');
  });
});
