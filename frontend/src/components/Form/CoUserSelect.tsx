import { Select, SelectItem } from '@carbon/react';
import { useMemo, type FC } from 'react';

import { useCoUserSearch } from '@/services/rept/admin/hooks';

import type { CoUserDto, CoUserSearch } from '@/services/rept/admin/types';

export type CoUserSelection = {
  id: number | null;
  name: string;
};

export type CoUserSelectProps = {
  id?: string;
  labelText?: string;
  helperText?: string;
  placeholder?: string;
  value?: number | null;
  valueLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  invalidText?: string;
  enableFetch?: boolean;
  onChange: (selection: CoUserSelection) => void;
};

const DEFAULT_CRITERIA: CoUserSearch = Object.freeze({});
const EMPTY_CO_USERS: CoUserDto[] = [];

export const CoUserSelect: FC<CoUserSelectProps> = ({
  id = 'co-user-select',
  labelText = 'Co-use partner',
  helperText = 'Select a co-use partner',
  placeholder = 'Select a co-use partner',
  value = null,
  valueLabel,
  disabled = false,
  invalid = false,
  invalidText,
  enableFetch = true,
  onChange,
}) => {
  const query = useCoUserSearch(DEFAULT_CRITERIA, { enabled: enableFetch });
  const coUsers = query.data ?? EMPTY_CO_USERS;

  const options = useMemo(() => {
    if (value === null || value === undefined || !valueLabel) {
      return coUsers;
    }
    const exists = coUsers.some((option) => option.id === value);
    if (exists) {
      return coUsers;
    }
    return [{ id: value, name: valueLabel, external: false }, ...coUsers] satisfies CoUserDto[];
  }, [coUsers, value, valueLabel]);

  const resolvedValue = value === null || value === undefined ? '' : String(value);
  const isLoading = enableFetch && query.isPending;
  const isErrored = enableFetch && query.isError;
  const resolvedHelper = isErrored
    ? 'Failed to load co-use partners'
    : isLoading
      ? 'Loading co-use partners...'
      : helperText;
  const isDisabled = disabled || !enableFetch || isLoading || isErrored;

  return (
    <Select
      id={id}
      labelText={labelText}
      value={resolvedValue}
      onChange={(event) => {
        const { value: selectedValue } = event.target;
        if (!selectedValue) {
          onChange({ id: null, name: '' });
          return;
        }
        const parsedId = Number(selectedValue);
        if (Number.isNaN(parsedId)) {
          onChange({ id: null, name: '' });
          return;
        }
        const match = options.find((option) => option.id === parsedId);
        onChange({ id: parsedId, name: match?.name ?? '' });
      }}
      disabled={isDisabled}
      helperText={resolvedHelper}
      invalid={invalid}
      invalidText={invalidText}
    >
      <SelectItem value="" text={isLoading ? 'Loading...' : placeholder} />
      {options.map((option) => (
        <SelectItem key={option.id} value={String(option.id)} text={option.name} />
      ))}
    </Select>
  );
};
