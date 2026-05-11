export const CARBON_THEMES = ['white', 'g10', 'g90', 'g100'] as const;
export type CarbonTheme = (typeof CARBON_THEMES)[number];

export type UserPreference = {
  theme: CarbonTheme;
  [key: string]: unknown;
};
