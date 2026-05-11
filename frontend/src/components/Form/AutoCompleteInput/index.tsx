import { ComboBox, type ComboBoxProps } from '@carbon/react';
import { Loading } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import useDebounce from '@/hooks/useDebounce';

type AutoCompleteProps<T> = {
  /**
   * The amount of time in milliseconds to wait before making the API call after the user stops typing.
   * This is used to reduce the number of API calls made while the user is typing.
   * Default is 300ms.
   */
  debounceTime?: number;
  /**
   * Function to extract items from the raw data returned by the autocomplete service.
   * This is used to transform the raw data into a format suitable for display in the ComboBox,
   * as sometimes the raw data may not directly match a list of items, like a page of results for example.
   * @param raw The raw data returned by the service
   * @returns An array of items to display in the autocomplete dropdown
   *
   * @example
   * extractItems: (raw) => (raw as PaginatedResult<ActualTValue>).results.map((data) => data)
   */
  extractItems?: (raw: unknown) => T[];
  /**
   * Function to call when the input value changes
   * @param value The current input value
   * @returns A promise that resolves with the autocomplete suggestions
   *
   * @example
   * onAutoCompleteChange: async (value) => await API.Service.function(value)
   */
  onAutoCompleteChange: (value: string) => Promise<unknown>;
  /**
   * Callback function to handle item selection.
   * This is called when the user selects an item from the autocomplete suggestions.
   * @param data The selected item data
   */
  onSelect: (data: T | null | undefined) => void;
} & Omit<ComboBoxProps<T>, 'items' | 'onChange' | 'onInputChange'>;

/**
 * A reusable autocomplete input component that uses Carbon's ComboBox.
 * It fetches suggestions based on user input and allows selection of items.
 * This component is generic and can be used with any type of data.
 * It uses a debounced input to reduce the number of API calls.
 * Some props are omitted from ComboBoxProps as they are reimplemented internally,
 * such as `items`, `onChange`, and `onInputChange`.
 * There is a default implementation for `itemToString` that converts the item to
 * a string for display in the ComboBox, but this can be overridden by the user.
 *
 * @template T The type of the items in the autocomplete dropdown.
 * @param {number} [debounceTime=300] - The amount of time in milliseconds to wait before making the API call after the user stops typing.
 * @param {(value: string) => Promise<unknown>} onAutoCompleteChange - Function to call when the input value changes.
 * @param {(raw: unknown) => T[]} [extractItems] - Function to extract items from the raw data returned by the autocomplete service.
 * @param {(data: T | null | undefined) => void} onSelect - Callback function to handle item selection.
 * @returns {JSX.Element} A ComboBox component with autocomplete functionality.
 */
const AutoCompleteInput = <T,>({
  debounceTime = 300,
  onAutoCompleteChange,
  extractItems = (raw) => raw as T[],
  onSelect,
  ...props
}: AutoCompleteProps<T>) => {
  const [typedValue, setTypedValue] = useState<string>('');
  const debounce = useDebounce<string>(typedValue, debounceTime);

  const { data, isLoading } = useQuery({
    queryKey: ['autocomplete', props.id, debounce],
    queryFn: async () => await onAutoCompleteChange(debounce),
    staleTime: 30000,
    enabled: debounce.length >= 2,
  });

  /**
   * Converts an item to a string for display in the ComboBox.
   * This is used to display the selected item in the input field.
   * If the item is null or undefined, it returns an empty string.
   * If the item is a string, it returns the string directly.
   * If the item is an object with a 'name' property, it returns that name.
   * Otherwise, it returns the JSON string representation of the item.
   * @param item The item to convert to a string for display in the ComboBox
   * @returns The string representation of the item
   */
  const localItemToString = (item: T | null | undefined): string => {
    if (!item) {
      return '';
    }
    if (typeof item === 'string') {
      return item;
    }
    if (typeof item === 'object' && 'name' in item) {
      return (item as { name: string }).name;
    }
    return JSON.stringify(item);
  };

  let items: T[] = [];
  if (isLoading) {
    items = [{ id: '__loading', name: 'Loading...', disabled: true } as unknown as T];
  } else if (data && extractItems(data).length > 0) {
    items = extractItems(data);
  } else if (!isLoading && data && extractItems(data).length === 0) {
    items = [
      {
        id: '__empty',
        name: 'No results found, please try again.',
        disabled: true,
      } as unknown as T,
    ];
  }

  const itemToElement = (item: T) => {
    // Type guard for dummy entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asAny = item as any;
    if (asAny.id === '__loading') {
      return (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <Loading small withOverlay={false} />
          <span>Loading...</span>
        </div>
      );
    }
    if (asAny.id === '__empty') {
      return (
        <div style={{ padding: '0.5rem 1rem', color: '#999' }}>
          <span>No data found.</span>
        </div>
      );
    }
    // Default rendering
    if (typeof item === 'string') {
      return <span>{item}</span>;
    }
    return <span>{props.itemToString ? props.itemToString(item) : localItemToString(item)}</span>;
  };

  return (
    <ComboBox
      itemToString={localItemToString}
      itemToElement={itemToElement}
      className="autocomplete-combobox"
      {...props}
      items={items}
      onChange={(selectedItem) => onSelect(selectedItem as T | null | undefined)}
      onInputChange={setTypedValue}
    />
  );
};

export default AutoCompleteInput;
