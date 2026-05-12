import { Add, Link, SubtractAlt as Subtract } from '@carbon/icons-react';
import {
  Button,
  InlineNotification,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from '@carbon/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
  useReptAgreementProperties,
  useReptPropertySummaries,
  useUpdateAgreementProperties,
} from '@/services/rept/hooks';

import { displayValue, formatWithCode } from '../../utils';

import type { ReptAgreementProperty, ReptPropertySummary } from '@/services/rept/types';

type AgreementPropertiesTabProps = {
  projectId: string;
  agreementId?: string | null;
};

type PropertyOption = {
  id: number;
  parcelIdentifier?: string | null;
  titleNumber?: string | null;
  legalDescription?: string | null;
  city?: string | null;
  acquisitionLabel?: string | null;
  acquisitionCode?: string | null;
};

const buildAgreementPropertyRow = (property: ReptAgreementProperty) => [
  displayValue(property.titleNumber),
  displayValue(property.parcelIdentifier),
  formatWithCode(property.acquisitionLabel, property.acquisitionCode),
  formatWithCode(property.landTitleOfficeLabel, property.landTitleOfficeCode),
  displayValue(property.legalDescription),
];

const mapProjectPropertyToOption = (property: ReptPropertySummary): PropertyOption => ({
  id: property.id,
  parcelIdentifier: property.parcelIdentifier,
  titleNumber: property.titleNumber,
  legalDescription: property.legalDescription,
  city: property.city,
  acquisitionLabel: property.acquisitionLabel,
  acquisitionCode: property.acquisitionCode,
});

const mapAgreementPropertyToOption = (property: ReptAgreementProperty): PropertyOption => ({
  id: property.propertyId,
  parcelIdentifier: property.parcelIdentifier,
  titleNumber: property.titleNumber,
  legalDescription: property.legalDescription,
  acquisitionLabel: property.acquisitionLabel,
  acquisitionCode: property.acquisitionCode,
});

