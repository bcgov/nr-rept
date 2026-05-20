import { Loading } from '@carbon/react';
import { Suspense, useEffect, useMemo, type FC } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { useAuth } from '@/context/auth/useAuth';
import { usePageTitle } from '@/context/pageTitle/usePageTitle';
import { env } from '@/env';
import { getNoRoleRoutes, getProtectedRoutes, getPublicRoutes } from '@/routes/routePaths';

/**
 * Top-level router. Switches between three route sets based on auth state:
 * public (Landing, 404), no-role (only /unauthorized), and protected
 * (Dashboard, Projects, etc.). A user who authenticates but lacks both
 * REPT_ADMIN and REPT_VIEWER lands on /unauthorized rather than NotFound.
 */
const AppRoutes: FC = () => {
  const { isLoggedIn, isLoading, user } = useAuth();
  const { setPageTitle } = usePageTitle();

  const displayLoading = () => <Loading data-testid="loading" withOverlay={true} />;

  const hasAnyRole = (user?.roles?.length ?? 0) > 0;

  const routesToUse = useMemo(() => {
    if (!isLoggedIn) return getPublicRoutes();
    if (!hasAnyRole) return getNoRoleRoutes();
    return getProtectedRoutes();
  }, [isLoggedIn, hasAnyRole]);

  const basename = env.VITE_BASE_PATH || '/';
  const browserRouter = useMemo(
    () => createBrowserRouter(routesToUse, { basename }),
    [routesToUse, basename],
  );

  useEffect(() => {
    const currentRoute = routesToUse.find((route) => route.path === window.location.pathname);
    if (currentRoute) {
      setPageTitle(currentRoute.id || '', 1);
    }
  }, [routesToUse, setPageTitle]);

  if (isLoading) {
    return displayLoading();
  }

  return (
    <Suspense fallback={displayLoading()}>
      <RouterProvider router={browserRouter} />
    </Suspense>
  );
};

export default AppRoutes;
