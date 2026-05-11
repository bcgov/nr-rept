import { Breadcrumb, BreadcrumbItem, Column } from '@carbon/react';
import { useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import Subtitle from '@/components/core/Subtitle';
import UnderConstructionTag from '@/components/core/Tags/UnderConstructionTag';
import { usePageTitle } from '@/context/pageTitle/usePageTitle';

import { type BreadCrumbType } from './types';

import './index.scss';

/**
 * Props for the PageTitle component.
 *
 * @property {string} title - The main title text for the page.
 * @property {string} [subtitle] - Optional subtitle text for the page.
 * @property {boolean} [experimental] - If true, displays an "Under construction" tag.
 * @property {React.ReactNode} [children] - Optional elements to render next to the title.
 * @property {BreadCrumbType[]} [breadCrumbs] - Optional array of breadcrumb objects for navigation.
 */
interface PageTitleProps {
  title: string;
  subtitle?: string;
  experimental?: boolean;
  children?: React.ReactNode;
  breadCrumbs?: BreadCrumbType[];
}

/**
 * PageTitle provides a standardized header for pages, including a title, optional subtitle, breadcrumbs, and an experimental tag.
 * It helps maintain consistent page layouts and navigation.
 *
 * @param {PageTitleProps} props - The props for the component.
 * @returns {JSX.Element} The rendered PageTitle component.
 */
const PageTitle: FC<PageTitleProps> = ({
  title,
  subtitle,
  experimental,
  children,
  breadCrumbs,
}: PageTitleProps) => {
  const navigate = useNavigate();
  const { setPageTitle } = usePageTitle();

  const breadcrumbTitle = useMemo(
    () => breadCrumbs?.map((crumb) => crumb.name).join(' - ') ?? '',
    [breadCrumbs],
  );

  useEffect(() => {
    setPageTitle(breadcrumbTitle || title, 2);
  }, [title, setPageTitle, breadcrumbTitle]);

  return (
    <Column className="page-title-col" sm={4} md={8} lg={16}>
      {breadCrumbs?.length ? (
        <Breadcrumb className="page-title-breadcrumb">
          {breadCrumbs.map((crumb) => (
            <BreadcrumbItem key={crumb.name} onClick={() => navigate(crumb.path)}>
              {crumb.name}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      ) : null}
      <div className="page-title-container">
        <div className="title-container">
          <h1>{title}</h1>
          {children}
          {experimental ? <UnderConstructionTag type="page" /> : null}
        </div>
        {subtitle ? <Subtitle text={subtitle} /> : null}
      </div>
    </Column>
  );
};

export default PageTitle;
