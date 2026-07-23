import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type FC } from 'react';

import SessionTimeout from '@/components/SessionTimeout';
import { useAuth } from '@/context/auth/useAuth';
import AppRoutes from '@/routes/AppRoutes';

const App: FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <>
      {/* Inactivity guard — mounted only while a session is live so the warning
          modal + auto-logout apply everywhere. Renders nothing until it fires. */}
      {isLoggedIn && <SessionTimeout />}
      <AppRoutes />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </>
  );
};

export default App;
