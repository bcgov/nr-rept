import { ComboBox } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import { type FC, useEffect, useMemo } from 'react';

import { useNotification } from '@/context/notification/useNotification';
import { searchOrgUnits } from '@/services/rept/admin/api';

import { describeOrgUnit } from './sectionUtils';

import type { OrgUnitSearchResult } from '@/services/rept/admin/types';

export type OrgUnitSelectorProps = {
  id: string;
  labelText: string;
  value?: OrgUnitSearchResult | null;
  onChange: (unit: OrgUnitSearchResult | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

const OrgUnitSelector: FC<OrgUnitSelectorProps> = ({
  id,
  labelText,
  value = null,
  onChange,
  disabled,
  placeholder = 'Type to search org units…',
}) => {
  const { display } = useNotification();
  const {
    data: results = [],
    isFetching,
    isError,
    error,
  } = useQuery<OrgUnitSearchResult[]>({
    queryKey: ['org-units', 'all'],
    queryFn: async () => {
      const response = await searchOrgUnits({ query: '' });
      return response ?? [];
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (isError) {
      display({
        kind: 'error',
        title: 'Unable to load org units',
        subtitle: error instanceof Error ? error.message : 'Unknown error',
        timeout: 9000,
      });
    }
  }, [isError, error, display]);

  // Make sure the currently selected unit is always selectable, even if it
  // somehow isn't in the loaded list.
  const items = useMemo(() => {
    if (!value || !value.number) return results;
    if (results.some((unit) => unit.number === value.number)) return results;
    return [value, ...results];
  }, [results, value]);

  const selectedItem = useMemo(() => {
    if (!value || !value.number) return null;
    return items.find((unit) => unit.number === value.number) ?? value;
  }, [items, value]);

  return (
    <ComboBox
      id={id}
      titleText={labelText}
      placeholder={isFetching ? 'Loading org units…' : placeholder}
      items={items}
      itemToString={(item) => (item ? describeOrgUnit(item) : '')}
      selectedItem={selectedItem}
      onChange={({ selectedItem: next }) => onChange(next ?? null)}
      disabled={disabled || isFetching}
      autoAlign
      shouldFilterItem={({ item, inputValue, itemToString: toStr }) => {
        if (!inputValue) return true;
        const text = toStr ? toStr(item) : '';
        return text.toLowerCase().includes(inputValue.toLowerCase());
      }}
    />
  );
};

export default OrgUnitSelector;
