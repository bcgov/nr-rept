import type { JWT as AmplifyJWT } from '@aws-amplify/core';

export type JWT = AmplifyJWT;

/**
 * Recognized Cognito groups that map to application roles.
 * Must match the AWS Cognito group names exactly.
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
