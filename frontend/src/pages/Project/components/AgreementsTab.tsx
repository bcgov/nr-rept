import { Add } from '@carbon/icons-react';
import {
  Button,
  InlineNotification,
  SkeletonText,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectRow,
  Tabs,
  Tile,
} from '@carbon/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useReptAgreements } from '@/services/rept/hooks';

import { displayValue, formatBoolean, formatDate } from '../utils';

import { AddAgreementForm } from './Agreements/AddAgreementForm';
import { AgreementDetailsTab } from './Agreements/AgreementDetailsTab';
import { AgreementPaymentsTab } from './Agreements/AgreementPaymentsTab';
import { AgreementPropertiesTab } from './Agreements/AgreementPropertiesTab';

import type { ReptAgreement } from '@/services/rept/types';

export type AgreementsTabProps = {
  projectId: string;
};

type AgreementTabKey = 'details' | 'properties' | 'payments';

export const AgreementsTab: FC<AgreementsTabProps> = ({ projectId }) => {
  const { canCreate } = useAuthorization();
  const { display } = useNotification();
  const agreementsQuery = useReptAgreements(projectId);
  const agreements = useMemo(() => agreementsQuery.data ?? [], [agreementsQuery.data]);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AgreementTabKey>('details');
  const [isAddingAgreement, setIsAddingAgreement] = useState(false);
  const [isEditingBelow, setIsEditingBelow] = useState(false);

  useEffect(() => {
    setIsEditingBelow(false);
  }, [activeTab, selectedAgreementId]);

  useEffect(() => {
    if (agreementsQuery.isError) {
      display({
        kind: 'error',
        title: 'Failed to load agreements',
        subtitle: (agreementsQuery.error as Error).message,
        timeout: 9000,
      });
    }
  }, [agreementsQuery.isError, agreementsQuery.error, display]);

  useEffect(() => {
    if (!agreements.length) {
      setSelectedAgreementId(null);
      return;
    }

    setSelectedAgreementId((current) => {
      if (!current) {
        return String(agreements[0].id);
      }
      const exists = agreements.some((agreement) => String(agreement.id) === current);
      return exists ? current : String(agreements[0].id);
    });
  }, [agreements]);

  useEffect(() => {
    setActiveTab('details');
  }, [selectedAgreementId]);

  const selectedAgreement = useMemo(() => {
    if (!selectedAgreementId) {
      return undefined;
    }
    return agreements.find((agreement) => String(agreement.id) === selectedAgreementId);
  }, [agreements, selectedAgreementId]);

  const tabOptions: Array<{ key: AgreementTabKey; label: string }> = [
    { key: 'details', label: 'Details' },
    { key: 'properties', label: 'Properties' },
    { key: 'payments', label: 'Payments' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'details':
        return (
          <AgreementDetailsTab
            projectId={projectId}
            agreementId={selectedAgreementId}
            agreement={selectedAgreement}
            onEditingChange={setIsEditingBelow}
          />
        );
      case 'properties':
        return (
          <AgreementPropertiesTab
            projectId={projectId}
            agreementId={selectedAgreementId}
            onEditingChange={setIsEditingBelow}
          />
        );
      case 'payments':
        return <AgreementPaymentsTab projectId={projectId} agreementId={selectedAgreementId} />;
      default:
        return null;
    }
  };

  const handleAddSuccess = useCallback((newAgreement: ReptAgreement) => {
    setIsAddingAgreement(false);
    setSelectedAgreementId(String(newAgreement.id));
    setActiveTab('details');
  }, []);

  const handleAddCancel = useCallback(() => {
    setIsAddingAgreement(false);
  }, []);

  return (
    <div className="project-tab-panel">
      {agreementsQuery.isPending && <SkeletonText width="70%" lineCount={4} />}

      {/* ── Empty state ── */}
      {!agreementsQuery.isPending && !agreementsQuery.isError && agreements.length === 0 && (
        <>
          {!isAddingAgreement ? (
            <>
              {canCreate && (
                <div className="tab-actions">
                  <Button
                    kind="primary"
                    size="sm"
                    renderIcon={Add}
                    onClick={() => setIsAddingAgreement(true)}
                  >
                    Add Agreement
                  </Button>
                </div>
              )}
              <InlineNotification
                kind="info"
                lowContrast
                title="There aren't any agreements associated with this project."
                hideCloseButton
              />
            </>
          ) : (
            <Tile className="project-tile project-tile--full">
              <AddAgreementForm
                projectId={projectId}
                onSuccess={handleAddSuccess}
                onCancel={handleAddCancel}
              />
            </Tile>
          )}
        </>
      )}

      {/* ── Agreements list ── */}
      {agreements.length > 0 && (
        <Tile className="project-tile project-tile--full">
          <div className="project-tile__header">
            <h2 className="section-title">Agreements</h2>
            {!isAddingAgreement && canCreate && (
              <Button
                kind="primary"
                size="sm"
                renderIcon={Add}
                onClick={() => setIsAddingAgreement(true)}
              >
                Add Agreement
              </Button>
            )}
          </div>
          <div className="bordered-table">
            <Table className="project-table">
              <TableHead>
                <TableRow>
                  <TableHeader aria-label="Selected agreement" />
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Agreement Label</TableHeader>
                  <TableHeader>Active</TableHeader>
                  <TableHeader>Payment Terms</TableHeader>
                  <TableHeader>Expiry Date</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {agreements.map((agreement) => {
                  const isSelected = String(agreement.id) === selectedAgreementId;
                  const rowLocked = isEditingBelow;
                  return (
                    <TableRow
                      key={agreement.id}
                      onClick={
                        rowLocked
                          ? undefined
                          : () => {
                              setSelectedAgreementId(String(agreement.id));
                              setIsAddingAgreement(false);
                            }
                      }
                      className={`property-row${isSelected ? ' property-row--selected' : ''}${
                        rowLocked ? ' property-row--locked' : ''
                      }`}
                    >
                      <TableSelectRow
                        radio
                        id={`agreement-select-${agreement.id}`}
                        name="agreement-selection"
                        ariaLabel={`Select agreement ${agreement.agreementLabel ?? agreement.id}`}
                        checked={isSelected}
                        disabled={rowLocked}
                        onSelect={() => {
                          setSelectedAgreementId(String(agreement.id));
                          setIsAddingAgreement(false);
                        }}
                      />
                      <TableCell>
                        {agreement.agreementType === 'ACQUISITION'
                          ? displayValue(agreement.acquisitionAgreementLabel)
                          : agreement.agreementType === 'DISPOSITION'
                            ? displayValue(agreement.dispositionAgreementLabel)
                            : displayValue(agreement.agreementLabel)}
                      </TableCell>
                      <TableCell>{displayValue(agreement.agreementLabel)}</TableCell>
                      <TableCell>{formatBoolean(agreement.active)}</TableCell>
                      <TableCell>{displayValue(agreement.paymentTerms)}</TableCell>
                      <TableCell>{formatDate(agreement.expiryDate)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Tile>
      )}

      {/* ── Add Agreement Form (when list is not empty) ── */}
      {agreements.length > 0 && isAddingAgreement && (
        <Tile className="project-tile project-tile--full">
          <AddAgreementForm
            projectId={projectId}
            onSuccess={handleAddSuccess}
            onCancel={handleAddCancel}
          />
        </Tile>
      )}

      {/* ── Agreement Workspace (selection detail view) ── */}
      {agreements.length > 0 && !isAddingAgreement && (
        <Tile className="project-tile project-tile--full agreement-workspace-tile">
          <h2 className="section-title">Agreement Details</h2>
          {!selectedAgreementId ? (
            <p className="field-empty">Select an agreement to view its information.</p>
          ) : (
            <div className="agreement-workspace-tabs">
              <Tabs
                selectedIndex={tabOptions.findIndex((tab) => tab.key === activeTab)}
                onChange={({ selectedIndex }) => setActiveTab(tabOptions[selectedIndex].key)}
              >
                <TabList aria-label="Agreement sections" contained>
                  {tabOptions.map((tab) => (
                    <Tab key={tab.key}>{tab.label}</Tab>
                  ))}
                </TabList>
                <TabPanels>
                  {tabOptions.map((tab) => (
                    <TabPanel key={tab.key}>
                      {tab.key === activeTab ? renderActiveTab() : null}
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            </div>
          )}
        </Tile>
      )}
    </div>
  );
};
