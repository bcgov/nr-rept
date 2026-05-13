import { Loading } from '@carbon/react';
import { Suspense, useEffect, useMemo, type FC } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { useAuth } from '@/context/auth/useAuth';
import { usePageTitle } from '@/context/pageTitle/usePageTitle';
import { env } from '@/env';
import { getProtectedRoutes, getPublicRoutes } from '@/routes/routePaths';

/**
 * Top-level router. Switches between public routes (Landing, 404) and
 * protected routes (Dashboard, Projects, etc.) based on auth state.
 */
const AppRoutes: FC = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const { setPageTitle } = usePageTitle();

  const displayLoading = () => <Loading data-testid="loading" withOverlay={true} />;

  const routesToUse = useMemo(() => {
    return !isLoggedIn ? getPublicRoutes() : getProtectedRoutes();
  }, [isLoggedIn]);

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
