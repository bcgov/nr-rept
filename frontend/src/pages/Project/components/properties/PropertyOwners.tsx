import { SkeletonText } from '@carbon/react';
import { type FC } from 'react';

import { MISSING_VALUE } from '../../utils';

import type { ReptPropertyOwnersEntry } from '@/services/rept/hooks';

type PropertyOwnersProps = {
  entry?: ReptPropertyOwnersEntry;
};

const PropertyOwners: FC<PropertyOwnersProps> = ({ entry }) => {
  if (!entry) return <>{MISSING_VALUE}</>;
  if (entry.isLoading) return <SkeletonText width="80%" />;
  if (entry.owners.length === 0) return <>{MISSING_VALUE}</>;
  return (
    <ul className="property-owners">
      {entry.owners.map((name, idx) => (
        <li key={`${name}-${idx}`} className="property-owners__item" title={name}>
          <span className="property-owners__name">{name}</span>
        </li>
      ))}
    </ul>
  );
};

export default PropertyOwners;
