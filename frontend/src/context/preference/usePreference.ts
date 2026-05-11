import { useContext } from 'react';

import { PreferenceContext } from './PreferenceContext';

export const usePreference = () => {
  const ctx = useContext(PreferenceContext);
  if (!ctx) {
    throw new Error('usePreference must be used within a PreferenceProvider');
  }
  return ctx;
};
