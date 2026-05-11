import { useState, useEffect, type ReactNode, useCallback } from 'react';

import { env } from '@/env';

import { PageTitleContext } from './PageTitleContext';

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
  const [pageTitle, setPageTitleState] = useState(document.title);
  const [currentHierarchy, setCurrentHierarchy] = useState(0);

  const resolveName = (title: string) =>
    [env.VITE_APP_NAME, title].join(' - ') ?? env.VITE_APP_NAME;

  const setPageTitle = useCallback(
    (title: string, hierarchy?: 1 | 2 | 3) => {
      const actualHierarchy = hierarchy ?? 3;
      setPageTitleState((prev) => {
        if (actualHierarchy >= currentHierarchy) {
          return resolveName(title);
        }
        return prev;
      });
      setCurrentHierarchy((prevHierarchy) =>
        actualHierarchy >= prevHierarchy ? actualHierarchy : prevHierarchy,
      );
    },
    [currentHierarchy],
  );

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle, currentHierarchy }}>
      {children}
    </PageTitleContext.Provider>
  );
};

export default PageTitleProvider;
