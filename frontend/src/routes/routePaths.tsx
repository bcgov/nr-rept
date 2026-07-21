/**
 * Route definitions for the REPT application.
 *
 * PUBLIC_ROUTES  — unauthenticated pages (Landing, Unauthorized); any other
 *                  path redirects to Landing (login).
 * PROTECTED_ROUTES — authenticated pages wrapped in <Layout> (Dashboard, Projects, Reports, Admin).
 *
 * Three route sets correspond to three auth states (selected in AppRoutes):
 *   not logged in            -> getPublicRoutes()
 *   logged in, no REPT role  -> getNoRoleRoutes()
 *   logged in, has role(s)   -> getProtectedRoutes()
 *
 * Exported helpers:
 *   getPublicRoutes()        — returns PUBLIC_ROUTES as-is.
 *   getNoRoleRoutes()        — Layout-wrapped /unauthorized + catch-all redirect to it.
 *   getProtectedRoutes()     — returns PROTECTED_ROUTES with role-restricted routes wrapped in <ProtectedRoute>.
 *   getMenuEntries(roles)    — returns sidebar menu items filtered by role.
 */

import { DashboardReference, Document, Search, UserAvatar } from '@carbon/icons-react';
import { Navigate, type RouteObject } from 'react-router-dom';

import Layout from '@/components/Layout';
import AdminPage from '@/pages/Admin';
import DashboardPage from '@/pages/Dashboard';
import GlobalErrorPage from '@/pages/GlobalError';
import LandingPage from '@/pages/Landing';
import NotFoundPage from '@/pages/NotFound';
import ProjectDetailPage from '@/pages/Project';
import ProjectCreatePage from '@/pages/ProjectCreate';
import ProjectSearchPage from '@/pages/Projects';
import ReportsLandingPage from '@/pages/Reports';
import ReportFormPage from '@/pages/Reports/ReportFormPage';
import RoleErrorPage from '@/pages/RoleError';

import ProtectedRoute from './ProtectedRoute';

import type { ROLE_TYPE } from '@/context/auth/types';

export type RouteDescription = {
  id: string;
  path: string;
  element: React.ReactNode;
  icon?: React.ComponentType;
  isSideMenu: boolean;
  children?: RouteDescription[];
  roles?: ROLE_TYPE[];
} & RouteObject;

export type MenuItem = Pick<RouteDescription, 'id' | 'path' | 'icon'> & {
  children?: MenuItem[];
};

// --- Route arrays --------------------------------------------------------

/** Unauthenticated routes — shown when the user is not logged in. */
export const PUBLIC_ROUTES: RouteDescription[] = [
  {
    path: '/',
    id: 'Landing',
    element: <LandingPage />,
    isSideMenu: false,
  },
  {
    path: '/unauthorized',
    id: 'Unauthorized',
    element: <RoleErrorPage />,
    isSideMenu: false,
  },
  {
    // A logged-out user who navigates directly to any downstream/unknown path
    // (e.g. /dashboard) is bounced back to the Landing page — the IDIR login
    // screen — rather than shown a 404 they can't act on. Mirrors the
    // catch-all redirect used by getNoRoleRoutes().
    path: '*',
    id: 'RedirectToLogin',
    element: <Navigate to="/" replace />,
    isSideMenu: false,
  },
];

/** Authenticated routes — shown when the user is logged in. */
export const PROTECTED_ROUTES: RouteDescription[] = [
  // Redirect from landing to dashboard when already logged in
  {
    path: '/',
    id: 'RedirectWhileLoggedIn',
    element: <Navigate to="/dashboard" replace />,
    isSideMenu: false,
  },
  {
    path: '/dashboard',
    id: 'Dashboard',
    icon: DashboardReference,
    element: (
      <Layout>
        <DashboardPage />
      </Layout>
    ),
    isSideMenu: true,
  },
  {
    path: '/projects',
    id: 'Project Search',
    icon: Search,
    element: (
      <Layout>
        <ProjectSearchPage />
      </Layout>
    ),
    isSideMenu: true,
  },
  {
    path: '/projects/create',
    id: 'Add Project File',
    element: (
      <Layout>
        <ProjectCreatePage />
      </Layout>
    ),
    isSideMenu: false,
    roles: ['REPT_ADMIN'],
  },
  {
    path: '/reports',
    id: 'Reports',
    icon: Document,
    element: (
      <Layout>
        <ReportsLandingPage />
      </Layout>
    ),
    isSideMenu: true,
  },
  {
    path: '/admin',
    id: 'Administration',
    icon: UserAvatar,
    element: (
      <Layout>
        <AdminPage />
      </Layout>
    ),
    isSideMenu: true,
    roles: ['REPT_ADMIN'],
  },
  {
    path: '/reports/:reportId',
    id: 'Report Builder',
    element: (
      <Layout>
        <ReportFormPage />
      </Layout>
    ),
    isSideMenu: false,
  },
  {
    path: '/projects/:projectId',
    id: 'Project File',
    element: (
      <Layout>
        <ProjectDetailPage />
      </Layout>
    ),
    isSideMenu: false,
  },
  // System routes (protected versions — inside Layout)
  {
    path: '/unauthorized',
    id: 'Unauthorized',
    element: (
      <Layout>
        <RoleErrorPage />
      </Layout>
    ),
    isSideMenu: false,
  },
  {
    path: '*',
    id: 'Not Found',
    element: (
      <Layout>
        <NotFoundPage />
      </Layout>
    ),
    isSideMenu: false,
  },
];

// --- Helpers --------------------------------------------------------------

/** Returns sidebar menu items the user is allowed to see based on their roles. */
export const getMenuEntries = (roles: string[]): MenuItem[] => {
  return PROTECTED_ROUTES.filter((route) => route.isSideMenu)
    .filter((route) => !route.roles || route.roles.some((r) => roles.includes(r)))
    .map(({ id, path, icon }) => ({ id, path, icon }));
};

/** Returns the public (unauthenticated) route array. */
export const getPublicRoutes = (): RouteDescription[] => PUBLIC_ROUTES;

/**
 * Returns the route set for an authenticated user who has no recognized REPT
 * role. They can reach the Layout-wrapped RoleErrorPage and nothing else;
 * every other path redirects to /unauthorized so they don't see empty
 * dashboards or hit a string of 403s. The Layout header's profile menu still
 * exposes Log out.
 */
export const getNoRoleRoutes = (): RouteDescription[] => [
  {
    path: '/unauthorized',
    id: 'Unauthorized',
    element: (
      <Layout>
        <RoleErrorPage />
      </Layout>
    ),
    isSideMenu: false,
  },
  {
    path: '*',
    id: 'UnauthorizedRedirect',
    element: <Navigate to="/unauthorized" replace />,
    isSideMenu: false,
  },
];

/** Returns the protected route array with role-gated routes wrapped in <ProtectedRoute>. */
export const getProtectedRoutes = (): RouteDescription[] => {
  return PROTECTED_ROUTES.map((route) => ({
    ...route,
    element: route.roles ? (
      <ProtectedRoute roles={route.roles}>{route.element}</ProtectedRoute>
    ) : (
      route.element
    ),
    errorElement: (
      <Layout>
        <GlobalErrorPage />
      </Layout>
    ),
  }));
};
