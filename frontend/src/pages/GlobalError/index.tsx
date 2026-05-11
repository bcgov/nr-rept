/* eslint-disable @typescript-eslint/no-explicit-any */
import { Column } from '@carbon/react';
import { type FC } from 'react';
import { useRouteError } from 'react-router-dom';

import PageTitle from '@/components/core/PageTitle';

const GlobalErrorPage: FC = () => {
  //TODO: THis receives the actual error
  //It would be nice to handle all kinds of error here to show a specific message
  //Another idea would be to try to wrap any kind of error in a particular error like in Java
  //And handle it appropriately, with an error code or something similar
  const error = useRouteError();

  let message = 'An unexpected error has occurred. Please try again later.';
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && error !== null && 'statusText' in error) {
    message = (error as { statusText?: string }).statusText ?? message;
  }

  return (
    <Column lg={16} md={8} sm={4} className="dashboard-column__banner">
      <PageTitle title="Global Error" subtitle={message} />
      {/* Optionally show stack trace or more details */}
      {error && (error as any).stack && (
        <pre style={{ color: 'red', marginTop: '1rem' }}>{(error as any).stack}</pre>
      )}
    </Column>
  );
};

export default GlobalErrorPage;
