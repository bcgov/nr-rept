import { Accordion, AccordionItem, Column, Grid, Tag } from '@carbon/react';
import { useEffect, useState, type FC } from 'react';

import { usePageTitle } from '@/context/pageTitle/usePageTitle';

import ReportConfigForm from './ReportConfigForm';
import { REPORT_DEFINITIONS, type ReportDefinition } from './reportDefinitions';

import './reports.scss';

type ReportRowProps = {
  definition: ReportDefinition;
};

const ReportAccordionTitle: FC<ReportRowProps> = ({ definition }) => {
  return (
    <div className="reports-row">
      <div className="reports-row__cell reports-row__cell--name">{definition.title}</div>
      <div className="reports-row__cell reports-row__cell--description">{definition.summary}</div>
      <div className="reports-row__cell reports-row__cell--formats">
        {definition.availableFormats.map((format) => (
          <Tag key={format} type="blue" size="sm">
            {format.toUpperCase()}
          </Tag>
        ))}
      </div>
    </div>
  );
};

const ReportsLandingPage: FC = () => {
  const { setPageTitle } = usePageTitle();
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Reports', 1);
  }, [setPageTitle]);

  return (
    <Grid fullWidth className="default-grid reports-grid">
      <Column sm={4} md={8} lg={16}>
        <div className="page-title-container">
          <h1>Reports</h1>
        </div>
      </Column>

      <Column sm={4} md={8} lg={16}>
        <div className="reports-accordion-table">
          <div className="reports-row reports-row--header" role="row">
            <div className="reports-row__cell reports-row__cell--name">Report</div>
            <div className="reports-row__cell reports-row__cell--description">Description</div>
            <div className="reports-row__cell reports-row__cell--formats">Formats</div>
          </div>
          <Accordion className="reports-accordion" align="start">
            {REPORT_DEFINITIONS.map((definition) => {
              const isOpen = openId === definition.id;
              return (
                <AccordionItem
                  key={definition.id}
                  open={isOpen}
                  onHeadingClick={({ isOpen: nextOpen }) =>
                    setOpenId(nextOpen ? definition.id : null)
                  }
                  title={<ReportAccordionTitle definition={definition} />}
                >
                  <ReportConfigForm definition={definition} />
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </Column>
    </Grid>
  );
};

export default ReportsLandingPage;
