import { Add } from '@carbon/icons-react';
import {
  Button,
  Column,
  Grid,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from '@carbon/react';
import { useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildApiUrl } from '@/config/api/baseUrl';
import { ensureSessionFresh } from '@/context/auth/refreshSession';
import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import { buildAuthorizedHeaders } from '@/services/http/headers';
import './dashboard.scss';

type Project = {
  id: number;
  filePrefix?: string | null;
  projectNumber?: number | null;
  fileSuffix?: string | null;
  projectName?: string | null;
  fileNumber?: string | null;
  requestDate?: string | null;
};

const DashboardPage: FC = () => {
  const navigate = useNavigate();
  const { canCreate } = useAuthorization();
  const { display } = useNotification();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setHasError(false);

    ensureSessionFresh()
      .then(async () => {
        const headers = await buildAuthorizedHeaders();
        return fetch(buildApiUrl('/rept/welcome/recent?size=8'), {
          signal: controller.signal,
          credentials: 'include',
          headers,
        });
      })
      .then((response) => {
        if (response.status === 204) {
          setProjects([]);
          return null;
        }
        if (!response.ok) {
          throw new Error(`Unable to load recent projects (${response.status})`);
        }
        return response.json();
      })
      .then((data: Project[] | null) => {
        if (controller.signal.aborted) return;
        if (data) setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        display({
          kind: 'error',
          title: "We couldn't load your recent projects",
          subtitle: err.message,
          timeout: 9000,
        });
        setHasError(true);
        setProjects([]);
        setLoading(false);
      });

    return () => controller.abort();
  }, [display]);

  const recentContent = useMemo(() => {
    if (loading) {
      return (
        <div aria-busy>
          <div style={{ marginBottom: '1rem' }}>
            <SkeletonText heading width="60%" />
          </div>
          <SkeletonText width="95%" lineCount={4} />
        </div>
      );
    }

    if (hasError) {
      return <p>We couldn't load your recent projects.</p>;
    }

    if (!projects.length) {
      return <p>You haven't opened any project files recently.</p>;
    }

    return (
      <div className="bordered-table">
        <Table size="md" useZebraStyles>
          <TableHead>
            <TableRow>
              <TableHeader>File ID</TableHeader>
              <TableHeader>Project name</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="rept-projects-table__row"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <TableCell>
                  <Tag type="blue">{project.fileNumber ?? '—'}</Tag>
                </TableCell>
                <TableCell>{project.projectName || 'Untitled project'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }, [hasError, loading, navigate, projects]);

  return (
    <Grid fullWidth className="default-grid dashboard-grid">
      <Column sm={4} md={8} lg={16}>
        <div className="dashboard__header">
          <h1>Welcome to REPT</h1>
          {canCreate && (
            <Button
              kind="primary"
              size="md"
              renderIcon={Add}
              className="dashboard__add-button"
              onClick={() => navigate('/projects/create')}
            >
              Add project file
            </Button>
          )}
        </div>
      </Column>

      <Column sm={4} md={8} lg={16}>
        <h2 className="recent-projects__title">Recently updated projects</h2>
        {recentContent}
      </Column>
    </Grid>
  );
};

export default DashboardPage;
