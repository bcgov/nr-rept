import { Column, Grid, Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import { useEffect, useMemo, type FC } from 'react';

import { usePageTitle } from '@/context/pageTitle/usePageTitle';

import ContactsSection from './components/ContactsSection';
import CoUsersSection from './components/CoUsersSection';
import ExpenseAuthoritiesSection from './components/ExpenseAuthoritiesSection';
import QualifiedReceiversSection from './components/QualifiedReceiversSection';
import RequestingSourcesSection from './components/RequestingSourcesSection';

import './admin.scss';

const AdminPage: FC = () => {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Administration', 1);
  }, [setPageTitle]);

  const tabs = useMemo(
    () => [
      {
        id: 'expense-authorities',
        label: 'Expense authorities',
        content: <ExpenseAuthoritiesSection />,
      },
      {
        id: 'requesting-sources',
        label: 'Requesting sources',
        content: <RequestingSourcesSection />,
      },
      { id: 'co-users', label: 'Co-users', content: <CoUsersSection /> },
      { id: 'contacts', label: 'Contacts', content: <ContactsSection /> },
      {
        id: 'qualified-receivers',
        label: 'Qualified receivers',
        content: <QualifiedReceiversSection />,
      },
    ],
    [],
  );

  return (
    <Grid fullWidth className="default-grid admin-grid">
      <Column sm={4} md={8} lg={16}>
        <div className="page-title-container">
          <h1>Administration</h1>
        </div>
      </Column>

      <Column sm={4} md={8} lg={16}>
        <Tabs>
          <TabList aria-label="Admin sections" contained>
            {tabs.map((tab) => (
              <Tab key={tab.id}>{tab.label}</Tab>
            ))}
          </TabList>
          <TabPanels>
            {tabs.map((tab) => (
              <TabPanel key={tab.id}>{tab.content}</TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Column>
    </Grid>
  );
};

export default AdminPage;
