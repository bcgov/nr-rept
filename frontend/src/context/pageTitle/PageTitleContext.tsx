import { createContext } from 'react';

export type PageTitleContextData = {
  pageTitle: string;
  setPageTitle: (title: string, hierarchy?: 1 | 2 | 3) => void;
  currentHierarchy: number;
};

export const PageTitleContext = createContext<PageTitleContextData | undefined>(undefined);
