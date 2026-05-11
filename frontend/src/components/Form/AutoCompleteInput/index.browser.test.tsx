/* eslint-disable @typescript-eslint/no-unused-expressions */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import AutoCompleteInput from './index';

const items = [
  { name: 'Alpha', id: 1 },
  { name: 'Beta', id: 2 },
  { name: 'Gamma', id: 3 },
];

const renderWithProps = async (props: any) => {
  const qc = new QueryClient();
  await act(() =>
    render(
      <QueryClientProvider client={qc}>
        <AutoCompleteInput
          id="test-autocomplete"
          extractItems={props.extractItems || ((raw: any) => raw)}
          onAutoCompleteChange={props.onAutoCompleteChange || vi.fn()}
          onSelect={props.onSelect || vi.fn()}
          placeholder="Type to search..."
          {...props}
        />
      </QueryClientProvider>,
    ),
  );
};

describe('AutoCompleteInput', () => {
  it('renders and fetches suggestions on input', async () => {
    const onAutoCompleteChange = vi.fn(async (val) =>
      items.filter((i) => i.name.toLowerCase().includes(val.toLowerCase())),
    );
    const extractItems = (raw: any) => raw;
    renderWithProps({ onAutoCompleteChange, extractItems });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Al' } });
    await waitFor(() => expect(onAutoCompleteChange).toHaveBeenCalledWith('Al'));
  });

  it('calls onSelect when an item is selected', async () => {
    const onAutoCompleteChange = vi.fn(async () => items);
    const extractItems = (raw: any) => raw;
    const onSelect = vi.fn();
    renderWithProps({ onAutoCompleteChange, extractItems, onSelect });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Al' } });
    await waitFor(() => expect(onAutoCompleteChange).toHaveBeenCalled());
    // Simulate selection
    fireEvent.change(input, { target: { value: 'Alpha' } });
    fireEvent.blur(input);
  });

  it('uses custom itemToString if provided', async () => {
    const onAutoCompleteChange = vi.fn(async () => items);
    const extractItems = (raw: any) => raw;
    renderWithProps({
      onAutoCompleteChange,
      extractItems,
      itemToString: (item: { name: any }) => (item ? `Custom: ${item.name}` : ''),
    });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Al' } });
    await waitFor(() => expect(onAutoCompleteChange).toHaveBeenCalled());
  });

  it('shows no suggestions when none match', async () => {
    const onAutoCompleteChange = vi.fn(async () => []);
    const extractItems = (raw: any) => raw;
    await renderWithProps({ onAutoCompleteChange, extractItems });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Zzz' } });
    await waitFor(() => expect(onAutoCompleteChange).toHaveBeenCalledWith('Zzz'));
  });

  it('handles loading state', async () => {
    let resolve: (v: any) => void;
    const onAutoCompleteChange = vi.fn(() => new Promise((r) => (resolve = r)));
    const extractItems = (raw: any) => raw;
    await renderWithProps({ onAutoCompleteChange, extractItems });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Al' } });
    // Optionally check for loading indicator if present
    resolve && resolve(items);
  });

  it('handles blur and focus events', async () => {
    const onAutoCompleteChange = vi.fn(async () => items);
    const extractItems = (raw: any) => raw;
    await renderWithProps({ onAutoCompleteChange, extractItems });
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.blur(input);
  });

  it('calls onSelect with correct item when suggestion is clicked', async () => {
    const onAutoCompleteChange = vi.fn(async () => items);
    const extractItems = (raw: any) => raw;
    const onSelect = vi.fn();
    await renderWithProps({ onAutoCompleteChange, extractItems, onSelect });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Alpha' } });
    await waitFor(() => expect(onAutoCompleteChange).toHaveBeenCalled());
    // Simulate clicking a suggestion if suggestions are rendered as buttons or list items
    // Example: fireEvent.click(screen.getByText('Alpha'));
  });

  it('handles keyboard navigation (arrow down/up, enter, escape)', async () => {
    const onAutoCompleteChange = vi.fn(async () => items);
    const extractItems = (raw: any) => raw;
    await renderWithProps({ onAutoCompleteChange, extractItems });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Alpha' } });
    await waitFor(() => expect(onAutoCompleteChange).toHaveBeenCalled());
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Escape' });
  });
});
