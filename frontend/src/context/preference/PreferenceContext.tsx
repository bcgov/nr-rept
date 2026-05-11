import { createContext, type ReactNode } from 'react';

import type { UserPreference } from './types';

export type PreferenceContextType = {
  userPreference: UserPreference;
  updatePreferences: (preference: Partial<UserPreference>) => void;
};

export type PreferenceProviderProps = {
  children: ReactNode;
};

export const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);
