import { MISSING_VALUE } from '../utils';

import type { FC, ReactNode } from 'react';

type Field = {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
};

export type DetailField = Field;

export type FieldListProps = {
  fields: DetailField[];
  keyPrefix: string;
  emptyMessage?: string;
};

export const FieldList: FC<FieldListProps> = ({
  fields,
  keyPrefix,
  emptyMessage = 'No information captured.',
}) => {
  if (!fields.length) {
    return <p className="field-empty">{emptyMessage}</p>;
  }

  return (
    <dl className="field-list">
      {fields.map((field) => (
        <div
          className={`field-item${field.fullWidth ? ' field-item--full' : ''}`}
          key={`${keyPrefix}-${field.label}`}
        >
          <dt>{field.label}</dt>
          <dd>{field.value ?? MISSING_VALUE}</dd>
        </div>
      ))}
    </dl>
  );
};
