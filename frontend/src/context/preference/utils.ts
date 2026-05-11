import { type UserPreference } from './types';

export const initialValue: UserPreference = {
  theme: 'white',
};

/**
 * Preference utilities for the POC. These operate entirely on localStorage and do NOT call
 * the backend. This avoids unnecessary network calls in the POC template.
 */
const loadUserPreference = async (): Promise<UserPreference> => {
  const storedPreference = localStorage.getItem('userPreference');
  if (storedPreference) {
    try {
      return JSON.parse(storedPreference) as UserPreference;
    } catch {
      // fall through to reset
    }
  }

  // Not found or invalid in localStorage -> use initial value and persist it
  localStorage.setItem('userPreference', JSON.stringify(initialValue));
  return initialValue;
};

const saveUserPreference = async (preference: Partial<UserPreference>): Promise<UserPreference> => {
  const stored = localStorage.getItem('userPreference');
  const current = stored ? (JSON.parse(stored) as UserPreference) : initialValue;
  const updated = { ...current, ...preference } as UserPreference;
  localStorage.setItem('userPreference', JSON.stringify(updated));
  return updated;
};

export { loadUserPreference, saveUserPreference };
