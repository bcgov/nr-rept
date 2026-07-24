import { Content, HeaderContainer } from '@carbon/react';

import { LayoutProvider } from '@/context/layout/LayoutProvider';
import { useLayout } from '@/context/layout/useLayout';

import { LayoutHeader } from './LayoutHeader';

import './index.scss';

import type { FC, ReactNode } from 'react';

/**
 * Wraps the Carbon shell so the page content slides right when the SideNav
 * is popped out (CSS keys off the .bc-layout--nav-open class to push
 * .cds--content rather than letting the drawer overlay it). The nav is always
 * on-screen — a 3rem icon rail when pulled back, a full panel when open — and
 * the content margin tracks whichever width is showing.
 */
const LayoutShell: FC<{ children: ReactNode }> = ({ children }) => {
  const { isSideNavExpanded } = useLayout();
  return (
    <div className={`bc-layout${isSideNavExpanded ? ' bc-layout--nav-open' : ''}`}>
      <HeaderContainer render={LayoutHeader} />
      <Content>{children}</Content>
    </div>
  );
};

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <LayoutProvider>
      <LayoutShell>{children}</LayoutShell>
    </LayoutProvider>
  );
};

export default Layout;
