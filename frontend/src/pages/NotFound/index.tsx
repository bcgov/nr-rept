import { Column } from '@carbon/react';
import { type FC } from 'react';

import PageTitle from '@/components/core/PageTitle';

const NotFoundPage: FC = () => {
  return (
    <Column lg={16} md={8} sm={4} className="dashboard-column__banner">
      <PageTitle title="Not Found" subtitle="The page you are looking for does not exist." />
    </Column>
  );
};

export default NotFoundPage;
