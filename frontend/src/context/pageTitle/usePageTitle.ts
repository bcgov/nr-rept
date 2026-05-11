import { useContext } from 'react';

import { PageTitleContext } from './PageTitleContext';

export const usePageTitle = () => {
  const ctx = useContext(PageTitleContext);
  if (!ctx) {
    throw new Error('usePageTitle must be used within a PageTitleProvider');
  }
  return ctx;
};
