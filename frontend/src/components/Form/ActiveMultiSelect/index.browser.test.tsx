import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, vi } from 'vitest';

import ActiveMultiSelect from './index';

const items = [
  { code: 'A', description: 'Alpha' },
  { code: 'B', description: 'Beta' },
  { code: 'C', description: 'Gamma' },
];

describe('ActiveMultiSelect', () => {
  it('renders with placeholder and items', async () => {
    render(
      <ActiveMultiSelect
        placeholder="Select..."
        id="test-multiselect"
        items={items}
        itemToString={(item) => (item ? `${item.code} - ${item.description}` : '')}
        onChange={vi.fn()}
        selectedItems={[]}
      />,
    );
    const button = (await screen.findAllByTitle('Open'))[0] as HTMLButtonElement;
    await act(async () => button.click());
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('placeholder', 'Select...');
    expect(screen.getByText('A - Alpha')).toBeInTheDocument();
    expect(screen.getByText('B - Beta')).toBeInTheDocument();
    expect(screen.getByText('C - Gamma')).toBeInTheDocument();
  });

  it('calls onChange when an item is selected', async () => {
    const onChange = vi.fn();
    render(
      <ActiveMultiSelect
        placeholder="Select..."
        id="test-multiselect"
        items={items}
        itemToString={(item) => (item ? `${item.code} - ${item.description}` : '')}
        onChange={onChange}
        selectedItems={[]}
      />,
    );
    const button = (await screen.findAllByTitle('Open'))[0] as HTMLButtonElement;
    await act(async () => button.click());
    await act(async () => fireEvent.click(screen.getByText('A - Alpha')));
    // This assumes your component calls onChange when an item is clicked
    expect(onChange).toHaveBeenCalled();
  });

  it('shows selected items', async () => {
    render(
      <ActiveMultiSelect
        placeholder="Select..."
        id="test-multiselect"
        items={items}
        itemToString={(item) => (item ? `${item.code} - ${item.description}` : '')}
        onChange={vi.fn()}
        selectedItems={[items[1]]}
      />,
    );
    const button = (await screen.findAllByTitle('Open'))[0] as HTMLButtonElement;
    await act(async () => button.click());
    expect(screen.getByText('B - Beta')).toBeInTheDocument();
  });
});
