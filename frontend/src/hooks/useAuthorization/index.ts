import { useMemo } from 'react';

import { useAuth } from '@/context/auth/useAuth';

import type { FamLoginUser, ROLE_TYPE } from '@/context/auth/types';

/**
 * Authorization result returned by {@link useAuthorization}.
 *
 * All boolean flags are derived from the Cognito groups present in the
 * user's JWT token.
 */
export type AuthorizationInfo = {
  /** `true` when the user holds the `REPT_ADMIN` Cognito group. */
  isAdmin: boolean;
  /** `true` when the user holds the `REPT_VIEWER` Cognito group. */
  isViewer: boolean;
  /** `true` when the user has at least one recognized role (`REPT_ADMIN` or `REPT_VIEWER`). */
  hasAnyRole: boolean;
  /** `true` when the user can perform write operations (create / update / delete). */
  canEdit: boolean;
  /** `true` when the user can create new resources. Alias for {@link canEdit}. */
  canCreate: boolean;
  /** `true` when the user can delete resources. Alias for {@link canEdit}. */
  canDelete: boolean;
  /** Checks if the user holds a specific role. */
  hasRole: (role: ROLE_TYPE) => boolean;
  /** The full user object for advanced checks (may be `undefined` before login). */
  user: FamLoginUser | undefined;
};

/**
 * Hook that provides role-based authorization helpers derived from the
 * authenticated user's Cognito groups.
 *
 * @example
 * ```tsx
 * const { isAdmin, canEdit } = useAuthorization();
 *
 * return (
 *   <>
 *     {canEdit && <Button>Edit</Button>}
 *     {isAdmin && <Link to="/admin">Admin</Link>}
 *   </>
 * );
 * ```
 */
export const useAuthorization = (): AuthorizationInfo => {
  const { user } = useAuth();

  return useMemo<AuthorizationInfo>(() => {
    const roles = user?.roles ?? [];
    const isAdmin = roles.includes('REPT_ADMIN');
    const isViewer = roles.includes('REPT_VIEWER');
    const hasAnyRole = isAdmin || isViewer;

    // Only REPT_ADMIN can perform write operations
    const canEdit = isAdmin;
    const canCreate = isAdmin;
    const canDelete = isAdmin;

    const hasRole = (role: ROLE_TYPE) => roles.includes(role);

    return {
      isAdmin,
      isViewer,
      hasAnyRole,
      canEdit,
      canCreate,
      canDelete,
      hasRole,
      user,
    };
  }, [user]);
};
