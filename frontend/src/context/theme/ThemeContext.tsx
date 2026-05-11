import { createContext } from 'react';

import type { CarbonTheme } from '@/context/preference/types';

export type ThemeContextData = {
  theme: CarbonTheme;
  setTheme: (theme: CarbonTheme) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextData | undefined>(undefined);
