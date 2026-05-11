import { createContext, type ReactNode } from 'react';

import type { FamLoginUser } from './types';

export type AuthContextType = {
  user: FamLoginUser | undefined;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  userToken: () => string | undefined;
  /** Checks the access token expiry and refreshes via the refresh token if
   *  needed. Returns the current access token string, or undefined if the
   *  session has expired (user will be signed out automatically). */
  ensureFreshToken: () => Promise<string | undefined>;
};

export type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
