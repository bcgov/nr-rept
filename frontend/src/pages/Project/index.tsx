import { ArrowLeft } from '@carbon/icons-react';
import {
  Column,
  Grid,
  InlineNotification,
  SkeletonText,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@carbon/react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useNotification } from '@/context/notification/useNotification';
import { usePageTitle } from '@/context/pageTitle/usePageTitle';
import { useReptProject } from '@/services/rept/hooks';

import { AcquisitionTab } from './components/AcquisitionTab';
import { AgreementsTab } from './components/AgreementsTab';
import { ContactsTab } from './components/ContactsTab';
import { HistoryTab } from './components/HistoryTab';
import { ProjectHeader } from './components/ProjectHeader';
import { ProjectSummaryTab } from './components/ProjectSummaryTab';
import { PropertiesTab } from './components/PropertiesTab';

import './project.scss';

import type { ReptProjectDetail } from '@/services/rept/types';
import type { FC } from 'react';

type ProjectTabsProps = {
  projectId: string;
  project: ReptProjectDetail;
};

const ProjectTabs: FC<ProjectTabsProps> = ({ projectId, project }) => {
  const tabs = [
    { label: 'Summary', content: <ProjectSummaryTab project={project} /> },
    { label: 'History', content: <HistoryTab projectId={projectId} project={project} /> },
    { label: 'Acquisition Request', content: <AcquisitionTab projectId={projectId} /> },
    { label: 'Properties', content: <PropertiesTab projectId={projectId} /> },
    { label: 'Contacts', content: <ContactsTab projectId={projectId} /> },
    { label: 'Agreements', content: <AgreementsTab projectId={projectId} /> },
  ];

  return (
    <Tabs>
      <TabList aria-label="Project sections" contained>
        {tabs.map((tab) => (
          <Tab key={tab.label}>{tab.label}</Tab>
        ))}
      </TabList>
      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel key={tab.label}>{tab.content}</TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};

const ProjectDetailPage: FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { setPageTitle } = usePageTitle();
  const { display } = useNotification();

  const projectQuery = useReptProject(projectId);
  const project = projectQuery.data ?? null;

  useEffect(() => {
    if (!projectId) {
      setPageTitle('Project File', 1);
      return;
    }

    if (project?.projectFile) {
      setPageTitle(`Project File ${project.projectFile}`, 1);
    } else {
      setPageTitle('Project File', 1);
    }
  }, [projectId, project?.projectFile, setPageTitle]);

  useEffect(() => {
    if (!projectId) {
      display({
        kind: 'error',
        title: "We couldn't load this project file",
        subtitle: 'Project identifier is missing.',
        timeout: 6000,
      });
    }
  }, [projectId, display]);

  useEffect(() => {
    if (projectQuery.isError) {
      display({
        kind: 'error',
        title: "We couldn't load this project file",
        subtitle: (projectQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [projectQuery.isError, projectQuery.error, display]);

  return (
    <Grid fullWidth className="default-grid project-detail-grid">
      <Column sm={4} md={8} lg={16}>
        <Link to="/projects" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Project Search</span>
        </Link>
      </Column>

      {projectQuery.isPending && (
        <Column sm={4} md={8} lg={16}>
          <div aria-busy>
            <SkeletonText heading width="40%" />
            <SkeletonText width="70%" lineCount={4} />
          </div>
        </Column>
      )}

      {!projectQuery.isPending && !projectQuery.isError && project === null && (
        <Column sm={4} md={8} lg={16}>
          <InlineNotification
            kind="info"
            lowContrast
            title="Project details are currently unavailable"
            subtitle="Project details are not available right now."
          />
        </Column>
      )}

      {project && projectId && (
        <>
          <Column sm={4} md={8} lg={16}>
            <ProjectHeader project={project} />
          </Column>

          <Column sm={4} md={8} lg={16}>
            <ProjectTabs projectId={projectId} project={project} />
          </Column>
        </>
      )}
    </Grid>
  );
};

export default ProjectDetailPage;
