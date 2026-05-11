import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type FC } from 'react';

import AppRoutes from '@/routes/AppRoutes';

const App: FC = () => {
  return (
    <>
      <AppRoutes />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </>
  );
};

export default App;
