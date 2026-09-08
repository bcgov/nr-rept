import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  getCookie,
  parseToken,
  parsePrivileges,
  parseIdpProvider,
  extractRoles,
  type KeycloakProfile,
} from './authUtils';

/** A realistic IDIR - MFA access-token profile. */
const idirProfile = (overrides: Partial<KeycloakProfile> = {}): KeycloakProfile => ({
  preferred_username: '0a1b2c3d4e5f60718293a4b5c6d7e8f9@azureidir',
  identity_provider: 'azureidir',
  idir_username: 'JDOE',
  idir_user_guid: '0A1B2C3D4E5F60718293A4B5C6D7E8F9',
  display_name: 'Doe, John',
  given_name: 'John',
  family_name: 'Doe',
  email: 'john.doe@gov.bc.ca',
  azp: 'rept-test',
  client_roles: ['REPT_ADMIN', 'REPT_VIEWER'],
  ...overrides,
});

describe('authUtils', () => {
  describe('getCookie', () => {
    let originalCookie: string;
    beforeEach(() => {
      originalCookie = globalThis.document?.cookie;
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'foo=bar; XSRF-TOKEN=abc123',
      });
    });
    afterEach(() => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: originalCookie,
      });
    });
    it('returns the correct cookie value', () => {
      expect(getCookie('foo')).toBe('bar');
      expect(getCookie('XSRF-TOKEN')).toBe('abc123');
    });
    it('returns empty string if cookie not found', () => {
      expect(getCookie('notfound')).toBe('');
    });
  });

  describe('parseIdpProvider', () => {
    it('normalises azureidir to IDIR', () => {
      expect(parseIdpProvider(idirProfile())).toBe('IDIR');
    });

    it('normalises the legacy idir alias to IDIR', () => {
      expect(parseIdpProvider(idirProfile({ identity_provider: 'idir' }))).toBe('IDIR');
    });

    it('falls back to the preferred_username suffix', () => {
      // `identity_provider` comes from the broker rather than from a mapper, so
      // it is not in the identity-mappers reference; the suffix always is.
      const profile = idirProfile();
      delete profile.identity_provider;
      expect(parseIdpProvider(profile)).toBe('IDIR');
    });

    it('is undefined for a provider REPT does not support', () => {
      expect(
        parseIdpProvider({
          identity_provider: 'bceidbusiness',
          preferred_username: 'abc@bceidbusiness',
        }),
      ).toBeUndefined();
    });
  });

  describe('extractRoles', () => {
    it('reads client_roles', () => {
      expect(extractRoles(idirProfile())).toEqual(['REPT_ADMIN', 'REPT_VIEWER']);
    });

    it('falls back to resource_access for the token"s own client', () => {
      // Which claim appears depends on the realm's mappers: CSS emits
      // client_roles, stock Keycloak uses resource_access.
      const profile = idirProfile({
        client_roles: undefined,
        resource_access: { 'rept-test': { roles: ['REPT_VIEWER'] } },
      });
      expect(extractRoles(profile)).toEqual(['REPT_VIEWER']);
    });

    it('ignores another client"s roles in resource_access', () => {
      const profile = idirProfile({
        client_roles: undefined,
        resource_access: { 'some-other-app': { roles: ['REPT_ADMIN'] } },
      });
      expect(extractRoles(profile)).toEqual([]);
    });

    it('returns an empty list when the token carries no roles', () => {
      expect(extractRoles(idirProfile({ client_roles: undefined }))).toEqual([]);
      expect(extractRoles(undefined)).toEqual([]);
    });
  });

  describe('parsePrivileges', () => {
    it('parses recognized roles', () => {
      expect(parsePrivileges(['REPT_ADMIN', 'REPT_VIEWER'])).toEqual({
        REPT_ADMIN: null,
        REPT_VIEWER: null,
      });
    });

    it('ignores unrecognized roles', () => {
      expect(parsePrivileges(['REPT_ADMIN', 'UNKNOWN_ROLE'])).toEqual({ REPT_ADMIN: null });
    });

    it('drops FAM bookkeeping roles', () => {
      // FAM records a grant's expiry as a role assigned to the person, so it
      // reaches the token like any other. It is not a privilege.
      expect(parsePrivileges(['FAM:EXPIRES:2026-09-30:REPT_ADMIN', 'REPT_VIEWER'])).toEqual({
        REPT_VIEWER: null,
      });
    });

    it('returns empty object for no input', () => {
      expect(parsePrivileges([])).toEqual({});
    });
  });

  describe('parseToken', () => {
    it('returns undefined if no profile', () => {
      expect(parseToken(undefined)).toBeUndefined();
    });

    it('parses an IDIR - MFA profile', () => {
      expect(parseToken(idirProfile())).toMatchObject({
        userName: 'JDOE',
        displayName: 'Doe, John',
        email: 'john.doe@gov.bc.ca',
        idpProvider: 'IDIR',
        privileges: { REPT_ADMIN: null, REPT_VIEWER: null },
        firstName: 'John',
        lastName: 'Doe',
        providerUsername: 'IDIR\\JDOE',
      });
    });

    it('takes the name from its own claims, not by splitting display_name', () => {
      // Cognito carried only a display name, so the old parser had to guess
      // whether "Smith, Jane" or "Jane Smith" was meant. Both are real claims
      // on this realm, so a display name in either order is now irrelevant.
      const user = parseToken(
        idirProfile({ display_name: 'John Doe', given_name: 'John', family_name: 'Doe' }),
      );
      expect(user).toMatchObject({ firstName: 'John', lastName: 'Doe' });
    });

    it('falls back to composing a display name when the claim is absent', () => {
      const profile = idirProfile();
      delete profile.display_name;
      expect(parseToken(profile)?.displayName).toBe('John Doe');
    });

    it('keeps a user with no REPT role, with no privileges', () => {
      // They must stay signed in so the router can send them to /unauthorized
      // rather than bouncing them back through Keycloak.
      const user = parseToken(idirProfile({ client_roles: [] }));
      expect(user?.privileges).toEqual({});
      expect(user?.roles).toEqual([]);
      expect(user?.userName).toBe('JDOE');
    });
  });
});
