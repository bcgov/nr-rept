import { useEffect, useState } from 'react';

import useBreakpoint from '@/hooks/useBreakpoint';

import { LayoutContext } from './LayoutContext';

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const breakpoint = useBreakpoint();

  const [isSideNavExpanded, setSideNavExpanded] = useState(
    breakpoint !== 'sm' && breakpoint !== 'md',
  );
  const [isHeaderPanelOpen, setHeaderPanelOpen] = useState(false);

  useEffect(() => {
    setSideNavExpanded(breakpoint !== 'sm' && breakpoint !== 'md');
  }, [breakpoint]);

  return (
    <LayoutContext.Provider
      value={{
        isSideNavExpanded,
        toggleSideNav: () => setSideNavExpanded((prev) => !prev),
        isHeaderPanelOpen,
        toggleHeaderPanel: () => setHeaderPanelOpen((prev) => !prev),
        closeHeaderPanel: () => setHeaderPanelOpen(false),
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
