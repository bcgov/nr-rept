import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getCookie,
  getAccessTokenFromCookie,
  getIdTokenFromCookie,
  getUserTokenFromCookie,
  parseToken,
  parsePrivileges,
  extractGroups,
} from './authUtils';

// Mock env
vi.mock('@/env', () => ({
  env: {
    VITE_USER_POOLS_WEB_CLIENT_ID: 'test-client-id',
    NODE_ENV: 'test',
  },
}));

describe('authUtils', () => {
  describe('getCookie', () => {
    let originalCookie: string;
    beforeEach(() => {
      originalCookie = globalThis.document?.cookie;
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value:
          'foo=bar; CognitoIdentityServiceProvider.test-client-id.LastAuthUser=theuser; CognitoIdentityServiceProvider.test-client-id.theuser.idToken=theidtoken; CognitoIdentityServiceProvider.test-client-id.theuser.accessToken=theaccesstoken',
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
      expect(getCookie('CognitoIdentityServiceProvider.test-client-id.LastAuthUser')).toBe(
        'theuser',
      );
    });
    it('returns empty string if cookie not found', () => {
      expect(getCookie('notfound')).toBe('');
    });
  });

  describe('getAccessTokenFromCookie', () => {
    beforeEach(() => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value:
          'CognitoIdentityServiceProvider.test-client-id.LastAuthUser=theuser; CognitoIdentityServiceProvider.test-client-id.theuser.accessToken=theaccesstoken',
      });
    });
    it('returns the accessToken from cookies', () => {
      expect(getAccessTokenFromCookie()).toBe('theaccesstoken');
    });
    it('returns undefined if no userId', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });
      expect(getAccessTokenFromCookie()).toBeUndefined();
    });
  });

  describe('getIdTokenFromCookie', () => {
    beforeEach(() => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value:
          'CognitoIdentityServiceProvider.test-client-id.LastAuthUser=theuser; CognitoIdentityServiceProvider.test-client-id.theuser.idToken=theidtoken',
      });
    });
    it('returns the idToken from cookies', () => {
      expect(getIdTokenFromCookie()).toBe('theidtoken');
    });
    it('returns undefined if no userId', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });
      expect(getIdTokenFromCookie()).toBeUndefined();
    });
  });

  describe('getUserTokenFromCookie (deprecated alias)', () => {
    it('is an alias for getAccessTokenFromCookie', () => {
      expect(getUserTokenFromCookie).toBe(getAccessTokenFromCookie);
    });
  });

  describe('parseToken', () => {
    it('returns undefined if no token', () => {
      expect(parseToken(undefined)).toBeUndefined();
    });
    it('parses a valid JWT payload', () => {
      const jwt = {
        payload: {
          'custom:idp_display_name': 'Doe, John',
          'custom:idp_name': 'idir',
          'custom:idp_username': 'jdoe',
          'email': 'john@example.com',
          'cognito:groups': ['REPT_ADMIN', 'REPT_VIEWER'],
        },
      };
      const user = parseToken(jwt);
      expect(user).toMatchObject({
        userName: 'jdoe',
        displayName: 'Doe, John',
        email: 'john@example.com',
        idpProvider: 'IDIR',
        privileges: { REPT_ADMIN: null, REPT_VIEWER: null },
        firstName: 'John',
        lastName: 'Doe',
        providerUsername: 'IDIR\\jdoe',
      });
    });
  });

  describe('parsePrivileges', () => {
    it('parses recognized Cognito groups', () => {
      const input = ['REPT_ADMIN', 'REPT_VIEWER'];
      expect(parsePrivileges(input)).toEqual({ REPT_ADMIN: null, REPT_VIEWER: null });
    });
    it('ignores unrecognized groups', () => {
      const input = ['REPT_ADMIN', 'UNKNOWN_GROUP'];
      expect(parsePrivileges(input)).toEqual({ REPT_ADMIN: null });
    });
    it('returns empty object for no input', () => {
      expect(parsePrivileges([])).toEqual({});
    });
  });

  describe('extractGroups', () => {
    it('returns groups from token', () => {
      expect(extractGroups({ 'cognito:groups': ['ADMIN', 'USER'] })).toEqual(['ADMIN', 'USER']);
    });
    it('returns empty array if no groups', () => {
      expect(extractGroups({})).toEqual([]);
      expect(extractGroups(undefined)).toEqual([]);
    });
  });
});
