import { ArrowLeft } from '@carbon/icons-react';
import { Column, Grid, Tile } from '@carbon/react';
import { useEffect, useMemo, type FC } from 'react';
import { Link, useParams } from 'react-router-dom';

import { usePageTitle } from '@/context/pageTitle/usePageTitle';

import ReportConfigForm from './ReportConfigForm';
import { REPORT_DEFINITIONS, type ReportDefinition } from './reportDefinitions';

import './reports.scss';

const ReportFormPage: FC = () => {
  const params = useParams<{ reportId: ReportDefinition['id'] }>();
  const definition = useMemo(
    () => REPORT_DEFINITIONS.find((item) => item.id === params.reportId),
    [params.reportId],
  );

  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    if (definition) {
      setPageTitle(definition.title, 1);
    }
  }, [definition, setPageTitle]);

  if (!definition) {
    return (
      <Grid fullWidth className="reports-grid">
        <Column sm={4} md={8} lg={16}>
          <Tile>
            <h2>Report not found</h2>
            <p>The requested report is not available. Please return to the reports catalog.</p>
            <Link to="/reports" className="back-link">
              <ArrowLeft size={16} />
              <span>Back to Reports</span>
            </Link>
          </Tile>
        </Column>
      </Grid>
    );
  }

  return (
    <Grid fullWidth className="reports-grid">
      <Column sm={4} md={8} lg={16}>
        <Link to="/reports" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Reports</span>
        </Link>
      </Column>

      <Column sm={4} md={8} lg={16}>
        <Tile>
          <h2>{definition.title}</h2>
          <p className="reports-tile__summary">{definition.summary}</p>

          <ReportConfigForm definition={definition} />
        </Tile>
      </Column>
    </Grid>
  );
};

export default ReportFormPage;
