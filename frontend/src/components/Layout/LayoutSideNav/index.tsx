import { SideNav, SideNavItems, SideNavLink, SideNavMenu, SideNavMenuItem } from '@carbon/react';
import { type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '@/context/auth/useAuth';
import { useLayout } from '@/context/layout/useLayout';
import { getMenuEntries, type MenuItem } from '@/routes/routePaths';

import './index.scss';

export const LayoutSideNav: FC = () => {
  const { isSideNavExpanded } = useLayout();
  const location = useLocation();
  const { user } = useAuth();

  const renderIcon = (route: MenuItem) => {
    const Icon = route.icon;
    return (
      <div className="cds--side-nav__icon">
        {Icon ? <Icon /> : null}
        <span className="cds--side-nav__link-text">{route.id}</span>
      </div>
    );
  };

  const renderMenuLink = (route: MenuItem) => (
    <SideNavLink
      data-testid={`side-nav-link-${route.id}`}
      key={route.id}
      as={Link}
      to={route.path}
      isActive={route.path === location.pathname}
      renderIcon={route.icon}
    >
      {route.id}
    </SideNavLink>
  );

  const renderMenuItem = (route: MenuItem) => {
    const childPath = (parentPath: string, route: MenuItem) =>
      `${parentPath}${route.path ? `/${route.path}` : ''}`;
    return (
      <SideNavMenu
        data-testid={`side-nav-menu-${route.id}`}
        key={route.id}
        title={route.id}
        isActive={location.pathname.startsWith(route.path)}
        defaultExpanded={location.pathname.startsWith(route.path)}
        renderIcon={route.icon}
      >
        {route.children?.map((childRoute) => (
          <SideNavMenuItem
            data-testid={`side-nav-menu-item-${childRoute.id}`}
            key={childRoute.id}
            as={Link}
            to={childPath(route.path, childRoute)}
            isActive={childPath(route.path, childRoute) === location.pathname}
          >
            {renderIcon(childRoute)}
          </SideNavMenuItem>
        ))}
      </SideNavMenu>
    );
  };

  return (
    <SideNav expanded={isSideNavExpanded} isPersistent={isSideNavExpanded} isChildOfHeader>
      <SideNavItems>
        {getMenuEntries(user?.roles || []).map((route) =>
          route.children ? renderMenuItem(route) : renderMenuLink(route),
        )}
      </SideNavItems>
    </SideNav>
  );
};
