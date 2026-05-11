import { useQuery, useMutation } from '@tanstack/react-query';
import { type FC, useEffect, useState } from 'react';

import { PreferenceContext, type PreferenceProviderProps } from './PreferenceContext';
import { type UserPreference } from './types';
import { initialValue, loadUserPreference, saveUserPreference } from './utils'; // initialValue used for fallback only

export const PreferenceProvider: FC<PreferenceProviderProps> = ({ children }) => {
  const [userPreference, setUserPreference] = useState<UserPreference | undefined>(undefined);

  const queryUserPreference = useQuery({
    queryKey: ['userPreference'],
    queryFn: async () => await loadUserPreference(),
    refetchOnMount: true,
  });

  const mutateUserPreference = useMutation({
    mutationFn: async (updatedPreferences: UserPreference) =>
      saveUserPreference(updatedPreferences),
    onSuccess: (data) => {
      setUserPreference(data);
    },
  });

  const updatePreferences = (preference: Partial<UserPreference>) => {
    const basePreference = userPreference ?? initialValue;
    const updatedPreferences = {
      ...basePreference,
      ...preference,
    } as UserPreference;
    setUserPreference(updatedPreferences);
    mutateUserPreference.mutate(updatedPreferences);
  };

  useEffect(() => {
    if (queryUserPreference.isSuccess && queryUserPreference.data && !userPreference) {
      // Loaded Pref: queryUserPreference.data
      setUserPreference(queryUserPreference.data as UserPreference);
    }
  }, [queryUserPreference.isSuccess, queryUserPreference.data, userPreference]);

  const contextValue = {
    userPreference: userPreference ?? initialValue,
    updatePreferences,
  };

  return <PreferenceContext.Provider value={contextValue}>{children}</PreferenceContext.Provider>;
};
