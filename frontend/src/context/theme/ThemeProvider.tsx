import { Theme } from '@carbon/react';
import { useState, useEffect, type ReactNode } from 'react';

import { type CarbonTheme } from '@/context/preference/types';
import { usePreference } from '@/context/preference/usePreference';

import { ThemeContext } from './ThemeContext';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const preferences = usePreference();
  const { updatePreferences, userPreference } = preferences;
  const [theme, setThemeState] = useState<CarbonTheme>(userPreference.theme ?? 'white');

  // Keep local theme in sync when userPreference updates elsewhere (e.g. reload)
  useEffect(() => {
    if (userPreference?.theme && userPreference.theme !== theme) {
      setThemeState(userPreference.theme);
    }
  }, [userPreference?.theme, theme]);

  useEffect(() => {
    if (theme) {
      document.documentElement.dataset.carbonTheme = theme;
    }
  }, [theme]);

  const applyTheme = (nextTheme: CarbonTheme) => {
    setThemeState(nextTheme);
    if (nextTheme !== userPreference.theme) {
      updatePreferences({ theme: nextTheme });
    }
  };

  const toggleTheme = () => {
    applyTheme(theme === 'white' ? 'g100' : 'white');
  };

  // Only render Theme when theme is set
  return (
    <ThemeContext.Provider value={{ theme: theme ?? 'white', setTheme: applyTheme, toggleTheme }}>
      {theme ? <Theme theme={theme}>{children}</Theme> : null}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