export const AgreementPropertiesTab: FC<AgreementPropertiesTabProps> = ({
  projectId,
  agreementId,
}) => {
  const { canEdit } = useAuthorization();
  const { display } = useNotification();
  const hasSelection = Boolean(agreementId);

  const agreementPropertiesQuery = useReptAgreementProperties(projectId, agreementId ?? undefined);
  const projectPropertiesQuery = useReptPropertySummaries(projectId);
  const updateAgreementPropertiesMutation = useUpdateAgreementProperties(
    projectId,
    agreementId ?? undefined,
  );

  useEffect(() => {
    if (projectPropertiesQuery.isError) {
      display({
        kind: 'error',
        title: 'Failed to load project properties',
        subtitle: (projectPropertiesQuery.error as Error).message,
        timeout: 9000,
      });
    }
  }, [projectPropertiesQuery.isError, projectPropertiesQuery.error, display]);

  useEffect(() => {
    if (agreementPropertiesQuery.isError) {
      display({
        kind: 'error',
        title: 'Failed to load agreement properties',
        subtitle: (agreementPropertiesQuery.error as Error).message,
        timeout: 9000,
      });
    }
  }, [agreementPropertiesQuery.isError, agreementPropertiesQuery.error, display]);

  useEffect(() => {
    if (updateAgreementPropertiesMutation.isError) {
      display({
        kind: 'error',
        title: 'Unable to save properties',
        subtitle: (updateAgreementPropertiesMutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [updateAgreementPropertiesMutation.isError, updateAgreementPropertiesMutation.error, display]);

  const agreementProperties = useMemo(
    () => agreementPropertiesQuery.data ?? [],
    [agreementPropertiesQuery.data],
  );
  const projectProperties = useMemo(
    () => projectPropertiesQuery.data ?? [],
    [projectPropertiesQuery.data],
  );

  const [isEditingProperties, setIsEditingProperties] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [draftPropertyIds, setDraftPropertyIds] = useState<number[]>([]);

  useEffect(() => {
    setIsEditingProperties(false);
    setPropertySearch('');
    setDraftPropertyIds([]);
  }, [agreementId]);

  const selectedPropertyIdSet = useMemo(
    () => new Set(agreementProperties.map((property) => property.propertyId)),
    [agreementProperties],
  );

  const draftPropertyIdSet = useMemo(() => new Set(draftPropertyIds), [draftPropertyIds]);

  const agreementPropertyFallbackMap = useMemo(
    () => new Map(agreementProperties.map((property) => [property.propertyId, property])),
    [agreementProperties],
  );

  const projectPropertyMap = useMemo(
    () => new Map(projectProperties.map((property) => [property.id, property])),
    [projectProperties],
  );

  const availableProperties = useMemo(() => {
    if (!isEditingProperties) {
      return [];
    }
    const searchTerm = propertySearch.trim().toLowerCase();
    return projectProperties
      .filter((property) => !draftPropertyIdSet.has(property.id))
      .filter((property) => {
        if (!searchTerm) {
          return true;
        }
        const haystack = [
          property.parcelIdentifier,
          property.titleNumber,
          property.legalDescription,
          property.city,
        ]
          .filter(Boolean)
          .map((value) => value!.toLowerCase());
        return haystack.some((value) => value.includes(searchTerm));
      })
      .map(mapProjectPropertyToOption);
  }, [draftPropertyIdSet, isEditingProperties, projectProperties, propertySearch]);

  const selectedDraftProperties = useMemo(() => {
    if (!isEditingProperties) {
      return [];
    }
    return draftPropertyIds
      .map((id) => {
        const projectProperty = projectPropertyMap.get(id);
        if (projectProperty) {
          return mapProjectPropertyToOption(projectProperty);
        }
        const agreementProperty = agreementPropertyFallbackMap.get(id);
        if (agreementProperty) {
          return mapAgreementPropertyToOption(agreementProperty);
        }
        return undefined;
      })
      .filter((value): value is PropertyOption => Boolean(value));
  }, [agreementPropertyFallbackMap, draftPropertyIds, isEditingProperties, projectPropertyMap]);

  const hasPropertyChanges = useMemo(() => {
    if (!isEditingProperties) {
      return false;
    }
    if (draftPropertyIdSet.size !== selectedPropertyIdSet.size) {
      return true;
    }
    for (const id of draftPropertyIdSet) {
      if (!selectedPropertyIdSet.has(id)) {
        return true;
      }
    }
    return false;
  }, [draftPropertyIdSet, isEditingProperties, selectedPropertyIdSet]);

  const handleStartEditProperties = useCallback(() => {
    setDraftPropertyIds(agreementProperties.map((property) => property.propertyId));
    setPropertySearch('');
    setIsEditingProperties(true);
  }, [agreementProperties]);

  const handleCancelEditProperties = useCallback(() => {
    setIsEditingProperties(false);
    setPropertySearch('');
    setDraftPropertyIds([]);
  }, []);

  const handleAddProperty = useCallback((propertyId: number) => {
    setDraftPropertyIds((current) => {
      if (current.includes(propertyId)) {
        return current;
      }
      return [...current, propertyId];
    });
  }, []);

  const handleRemoveProperty = useCallback((propertyId: number) => {
    setDraftPropertyIds((current) => current.filter((id) => id !== propertyId));
  }, []);

  const handleSaveProperties = useCallback(() => {
    if (!agreementId) {
      return;
    }
    updateAgreementPropertiesMutation.mutate(
      { propertyIds: draftPropertyIds },
      {
        onSuccess: () => {
          setIsEditingProperties(false);
          setPropertySearch('');
        },
      },
    );
  }, [agreementId, draftPropertyIds, updateAgreementPropertiesMutation]);

  const renderPropertyItem = useCallback(
    (property: PropertyOption, action: 'add' | 'remove') => {
      const heading =
        property.parcelIdentifier || property.titleNumber || `Property #${property.id}`;
      const metadata = [
        property.titleNumber && property.titleNumber !== heading ? property.titleNumber : null,
        property.city,
        property.acquisitionLabel,
      ]
        .filter(Boolean)
        .join(' • ');

      return (
        <div className="agreement-properties-editor__item" key={`${action}-${property.id}`}>
          <div className="agreement-properties-editor__item-content">
            <p className="agreement-properties-editor__item-title">{heading}</p>
            {metadata && <p className="agreement-properties-editor__item-subtitle">{metadata}</p>}
            {property.legalDescription && (
              <p className="agreement-properties-editor__item-subtitle">
                {property.legalDescription}
              </p>
            )}
          </div>
          <Button
            kind={action === 'add' ? 'primary' : 'danger'}
            size="sm"
            renderIcon={action === 'add' ? Add : Subtract}
            iconDescription={action === 'add' ? 'Add property' : 'Remove property'}
            disabled={updateAgreementPropertiesMutation.isPending}
            onClick={() =>
              action === 'add' ? handleAddProperty(property.id) : handleRemoveProperty(property.id)
            }
          >
            {action === 'add' ? 'Add' : 'Remove'}
          </Button>
        </div>
      );
    },
    [handleAddProperty, handleRemoveProperty, updateAgreementPropertiesMutation.isPending],
  );

  if (!hasSelection) {
    return <p className="field-empty">Select an agreement to manage its properties.</p>;
  }

  const isLoading = agreementPropertiesQuery.isPending || projectPropertiesQuery.isPending;
  const hasPropertiesError = agreementPropertiesQuery.isError || projectPropertiesQuery.isError;

  return (
    <div className="agreement-properties-tab">
      {!isEditingProperties && canEdit && (
        <div className="project-summary-readonly__actions">
          <Button
            kind="primary"
            size="sm"
            renderIcon={Link}
            disabled={!projectProperties.length || isLoading || hasPropertiesError}
            onClick={handleStartEditProperties}
          >
            Link properties
          </Button>
        </div>
      )}

      {!isEditingProperties && agreementPropertiesQuery.isPending && (
        <SkeletonText width="60%" lineCount={3} />
      )}

      {isEditingProperties && (
        <div className="agreement-properties-editor">
          <div className="agreement-properties-editor__columns">
            <div className="agreement-properties-editor__column">
              <h4>Available Properties ({availableProperties.length})</h4>
              <TextInput
                id="agreement-property-search"
                labelText="Filter properties"
                placeholder="Search by PID, title, or city"
                value={propertySearch}
                onChange={(event) => setPropertySearch(event.target.value)}
              />
              <div className="agreement-properties-editor__list">
                {availableProperties.length === 0 ? (
                  <p className="field-empty">No properties match your search.</p>
                ) : (
                  availableProperties.map((property) => renderPropertyItem(property, 'add'))
                )}
              </div>
            </div>
            <div className="agreement-properties-editor__column">
              <h4>Selected Properties ({draftPropertyIds.length})</h4>
              <div className="agreement-properties-editor__list">
                {selectedDraftProperties.length === 0 ? (
                  <p className="field-empty">No properties selected.</p>
                ) : (
                  selectedDraftProperties.map((property) => renderPropertyItem(property, 'remove'))
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button
              kind="secondary"
              size="sm"
              disabled={updateAgreementPropertiesMutation.isPending}
              onClick={handleCancelEditProperties}
            >
              Cancel
            </Button>
            <Button
              kind="primary"
              size="sm"
              disabled={updateAgreementPropertiesMutation.isPending || !hasPropertyChanges}
              onClick={handleSaveProperties}
            >
              {updateAgreementPropertiesMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}

      {!isEditingProperties &&
        !agreementPropertiesQuery.isPending &&
        !agreementPropertiesQuery.isError &&
        agreementProperties.length === 0 && (
          <InlineNotification
            kind="info"
            lowContrast
            title="This agreement is not linked to any properties."
            hideCloseButton
          />
        )}

      {!isEditingProperties && agreementProperties.length > 0 && (
        <div className="bordered-table">
          <Table className="project-table" useZebraStyles>
            <TableHead>
              <TableRow>
                <TableHeader>Title Number</TableHeader>
                <TableHeader>PID</TableHeader>
                <TableHeader>Acquisition Type</TableHeader>
                <TableHeader>LTO</TableHeader>
                <TableHeader>Legal Description</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {agreementProperties.map((property) => (
                <TableRow key={property.associationId}>
                  {buildAgreementPropertyRow(property).map((value, index) => (
                    <TableCell key={`${property.associationId}-${index}`}>{value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
