import { Content, HeaderContainer } from '@carbon/react';

import { LayoutProvider } from '@/context/layout/LayoutProvider';

import { LayoutHeader } from './LayoutHeader';

import type { FC, ReactNode } from 'react';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <>
      <LayoutProvider>
        <HeaderContainer render={LayoutHeader} />
        <Content>{children}</Content>
      </LayoutProvider>
    </>
  );
};

export default Layout;
