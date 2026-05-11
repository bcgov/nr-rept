import { Navigate } from 'react-router-dom';

import { useAuth } from '@/context/auth/useAuth';

import type { ROLE_TYPE } from '@/context/auth/types';

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: ROLE_TYPE[];
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/unauthorized" replace />;
  if (roles && !roles.some((role) => user.roles?.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
