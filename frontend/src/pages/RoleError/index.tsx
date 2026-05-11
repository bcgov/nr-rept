import { Column } from '@carbon/react';
import { type FC } from 'react';

import EmptySection from '@/components/core/EmptySection';

import './index.scss';

const RoleErrorPage: FC = () => {
  return (
    <Column lg={16} md={8} sm={4} className="unauthorized-column__body">
      <EmptySection
        pictogram="UnauthorizedUserAccess"
        title="Unauthorized Access"
        description="You do not have the necessary permissions to view this page."
        className="unauthorized__section"
      />
    </Column>
  );
};

export default RoleErrorPage;
