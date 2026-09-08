/**
 * Recognized CSS/Keycloak roles that map to application roles.
 *
 * The codes are unchanged from the Cognito groups they replace, and REPT scopes
 * no role by district, region or forest client — so these arrive on the token
 * spelled exactly as written here, and exact matching stays correct.
 */
export const AVAILABLE_ROLES = ['REPT_ADMIN', 'REPT_VIEWER'] as const;

export type ROLE_TYPE = (typeof AVAILABLE_ROLES)[number];

type RoleValue = string[] | null;

export type USER_PRIVILEGE_TYPE = Partial<Record<ROLE_TYPE, RoleValue>>;

export const validIdpProviders = ['IDIR'] as const;

export type IdpProviderType = (typeof validIdpProviders)[number];

export type FamLoginUser = {
  providerUsername?: string;
  userName?: string;
  displayName?: string;
  email?: string;
  idpProvider?: IdpProviderType;
  roles?: ROLE_TYPE[];
  authToken?: string;
  exp?: number;
  privileges: USER_PRIVILEGE_TYPE;
  firstName?: string;
  lastName?: string;
};
