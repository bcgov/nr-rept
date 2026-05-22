import { SideNav, SideNavItems, SideNavLink, SideNavMenu, SideNavMenuItem } from '@carbon/react';
import { useEffect, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '@/context/auth/useAuth';
import { useLayout } from '@/context/layout/useLayout';
import { getMenuEntries, type MenuItem } from '@/routes/routePaths';

import './index.scss';

export const LayoutSideNav: FC = () => {
  const { isSideNavExpanded, closeSideNav } = useLayout();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!isSideNavExpanded) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (target.closest('.side-nav-drawer, .cds--header__menu-toggle')) return;
      closeSideNav();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isSideNavExpanded, closeSideNav]);

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
      onClick={closeSideNav}
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
            onClick={closeSideNav}
          >
            {renderIcon(childRoute)}
          </SideNavMenuItem>
        ))}
      </SideNavMenu>
    );
  };

  return (
    <SideNav
      expanded
      isPersistent={false}
      isChildOfHeader
      className={`side-nav-drawer${isSideNavExpanded ? ' side-nav-drawer--open' : ''}`}
    >
      <SideNavItems>
        {getMenuEntries(user?.roles || []).map((route) =>
          route.children ? renderMenuItem(route) : renderMenuLink(route),
        )}
      </SideNavItems>
    </SideNav>
  );
};
