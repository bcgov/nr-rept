import { Header, HeaderMenuButton, HeaderName, SkipToContent } from '@carbon/react';
import { type FC } from 'react';
import { Link } from 'react-router-dom';

import { LayoutHeaderPanel } from '@/components/Layout/LayoutHeaderPanel';
import { LayoutSideNav } from '@/components/Layout/LayoutSideNav';
import { useLayout } from '@/context/layout/useLayout';
import { env } from '@/env';

import LayoutHeaderGlobalBar from './LayoutHeaderGlobalBar';

import './index.scss';

export const LayoutHeader: FC = () => {
  const { isSideNavExpanded, toggleSideNav } = useLayout();

  const appName = env.VITE_APP_NAME;

  return (
    <Header aria-label={appName} className="bc-header" data-testid="bc-header__header">
      <SkipToContent />
      <HeaderMenuButton
        aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
        isActive={isSideNavExpanded}
        onClick={toggleSideNav}
      />
      <HeaderName as={Link} to={'/dashboard'} prefix="">
        {appName}
      </HeaderName>

      <LayoutHeaderGlobalBar />
      <LayoutHeaderPanel />
      <LayoutSideNav />
    </Header>
  );
};
