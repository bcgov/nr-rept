import { Add, Edit, TrashCan } from '@carbon/icons-react';
import {
  IconButton,
  InlineNotification,
  Select,
  SelectItem,
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
  TextInput,
  Tile,
  Button,
} from '@carbon/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import DestructiveModal from '@/components/core/DestructiveModal';
import { Modal } from '@/components/Modal';
import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
  useReptPropertyComposite,
  useReptPropertySummaries,
  useReptPropertyOptions,
  useCreateReptProperty,
  useUpdateReptPropertyDetails,
  useUpdateReptPropertyMilestones,
  useDeleteReptProperty,
  useUpsertReptPropertyRegistration,
  useUpsertReptPropertyExpropriation,
  useAddReptPropertyContact,
  useRemoveReptPropertyContact,
  useReptProjectContactOptions,
  useReptContactSearch,
} from '@/services/rept/hooks';

import { MISSING_VALUE, displayValue, formatBoolean, formatDate, formatWithCode } from '../utils';

import { FieldList, type DetailField } from './FieldList';
import {
  PropertyDetailsForm,
  PropertyMilestonesForm,
  PropertyRegistrationForm,
  PropertyExpropriationForm,
  type PropertyDetailsFormState,
  type PropertyMilestonesFormState,
  type PropertyRegistrationFormState,
  type PropertyExpropriationFormState,
} from './properties';

import type {
  ReptContact,
  ReptContactSearchItem,
  ReptPropertyDetail,
  ReptPropertyExpropriation,
  ReptPropertyMilestones,
  ReptPropertyRegistration,
  ReptPropertySummary,
  ReptPropertyOptions,
} from '@/services/rept/types';
import type { FC } from 'react';

type PropertiesTabProps = {
  projectId: string;
};

// Helper functions
const normalizeNullableString = (value: string | undefined | null) => {
  if (value == null) return null;
  const trimmed = value.trim();
  // Handle string "undefined" or "null" which can occur from String() coercion
  if (trimmed.length === 0 || trimmed === 'undefined' || trimmed === 'null') {
    return null;
  }
  return trimmed;
};

const parseNumberOrNull = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

const createDetailsFormState = (detail?: ReptPropertyDetail | null): PropertyDetailsFormState => ({
  titleNumber: detail?.titleNumber ?? '',
  parcelIdentifier: detail?.parcelIdentifier ?? '',
  legalDescription: detail?.legalDescription ?? '',
  parcelAddress: detail?.parcelAddress ?? '',
  city: detail?.city ?? '',
  parcelArea: detail?.parcelArea != null ? String(detail.parcelArea) : '',
  projectArea: detail?.projectArea != null ? String(detail.projectArea) : '',
  assessedValue: detail?.assessedValue != null ? String(detail.assessedValue) : '',
  acquisitionCode: detail?.acquisitionCode ?? '',
  landTitleOfficeCode: detail?.landTitleOfficeCode ?? '',
  electoralDistrictCode: detail?.electoralDistrictCode ?? '',
  orgUnitNumber: detail?.orgUnitNumber != null ? String(detail.orgUnitNumber) : '',
  expropriationRecommended: detail?.expropriationRecommended ?? false,
});

const createMilestonesFormState = (
  milestones?: ReptPropertyMilestones | null,
): PropertyMilestonesFormState => ({
  ownerContactDate: milestones?.ownerContactDate ?? '',
  internalAppraisalDate: milestones?.internalAppraisalDate ?? '',
  roadValueRequestedDate: milestones?.roadValueRequestedDate ?? '',
  roadValueReceivedDate: milestones?.roadValueReceivedDate ?? '',
  fundingRequestedDate: milestones?.fundingRequestedDate ?? '',
  fundingApprovedDate: milestones?.fundingApprovedDate ?? '',
  surveyRequestedDate: milestones?.surveyRequestedDate ?? '',
  surveyReceivedDate: milestones?.surveyReceivedDate ?? '',
  feeAppraisalRequestedDate: milestones?.feeAppraisalRequestedDate ?? '',
  feeAppraisalReceivedDate: milestones?.feeAppraisalReceivedDate ?? '',
  offerDate: milestones?.offerDate ?? '',
  offerAcceptedDate: milestones?.offerAcceptedDate ?? '',
  completionDate: milestones?.completionDate ?? '',
  assessmentComment: milestones?.assessmentComment ?? '',
  negotiationComment: milestones?.negotiationComment ?? '',
  acquisitionComment: milestones?.acquisitionComment ?? '',
  expropriationRecommended: milestones?.expropriationRecommended ?? false,
});

const createRegistrationFormState = (
  registration?: ReptPropertyRegistration | null,
): PropertyRegistrationFormState => ({
  ltoPlanNumber: registration?.ltoPlanNumber ?? '',
  ltoDocumentNumber: registration?.ltoDocumentNumber ?? '',
  surveyTubeNumber: registration?.surveyTubeNumber ?? '',
  registrationDate: registration?.registrationDate ?? '',
});

const createExpropriationFormState = (
  expropriation?: ReptPropertyExpropriation | null,
): PropertyExpropriationFormState => ({
  executiveApprovalDate: expropriation?.executiveApprovalDate ?? '',
  consensualServiceDate: expropriation?.consensualServiceDate ?? '',
  noticeAdvancePaymentDate: expropriation?.noticeAdvancePaymentDate ?? '',
  vestingDate: expropriation?.vestingDate ?? '',
});

const buildPropertyOptionLabel = (property: ReptPropertySummary): string => {
  const pid = property.parcelIdentifier?.trim();
  if (pid) return pid;
  const title = property.titleNumber?.trim();
  if (title) return title;
  return `Property ${property.id}`;
};

const buildPropertyDetails = (
  property?: ReptPropertyDetail | ReptPropertySummary | null,
): DetailField[] => {
  if (!property) return [];

  const isDetail = 'projectId' in property;
  const detail = isDetail ? (property as ReptPropertyDetail) : undefined;

  return [
    { label: 'Parcel Identifier (PID)', value: displayValue(property.parcelIdentifier) },
    { label: 'Title Number', value: displayValue(property.titleNumber) },
    {
      label: 'LTO Code',
      value: formatWithCode(property.landTitleOfficeLabel, property.landTitleOfficeCode),
    },
    {
      label: 'Acquisition Type',
      value: formatWithCode(property.acquisitionLabel, property.acquisitionCode),
    },
    {
      label: 'Electoral District',
      value: isDetail
        ? formatWithCode(detail?.electoralDistrictLabel, detail?.electoralDistrictCode)
        : MISSING_VALUE,
    },
    {
      label: 'Forest District',
      value: isDetail
        ? formatWithCode(detail?.orgUnitName, detail?.orgUnitCode ?? detail?.orgUnitNumber)
        : MISSING_VALUE,
    },
    { label: 'Parent (ha)', value: displayValue(property.parcelArea) },
    { label: 'Taking (ha)', value: displayValue(property.projectArea) },
    { label: 'Assessed Value', value: displayValue(property.assessedValue) },
    { label: 'Property Address', value: displayValue(property.parcelAddress) },
    { label: 'Property City', value: displayValue(property.city) },
    { label: 'Legal Description', value: displayValue(property.legalDescription) },
    {
      label: 'Revision Count',
      value: isDetail ? displayValue(detail?.revisionCount) : MISSING_VALUE,
    },
    {
      label: 'Expropriation Recommended',
      value: formatBoolean(property.expropriationRecommended),
    },
  ];
};

const buildAssessmentMilestones = (milestones?: ReptPropertyMilestones | null): DetailField[] => {
  if (!milestones) return [];
  return [
    { label: 'Owner Contact Date', value: formatDate(milestones.ownerContactDate) },
    { label: 'Internal Appraisal Date', value: formatDate(milestones.internalAppraisalDate) },
    { label: 'Road Value Requested', value: formatDate(milestones.roadValueRequestedDate) },
    { label: 'Road Value Received', value: formatDate(milestones.roadValueReceivedDate) },
    { label: 'Funding Requested', value: formatDate(milestones.fundingRequestedDate) },
    { label: 'Funding Approved', value: formatDate(milestones.fundingApprovedDate) },
    { label: 'Survey Requested', value: formatDate(milestones.surveyRequestedDate) },
    { label: 'Survey Received', value: formatDate(milestones.surveyReceivedDate) },
    {
      label: 'Assessment Comment',
      value: displayValue(milestones.assessmentComment),
      fullWidth: true,
    },
  ];
};

const buildNegotiationMilestones = (milestones?: ReptPropertyMilestones | null): DetailField[] => {
  if (!milestones) return [];
  return [
    { label: 'Fee Appraisal Requested', value: formatDate(milestones.feeAppraisalRequestedDate) },
    { label: 'Fee Appraisal Received', value: formatDate(milestones.feeAppraisalReceivedDate) },
    { label: 'Offer Date', value: formatDate(milestones.offerDate) },
    {
      label: 'Negotiation Comment',
      value: displayValue(milestones.negotiationComment),
      fullWidth: true,
    },
  ];
};

const buildAcquisitionMilestones = (milestones?: ReptPropertyMilestones | null): DetailField[] => {
  if (!milestones) return [];
  return [
    { label: 'Offer Accepted', value: formatDate(milestones.offerAcceptedDate) },
    { label: 'Completion Date', value: formatDate(milestones.completionDate) },
    {
      label: 'Acquisition Comment',
      value: displayValue(milestones.acquisitionComment),
      fullWidth: true,
    },
    {
      label: 'Expropriation Recommended',
      value: formatBoolean(milestones.expropriationRecommended),
    },
  ];
};

const buildPropertyRegistration = (
  registration?: ReptPropertyRegistration | null,
): DetailField[] => {
  if (!registration) return [];
  return [
    { label: 'LTO Plan Number', value: displayValue(registration.ltoPlanNumber) },
    { label: 'LTO Document Number', value: displayValue(registration.ltoDocumentNumber) },
    { label: 'Survey Tube Number', value: displayValue(registration.surveyTubeNumber) },
    { label: 'Registration Date', value: formatDate(registration.registrationDate) },
    { label: 'Revision Count', value: displayValue(registration.revisionCount) },
  ];
};

const buildPropertyExpropriation = (
  expropriation?: ReptPropertyExpropriation | null,
): DetailField[] => {
  if (!expropriation) return [];
  return [
    { label: 'Executive Approval Date', value: formatDate(expropriation.executiveApprovalDate) },
    { label: 'Consensual Service Date', value: formatDate(expropriation.consensualServiceDate) },
    {
      label: 'Notice of Advance Payment Date',
      value: formatDate(expropriation.noticeAdvancePaymentDate),
    },
    { label: 'Vesting Date', value: formatDate(expropriation.vestingDate) },
    { label: 'Revision Count', value: displayValue(expropriation.revisionCount) },
  ];
};

const validateDetailsForm = (form: PropertyDetailsFormState): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!normalizeNullableString(form.city)) {
    errors.city = 'City is required.';
  }
  if (!normalizeNullableString(form.parcelIdentifier)) {
    errors.parcelIdentifier = 'Parcel Identifier (PID) is required.';
  }
  if (!normalizeNullableString(form.legalDescription)) {
    errors.legalDescription = 'Legal description is required.';
  }
  if (!normalizeNullableString(form.acquisitionCode)) {
    errors.acquisitionCode = 'Acquisition type is required.';
  }
  if (!normalizeNullableString(form.landTitleOfficeCode)) {
    errors.landTitleOfficeCode = 'Land title office is required.';
  }
  if (!normalizeNullableString(form.electoralDistrictCode)) {
    errors.electoralDistrictCode = 'Electoral district is required.';
  }
  if (parseNumberOrNull(form.orgUnitNumber) == null) {
    errors.orgUnitNumber = 'Forest district is required.';
  }
  if (parseNumberOrNull(form.parcelArea) == null) {
    errors.parcelArea = 'Parent area is required.';
  }
  if (parseNumberOrNull(form.projectArea) == null) {
    errors.projectArea = 'Taking area is required.';
  }

  return errors;
};

const validateExpropriationForm = (
  form: PropertyExpropriationFormState,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!normalizeNullableString(form.executiveApprovalDate)) {
    errors.executiveApprovalDate = 'Executive approval date is required.';
  }

  const hasConsensual = Boolean(normalizeNullableString(form.consensualServiceDate));
  const hasNotice = Boolean(normalizeNullableString(form.noticeAdvancePaymentDate));
  if (hasConsensual && hasNotice) {
    const message =
      'Enter either Consensual Service Date or Notice of Advance Payment Date — not both.';
    errors.consensualServiceDate = message;
    errors.noticeAdvancePaymentDate = message;
  }

  return errors;
};

const PropertyContactsTable: FC<{
  contacts: ReptContact[];
  canDelete?: boolean;
  onRemove?: (associationId: number, displayName: string) => void;
  removeDisabled?: boolean;
}> = ({ contacts, canDelete, onRemove, removeDisabled }) => {
  if (!contacts.length) {
    return (
      <InlineNotification
        kind="info"
        lowContrast
        title="No contacts recorded for this property."
        hideCloseButton
      />
    );
  }

  return (
    <div className="bordered-table">
      <Table className="project-table" useZebraStyles>
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Contact Type</TableHeader>
            <TableHeader>Company</TableHeader>
            <TableHeader>Phone</TableHeader>
            <TableHeader>Email</TableHeader>
            <TableHeader>Address</TableHeader>
            {canDelete && <TableHeader>Actions</TableHeader>}
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((contact) => {
            const addressParts = [
              contact.address,
              contact.city,
              contact.provinceState,
              contact.country,
              contact.postalZipCode,
            ].filter((v) => v != null && v !== '' && v !== 'undefined');

            return (
              <TableRow key={contact.associationId}>
                <TableCell>{displayValue(contact.displayName)}</TableCell>
                <TableCell>
                  {formatWithCode(contact.contactTypeLabel, contact.contactTypeCode)}
                </TableCell>
                <TableCell>{displayValue(contact.companyName)}</TableCell>
                <TableCell>{displayValue(contact.phone)}</TableCell>
                <TableCell>{displayValue(contact.email)}</TableCell>
                <TableCell>
                  {addressParts.length > 0 ? addressParts.join(', ') : MISSING_VALUE}
                </TableCell>
                {canDelete && (
                  <TableCell>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={TrashCan}
                      iconDescription="Remove contact"
                      hasIconOnly
                      onClick={() =>
                        onRemove?.(contact.associationId, contact.displayName ?? 'Unknown')
                      }
                      disabled={removeDisabled}
                    />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

type PropertyDetailTabsProps = {
  projectId: string;
  propertyId: string;
  propertyCompositeReturn: ReturnType<typeof useReptPropertyComposite>;
  selectedSummary?: ReptPropertySummary;
  options?: ReptPropertyOptions | null;
  onEditingChange?: (editing: boolean) => void;
};

const PropertyDetailTabs: FC<PropertyDetailTabsProps> = ({
  projectId,
  propertyId,
  propertyCompositeReturn,
  selectedSummary,
  options,
  onEditingChange,
}) => {
  const { canEdit, canDelete } = useAuthorization();
  const { display } = useNotification();
  const { detail, milestones, registration, expropriation, contacts } = propertyCompositeReturn;
  const [activeTab, setActiveTab] = useState(0);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form states
  const [detailsForm, setDetailsForm] = useState<PropertyDetailsFormState>(() =>
    createDetailsFormState(detail.data),
  );
  const [milestonesForm, setMilestonesForm] = useState<PropertyMilestonesFormState>(() =>
    createMilestonesFormState(milestones.data),
  );
  const [registrationForm, setRegistrationForm] = useState<PropertyRegistrationFormState>(() =>
    createRegistrationFormState(registration.data),
  );
  const [expropriationForm, setExpropriationForm] = useState<PropertyExpropriationFormState>(() =>
    createExpropriationFormState(expropriation.data),
  );

  // Mutations
  const updateDetailsMutation = useUpdateReptPropertyDetails(projectId, propertyId);
  const updateMilestonesMutation = useUpdateReptPropertyMilestones(projectId, propertyId);
  const upsertRegistrationMutation = useUpsertReptPropertyRegistration(projectId, propertyId);
  const upsertExpropriationMutation = useUpsertReptPropertyExpropriation(projectId, propertyId);

  // Property contact mutations and state
  const addPropertyContactMutation = useAddReptPropertyContact(projectId, propertyId);
  const removePropertyContactMutation = useRemoveReptPropertyContact(projectId, propertyId);
  const contactOptionsQuery = useReptProjectContactOptions(projectId);

  useEffect(() => {
    if (updateDetailsMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to save',
        subtitle: (updateDetailsMutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [updateDetailsMutation.isError, updateDetailsMutation.error, display]);

  useEffect(() => {
    if (updateMilestonesMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to save',
        subtitle: (updateMilestonesMutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [updateMilestonesMutation.isError, updateMilestonesMutation.error, display]);

  useEffect(() => {
    if (upsertRegistrationMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to save',
        subtitle: (upsertRegistrationMutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [upsertRegistrationMutation.isError, upsertRegistrationMutation.error, display]);

  useEffect(() => {
    if (upsertExpropriationMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to save',
        subtitle: (upsertExpropriationMutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [upsertExpropriationMutation.isError, upsertExpropriationMutation.error, display]);

  useEffect(() => {
    if (addPropertyContactMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to add contact',
        subtitle: (addPropertyContactMutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [addPropertyContactMutation.isError, addPropertyContactMutation.error, display]);

  useEffect(() => {
    if (removePropertyContactMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to remove contact',
        subtitle: (removePropertyContactMutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [removePropertyContactMutation.isError, removePropertyContactMutation.error, display]);

  useEffect(() => {
    onEditingChange?.(editingTab !== null);
  }, [editingTab, onEditingChange]);

  useEffect(() => {
    if (detail.isError) {
      display({
        kind: 'error',
        title: 'Failed to load property details',
        subtitle: (detail.error as Error).message,
        timeout: 9000,
      });
    }
  }, [detail.isError, detail.error, display]);

  useEffect(() => {
    if (milestones.isError) {
      display({
        kind: 'error',
        title: 'Failed to load property milestones',
        subtitle: (milestones.error as Error).message,
        timeout: 9000,
      });
    }
  }, [milestones.isError, milestones.error, display]);

  useEffect(() => {
    if (registration.isError) {
      display({
        kind: 'error',
        title: 'Failed to load property registration',
        subtitle: (registration.error as Error).message,
        timeout: 9000,
      });
    }
  }, [registration.isError, registration.error, display]);

  useEffect(() => {
    if (expropriation.isError) {
      display({
        kind: 'error',
        title: 'Failed to load property expropriation',
        subtitle: (expropriation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [expropriation.isError, expropriation.error, display]);

  useEffect(() => {
    if (contacts.isError) {
      display({
        kind: 'error',
        title: 'Failed to load property contacts',
        subtitle: (contacts.error as Error).message,
        timeout: 9000,
      });
    }
  }, [contacts.isError, contacts.error, display]);
  const contactOptions = contactOptionsQuery.data;

  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [contactSearchFirstName, setContactSearchFirstName] = useState('');
  const [contactSearchLastName, setContactSearchLastName] = useState('');
  const [contactSearchCompanyName, setContactSearchCompanyName] = useState('');
  const [contactSearchParams, setContactSearchParams] = useState<{
    firstName?: string;
    lastName?: string;
    companyName?: string;
    _nonce?: number;
  } | null>(null);
  const [selectedContact, setSelectedContact] = useState<ReptContactSearchItem | null>(null);
  const [selectedContactType, setSelectedContactType] = useState('');
  const [deleteContactConfirm, setDeleteContactConfirm] = useState<{
    associationId: number;
    displayName: string;
  } | null>(null);

  const contactSearchQuery = useReptContactSearch(projectId, contactSearchParams);
  const contactSearchResults = contactSearchQuery.data?.contacts ?? [];

  const handleOpenAddContactModal = useCallback(() => {
    setContactSearchFirstName('');
    setContactSearchLastName('');
    setContactSearchCompanyName('');
    setContactSearchParams(null);
    setSelectedContact(null);
    setSelectedContactType('');
    setIsAddContactModalOpen(true);
  }, []);

  const handleCloseAddContactModal = useCallback(() => {
    setIsAddContactModalOpen(false);
    setSelectedContact(null);
    setSelectedContactType('');
  }, []);

  const handleContactSearch = useCallback(() => {
    if (
      !contactSearchFirstName.trim() &&
      !contactSearchLastName.trim() &&
      !contactSearchCompanyName.trim()
    ) {
      return;
    }
    setContactSearchParams({
      firstName: contactSearchFirstName.trim() || undefined,
      lastName: contactSearchLastName.trim() || undefined,
      companyName: contactSearchCompanyName.trim() || undefined,
      _nonce: Date.now(),
    });
    setSelectedContact(null);
  }, [contactSearchFirstName, contactSearchLastName, contactSearchCompanyName]);

  const handleAddPropertyContact = useCallback(() => {
    if (!selectedContact || !selectedContactType) {
      return;
    }
    addPropertyContactMutation.mutate(
      {
        contactId: selectedContact.id,
        contactTypeCode: selectedContactType,
      },
      {
        onSuccess: () => {
          display({
            kind: 'success',
            title: `Contact "${selectedContact.displayName ?? 'Unknown'}" added to property.`,
            timeout: 7000,
          });
          handleCloseAddContactModal();
        },
      },
    );
  }, [
    selectedContact,
    selectedContactType,
    addPropertyContactMutation,
    handleCloseAddContactModal,
    display,
  ]);

  const handleConfirmDeleteContact = useCallback((associationId: number, displayName: string) => {
    setDeleteContactConfirm({ associationId, displayName });
  }, []);

  const handleRemovePropertyContact = useCallback(() => {
    if (!deleteContactConfirm) {
      return;
    }
    removePropertyContactMutation.mutate(
      { associationId: deleteContactConfirm.associationId },
      {
        onSuccess: () => {
          display({
            kind: 'success',
            title: `Contact "${deleteContactConfirm.displayName}" removed from property.`,
            timeout: 7000,
          });
          setDeleteContactConfirm(null);
        },
      },
    );
  }, [deleteContactConfirm, removePropertyContactMutation, display]);

  // Reset form states when data changes
  useEffect(() => {
    if (detail.data && editingTab !== 'details') {
      setDetailsForm(createDetailsFormState(detail.data));
    }
  }, [detail.data, editingTab]);

  useEffect(() => {
    if (milestones.data && editingTab !== 'milestones') {
      setMilestonesForm(createMilestonesFormState(milestones.data));
    }
  }, [milestones.data, editingTab]);

  useEffect(() => {
    if (editingTab !== 'registration') {
      setRegistrationForm(createRegistrationFormState(registration.data));
    }
  }, [registration.data, editingTab]);

  useEffect(() => {
    if (editingTab !== 'expropriation') {
      setExpropriationForm(createExpropriationFormState(expropriation.data));
    }
  }, [expropriation.data, editingTab]);

  const handleStartEdit = useCallback((tab: string) => {
    setEditingTab(tab);
    setValidationErrors({});
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingTab(null);
    setValidationErrors({});
    // Reset forms to current data
    setDetailsForm(createDetailsFormState(detail.data));
    setMilestonesForm(createMilestonesFormState(milestones.data));
    setRegistrationForm(createRegistrationFormState(registration.data));
    setExpropriationForm(createExpropriationFormState(expropriation.data));
  }, [detail.data, milestones.data, registration.data, expropriation.data]);

  const handleSaveDetails = useCallback(() => {
    const revisionCount = detail.data?.revisionCount;
    if (revisionCount == null) return;

    const errors = validateDetailsForm(detailsForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    updateDetailsMutation.mutate(
      {
        revisionCount,
        titleNumber: normalizeNullableString(detailsForm.titleNumber),
        parcelIdentifier: normalizeNullableString(detailsForm.parcelIdentifier),
        legalDescription: normalizeNullableString(detailsForm.legalDescription),
        parcelAddress: normalizeNullableString(detailsForm.parcelAddress),
        city: normalizeNullableString(detailsForm.city)!,
        parcelArea: parseNumberOrNull(detailsForm.parcelArea),
        projectArea: parseNumberOrNull(detailsForm.projectArea),
        assessedValue: parseNumberOrNull(detailsForm.assessedValue),
        acquisitionCode: normalizeNullableString(detailsForm.acquisitionCode),
        landTitleOfficeCode: normalizeNullableString(detailsForm.landTitleOfficeCode),
        electoralDistrictCode: normalizeNullableString(detailsForm.electoralDistrictCode),
        orgUnitNumber: parseNumberOrNull(detailsForm.orgUnitNumber),
        expropriationRecommended: detailsForm.expropriationRecommended,
      },
      {
        onSuccess: () => {
          setEditingTab(null);
          display({ kind: 'success', title: 'Property details updated.', timeout: 7000 });
        },
      },
    );
  }, [detail.data, detailsForm, updateDetailsMutation, display]);

  const handleSaveMilestones = useCallback(() => {
    const revisionCount = milestones.data?.revisionCount;
    if (revisionCount == null) return;

    updateMilestonesMutation.mutate(
      {
        revisionCount,
        ownerContactDate: normalizeNullableString(milestonesForm.ownerContactDate),
        internalAppraisalDate: normalizeNullableString(milestonesForm.internalAppraisalDate),
        roadValueRequestedDate: normalizeNullableString(milestonesForm.roadValueRequestedDate),
        roadValueReceivedDate: normalizeNullableString(milestonesForm.roadValueReceivedDate),
        fundingRequestedDate: normalizeNullableString(milestonesForm.fundingRequestedDate),
        fundingApprovedDate: normalizeNullableString(milestonesForm.fundingApprovedDate),
        surveyRequestedDate: normalizeNullableString(milestonesForm.surveyRequestedDate),
        surveyReceivedDate: normalizeNullableString(milestonesForm.surveyReceivedDate),
        feeAppraisalRequestedDate: normalizeNullableString(
          milestonesForm.feeAppraisalRequestedDate,
        ),
        feeAppraisalReceivedDate: normalizeNullableString(milestonesForm.feeAppraisalReceivedDate),
        offerDate: normalizeNullableString(milestonesForm.offerDate),
        offerAcceptedDate: normalizeNullableString(milestonesForm.offerAcceptedDate),
        completionDate: normalizeNullableString(milestonesForm.completionDate),
        assessmentComment: normalizeNullableString(milestonesForm.assessmentComment),
        negotiationComment: normalizeNullableString(milestonesForm.negotiationComment),
        acquisitionComment: normalizeNullableString(milestonesForm.acquisitionComment),
        expropriationRecommended: milestonesForm.expropriationRecommended,
      },
      {
        onSuccess: () => {
          setEditingTab(null);
          display({ kind: 'success', title: 'Property milestones updated.', timeout: 7000 });
        },
      },
    );
  }, [milestones.data, milestonesForm, updateMilestonesMutation, display]);

  const handleSaveRegistration = useCallback(() => {
    upsertRegistrationMutation.mutate(
      {
        revisionCount: registration.data?.revisionCount ?? null,
        ltoPlanNumber: normalizeNullableString(registrationForm.ltoPlanNumber),
        ltoDocumentNumber: normalizeNullableString(registrationForm.ltoDocumentNumber),
        surveyTubeNumber: normalizeNullableString(registrationForm.surveyTubeNumber),
        registrationDate: normalizeNullableString(registrationForm.registrationDate),
      },
      {
        onSuccess: () => {
          setEditingTab(null);
          display({ kind: 'success', title: 'Registration updated.', timeout: 7000 });
        },
      },
    );
  }, [registration.data, registrationForm, upsertRegistrationMutation, display]);

  const handleSaveExpropriation = useCallback(() => {
    const errors = validateExpropriationForm(expropriationForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    upsertExpropriationMutation.mutate(
      {
        revisionCount: expropriation.data?.revisionCount ?? null,
        executiveApprovalDate: normalizeNullableString(expropriationForm.executiveApprovalDate),
        consensualServiceDate: normalizeNullableString(expropriationForm.consensualServiceDate),
        noticeAdvancePaymentDate: normalizeNullableString(
          expropriationForm.noticeAdvancePaymentDate,
        ),
        vestingDate: normalizeNullableString(expropriationForm.vestingDate),
      },
      {
        onSuccess: () => {
          setEditingTab(null);
          display({ kind: 'success', title: 'Expropriation updated.', timeout: 7000 });
        },
      },
    );
  }, [expropriation.data, expropriationForm, upsertExpropriationMutation, display]);

  const propertyDetailFields = useMemo(
    () => buildPropertyDetails(detail.data ?? selectedSummary ?? null),
    [detail.data, selectedSummary],
  );

  const assessmentMilestoneFields = useMemo(
    () => buildAssessmentMilestones(milestones.data ?? null),
    [milestones.data],
  );
  const negotiationMilestoneFields = useMemo(
    () => buildNegotiationMilestones(milestones.data ?? null),
    [milestones.data],
  );
  const acquisitionMilestoneFields = useMemo(
    () => buildAcquisitionMilestones(milestones.data ?? null),
    [milestones.data],
  );

  const propertyRegistrationFields = useMemo(
    () => buildPropertyRegistration(registration.data ?? null),
    [registration.data],
  );

  const propertyExpropriationFields = useMemo(
    () => buildPropertyExpropriation(expropriation.data ?? null),
    [expropriation.data],
  );

  const propertyContacts = contacts.data ?? [];

  const renderTabContent = (tabLabel: string) => {
    switch (tabLabel) {
      case 'Details':
        if (editingTab === 'details') {
          return (
            <>
              <PropertyDetailsForm
                formState={detailsForm}
                onChange={(
                  key: keyof PropertyDetailsFormState,
                  value: PropertyDetailsFormState[keyof PropertyDetailsFormState],
                ) => setDetailsForm((prev) => ({ ...prev, [key]: value }))}
                options={options}
                validationErrors={validationErrors}
              />
              <div className="form-actions">
                <Button kind="secondary" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  kind="primary"
                  size="sm"
                  onClick={handleSaveDetails}
                  disabled={updateDetailsMutation.isPending}
                >
                  {updateDetailsMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </>
          );
        }
        return detail.isPending ? (
          <SkeletonText width="60%" lineCount={4} />
        ) : detail.isError ? (
          <p>Failed to load property details.</p>
        ) : (
          <>
            <div className="tab-actions">
              {canEdit && (
                <Button
                  kind="tertiary"
                  size="sm"
                  renderIcon={Edit}
                  onClick={() => handleStartEdit('details')}
                >
                  Edit
                </Button>
              )}
            </div>
            <FieldList fields={propertyDetailFields} keyPrefix="property-detail" />
          </>
        );

      case 'Milestones':
        if (editingTab === 'milestones') {
          return (
            <>
              <PropertyMilestonesForm
                formState={milestonesForm}
                onChange={(
                  key: keyof PropertyMilestonesFormState,
                  value: PropertyMilestonesFormState[keyof PropertyMilestonesFormState],
                ) => setMilestonesForm((prev) => ({ ...prev, [key]: value }))}
              />
              <div className="form-actions">
                <Button kind="secondary" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  kind="primary"
                  size="sm"
                  onClick={handleSaveMilestones}
                  disabled={updateMilestonesMutation.isPending}
                >
                  {updateMilestonesMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </>
          );
        }
        return milestones.isPending ? (
          <SkeletonText width="60%" lineCount={4} />
        ) : milestones.isError ? (
          <p>Failed to load property milestones.</p>
        ) : (
          <>
            <div className="tab-actions">
              {canEdit && (
                <Button
                  kind="tertiary"
                  size="sm"
                  renderIcon={Edit}
                  onClick={() => handleStartEdit('milestones')}
                >
                  Edit
                </Button>
              )}
            </div>
            <div className="milestones-readonly">
              <h4 className="milestones-section-title">Assessment Milestones</h4>
              <FieldList
                fields={assessmentMilestoneFields}
                keyPrefix="property-milestones-assessment"
              />
              <h4 className="milestones-section-title">Negotiation Milestones</h4>
              <FieldList
                fields={negotiationMilestoneFields}
                keyPrefix="property-milestones-negotiation"
              />
              <h4 className="milestones-section-title">Acquisition Milestones</h4>
              <FieldList
                fields={acquisitionMilestoneFields}
                keyPrefix="property-milestones-acquisition"
              />
            </div>
          </>
        );

      case 'Registration':
        if (editingTab === 'registration') {
          return (
            <>
              <PropertyRegistrationForm
                formState={registrationForm}
                onChange={(
                  key: keyof PropertyRegistrationFormState,
                  value: PropertyRegistrationFormState[keyof PropertyRegistrationFormState],
                ) => setRegistrationForm((prev) => ({ ...prev, [key]: value }))}
              />
              <div className="form-actions">
                <Button kind="secondary" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  kind="primary"
                  size="sm"
                  onClick={handleSaveRegistration}
                  disabled={upsertRegistrationMutation.isPending}
                >
                  {upsertRegistrationMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </>
          );
        }
        return registration.isPending ? (
          <SkeletonText width="60%" lineCount={3} />
        ) : registration.isError ? (
          <p>Failed to load property registration.</p>
        ) : (
          <>
            <div className="tab-actions">
              {canEdit && (
                <Button
                  kind="tertiary"
                  size="sm"
                  renderIcon={Edit}
                  onClick={() => handleStartEdit('registration')}
                >
                  Edit
                </Button>
              )}
            </div>
            <FieldList fields={propertyRegistrationFields} keyPrefix="property-registration" />
          </>
        );

      case 'Expropriation':
        if (editingTab === 'expropriation') {
          return (
            <>
              <PropertyExpropriationForm
                formState={expropriationForm}
                onChange={(
                  key: keyof PropertyExpropriationFormState,
                  value: PropertyExpropriationFormState[keyof PropertyExpropriationFormState],
                ) => setExpropriationForm((prev) => ({ ...prev, [key]: value }))}
                validationErrors={validationErrors}
              />
              <div className="form-actions">
                <Button kind="secondary" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  kind="primary"
                  size="sm"
                  onClick={handleSaveExpropriation}
                  disabled={upsertExpropriationMutation.isPending}
                >
                  {upsertExpropriationMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </>
          );
        }
        return expropriation.isPending ? (
          <SkeletonText width="60%" lineCount={3} />
        ) : expropriation.isError ? (
          <p>Failed to load property expropriation.</p>
        ) : (
          <>
            <div className="tab-actions">
              {canEdit && (
                <Button
                  kind="tertiary"
                  size="sm"
                  renderIcon={Edit}
                  onClick={() => handleStartEdit('expropriation')}
                >
                  Edit
                </Button>
              )}
            </div>
            <FieldList fields={propertyExpropriationFields} keyPrefix="property-expropriation" />
          </>
        );

      case 'Contacts':
        return contacts.isPending ? (
          <SkeletonText width="60%" lineCount={4} />
        ) : contacts.isError ? (
          <p>Failed to load property contacts.</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              {canEdit && (
                <Button
                  kind="primary"
                  size="sm"
                  renderIcon={Add}
                  onClick={handleOpenAddContactModal}
                >
                  Add Contact
                </Button>
              )}
            </div>

            <PropertyContactsTable
              contacts={propertyContacts}
              canDelete={canDelete}
              onRemove={handleConfirmDeleteContact}
              removeDisabled={removePropertyContactMutation.isPending}
            />

            {/* Add Contact to Property Modal */}
            <Modal
              open={isAddContactModalOpen}
              onRequestClose={handleCloseAddContactModal}
              modalHeading="Add Contact to Property"
              passiveModal
              size="lg"
              className="add-contact-modal"
            >
              <div className="contact-search-row">
                <TextInput
                  id="propContactSearchFirstName"
                  labelText="First Name"
                  value={contactSearchFirstName}
                  onChange={(e) => setContactSearchFirstName(e.target.value)}
                  placeholder="Enter first name..."
                />
                <TextInput
                  id="propContactSearchLastName"
                  labelText="Last Name"
                  value={contactSearchLastName}
                  onChange={(e) => setContactSearchLastName(e.target.value)}
                  placeholder="Enter last name..."
                />
                <TextInput
                  id="propContactSearchCompanyName"
                  labelText="Company Name"
                  value={contactSearchCompanyName}
                  onChange={(e) => setContactSearchCompanyName(e.target.value)}
                  placeholder="Enter company name..."
                />
                <Button
                  kind="primary"
                  size="md"
                  onClick={handleContactSearch}
                  disabled={
                    (!contactSearchFirstName.trim() &&
                      !contactSearchLastName.trim() &&
                      !contactSearchCompanyName.trim()) ||
                    contactSearchQuery.isFetching
                  }
                >
                  {contactSearchQuery.isFetching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {contactSearchParams && (
                <div style={{ marginBottom: '1rem' }}>
                  {contactSearchQuery.isFetching ? (
                    <SkeletonText lineCount={3} />
                  ) : contactSearchResults.length === 0 ? (
                    <p>No contacts found matching your search criteria.</p>
                  ) : (
                    <>
                      <p style={{ marginBottom: '0.5rem' }}>
                        Found {contactSearchResults.length} contact(s). Select one:
                      </p>
                      <Table size="sm">
                        <TableHead>
                          <TableRow>
                            <TableHeader />
                            <TableHeader>Name</TableHeader>
                            <TableHeader>Company</TableHeader>
                            <TableHeader>Email</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {contactSearchResults.map((contact) => (
                            <TableRow
                              key={contact.id}
                              isSelected={selectedContact?.id === contact.id}
                              onClick={() => setSelectedContact(contact)}
                              style={{ cursor: 'pointer' }}
                            >
                              <TableCell>
                                <input
                                  type="radio"
                                  name="selectedPropertyContact"
                                  checked={selectedContact?.id === contact.id}
                                  onChange={() => setSelectedContact(contact)}
                                />
                              </TableCell>
                              <TableCell>{contact.displayName}</TableCell>
                              <TableCell>{contact.companyName ?? '-'}</TableCell>
                              <TableCell>{contact.email ?? '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </div>
              )}

              {selectedContact && (
                <div style={{ marginTop: '1rem' }}>
                  <Select
                    id="propertyContactType"
                    labelText="Contact Type *"
                    value={selectedContactType}
                    onChange={(e) => setSelectedContactType(e.target.value)}
                  >
                    <SelectItem value="" text="Select contact type..." />
                    {contactOptions?.contactTypes.map((t) => (
                      <SelectItem key={t.code} value={t.code} text={t.name ?? ''} />
                    ))}
                  </Select>
                </div>
              )}

              <div className="add-contact-modal__actions">
                <Button kind="secondary" size="md" onClick={handleCloseAddContactModal}>
                  Cancel
                </Button>
                <Button
                  kind="primary"
                  size="md"
                  disabled={
                    !selectedContact || !selectedContactType || addPropertyContactMutation.isPending
                  }
                  onClick={handleAddPropertyContact}
                >
                  Add Contact
                </Button>
              </div>
            </Modal>

            {/* Delete Property Contact Confirmation Modal */}
            <Modal
              open={Boolean(deleteContactConfirm)}
              onRequestClose={() => setDeleteContactConfirm(null)}
              modalHeading="Remove Contact"
              passiveModal
              size="sm"
              className="add-contact-modal"
            >
              <p>
                Are you sure you want to remove contact &quot;{deleteContactConfirm?.displayName}
                &quot; from this property?
              </p>
              <div className="add-contact-modal__actions">
                <Button kind="secondary" size="md" onClick={() => setDeleteContactConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  kind="danger"
                  size="md"
                  disabled={removePropertyContactMutation.isPending}
                  onClick={handleRemovePropertyContact}
                >
                  Remove
                </Button>
              </div>
            </Modal>
          </>
        );

      default:
        return null;
    }
  };

  const tabs = ['Details', 'Milestones', 'Registration', 'Expropriation', 'Contacts'];

  return (
    <div className="property-tabs">
      <div className="property-tabs__header">
        <h2 className="section-title">Property Details</h2>
      </div>
      <Tabs
        selectedIndex={activeTab}
        onChange={({ selectedIndex }) => {
          setActiveTab(selectedIndex);
          setEditingTab(null);
          setValidationErrors({});
        }}
      >
        <TabList aria-label="Property sub-sections" contained>
          {tabs.map((tabLabel) => (
            <Tab key={tabLabel}>{tabLabel}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map((tabLabel) => (
            <TabPanel key={tabLabel}>{renderTabContent(tabLabel)}</TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </div>
  );
};

export const PropertiesTab: FC<PropertiesTabProps> = ({ projectId }) => {
  const { canCreate, canDelete } = useAuthorization();
  const propertiesQuery = useReptPropertySummaries(projectId);
  const optionsQuery = useReptPropertyOptions(projectId);
  const propertySummaries = useMemo(() => propertiesQuery.data ?? [], [propertiesQuery.data]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDetailsEditing, setIsDetailsEditing] = useState(false);
  const [createForm, setCreateForm] = useState<PropertyDetailsFormState>(() =>
    createDetailsFormState(null),
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [propertyToDelete, setPropertyToDelete] = useState<ReptPropertySummary | null>(null);
  const { display } = useNotification();

  const createPropertyMutation = useCreateReptProperty(projectId);
  const deletePropertyMutation = useDeleteReptProperty(projectId);

  useEffect(() => {
    if (createPropertyMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to create property',
        subtitle: (createPropertyMutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [createPropertyMutation.isError, createPropertyMutation.error, display]);

  useEffect(() => {
    if (propertiesQuery.isError) {
      display({
        kind: 'error',
        title: 'Failed to load properties',
        subtitle: (propertiesQuery.error as Error).message,
        timeout: 9000,
      });
    }
  }, [propertiesQuery.isError, propertiesQuery.error, display]);

  useEffect(() => {
    if (!selectedPropertyId) {
      setIsDetailsEditing(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (!propertySummaries.length) {
      setSelectedPropertyId(null);
      return;
    }

    setSelectedPropertyId((current) => {
      if (!current) {
        return String(propertySummaries[0].id);
      }
      const exists = propertySummaries.some((summary) => String(summary.id) === current);
      return exists ? current : String(propertySummaries[0].id);
    });
  }, [propertySummaries]);

  const propertyComposite = useReptPropertyComposite(projectId, selectedPropertyId ?? undefined);

  const selectedSummary = useMemo(() => {
    if (!selectedPropertyId) {
      return undefined;
    }
    return propertySummaries.find((summary) => String(summary.id) === selectedPropertyId);
  }, [propertySummaries, selectedPropertyId]);

  const handleStartCreate = useCallback(() => {
    setCreateForm(createDetailsFormState(null));
    setIsCreating(true);
    setValidationErrors({});
  }, []);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setValidationErrors({});
  }, []);

  const handleSaveCreate = useCallback(() => {
    const errors = validateDetailsForm(createForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    createPropertyMutation.mutate(
      {
        projectId: Number(projectId),
        titleNumber: normalizeNullableString(createForm.titleNumber),
        parcelIdentifier: normalizeNullableString(createForm.parcelIdentifier),
        legalDescription: normalizeNullableString(createForm.legalDescription),
        parcelAddress: normalizeNullableString(createForm.parcelAddress),
        city: normalizeNullableString(createForm.city)!,
        parcelArea: parseNumberOrNull(createForm.parcelArea),
        projectArea: parseNumberOrNull(createForm.projectArea),
        assessedValue: parseNumberOrNull(createForm.assessedValue),
        acquisitionCode: normalizeNullableString(createForm.acquisitionCode),
        landTitleOfficeCode: normalizeNullableString(createForm.landTitleOfficeCode),
        electoralDistrictCode: normalizeNullableString(createForm.electoralDistrictCode),
        orgUnitNumber: parseNumberOrNull(createForm.orgUnitNumber),
        expropriationRecommended: createForm.expropriationRecommended,
      },
      {
        onSuccess: (result) => {
          setIsCreating(false);
          display({ kind: 'success', title: 'Property created successfully.', timeout: 7000 });
          setSelectedPropertyId(String(result.id));
        },
      },
    );
  }, [projectId, createForm, createPropertyMutation, display]);

  const handleConfirmDelete = useCallback(() => {
    if (!propertyToDelete) return;
    const revisionCount = propertyToDelete.revisionCount;
    if (revisionCount == null) return;

    deletePropertyMutation.mutate(
      { propertyId: String(propertyToDelete.id), revisionCount },
      {
        onSuccess: () => {
          if (String(propertyToDelete.id) === selectedPropertyId) {
            setSelectedPropertyId(null);
          }
          setPropertyToDelete(null);
          display({ kind: 'success', title: 'Property deleted.', timeout: 7000 });
        },
        onError: (error) => {
          setPropertyToDelete(null);
          display({
            kind: 'error',
            title: 'Failed to delete property',
            subtitle: (error as Error).message,
            timeout: 9000,
          });
        },
      },
    );
  }, [propertyToDelete, selectedPropertyId, deletePropertyMutation, display]);

  // Create Property Form
  if (isCreating) {
    return (
      <div className="project-tab-panel">
        <Tile className="project-tile project-tile--full">
          <div className="project-tile__header">
            <h2 className="section-title">Add New Property</h2>
          </div>

          <PropertyDetailsForm
            formState={createForm}
            onChange={(
              key: keyof PropertyDetailsFormState,
              value: PropertyDetailsFormState[keyof PropertyDetailsFormState],
            ) => setCreateForm((prev) => ({ ...prev, [key]: value }))}
            options={optionsQuery.data}
            validationErrors={validationErrors}
          />

          <div className="form-actions">
            <Button
              kind="secondary"
              size="sm"
              onClick={handleCancelCreate}
              disabled={createPropertyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              kind="primary"
              size="sm"
              onClick={handleSaveCreate}
              disabled={createPropertyMutation.isPending}
            >
              {createPropertyMutation.isPending ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </Tile>
      </div>
    );
  }

  return (
    <div className="project-tab-panel">
      {propertiesQuery.isPending && <SkeletonText width="70%" lineCount={4} />}

      {!propertiesQuery.isPending && !propertiesQuery.isError && propertySummaries.length === 0 && (
        <>
          {canCreate && (
            <div className="tab-actions">
              <Button kind="primary" size="sm" renderIcon={Add} onClick={handleStartCreate}>
                Add Property
              </Button>
            </div>
          )}
          <InlineNotification
            kind="info"
            lowContrast
            title="There aren't any properties associated with this project yet."
            hideCloseButton
          />
        </>
      )}

      {propertySummaries.length > 0 && (
        <>
          <Tile className="project-tile project-tile--full">
            <div className="project-tile__header">
              <h2 className="section-title">Properties</h2>
              {canCreate && (
                <Button kind="primary" size="sm" renderIcon={Add} onClick={handleStartCreate}>
                  Add Property
                </Button>
              )}
            </div>
            <div className="bordered-table">
              <Table className="project-table">
                <TableHead>
                  <TableRow>
                    <TableHeader aria-label="Selected property" />
                    <TableHeader>Parcel Identifier (PID)</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {propertySummaries.map((property) => {
                    const isSelected = String(property.id) === selectedPropertyId;
                    const rowLocked = isDetailsEditing;
                    return (
                      <TableRow
                        key={property.id}
                        onClick={
                          rowLocked ? undefined : () => setSelectedPropertyId(String(property.id))
                        }
                        className={`property-row${isSelected ? ' property-row--selected' : ''}${
                          rowLocked ? ' property-row--locked' : ''
                        }`}
                      >
                        <TableSelectRow
                          radio
                          id={`property-select-${property.id}`}
                          name="property-selection"
                          ariaLabel={`Select property ${buildPropertyOptionLabel(property)}`}
                          checked={isSelected}
                          disabled={rowLocked}
                          onSelect={() => setSelectedPropertyId(String(property.id))}
                        />
                        <TableCell>{buildPropertyOptionLabel(property)}</TableCell>
                        <TableCell>
                          <IconButton
                            kind="ghost"
                            size="sm"
                            label="Delete property"
                            disabled={!canDelete || deletePropertyMutation.isPending || rowLocked}
                            onClick={(event) => {
                              event.stopPropagation();
                              setPropertyToDelete(property);
                            }}
                          >
                            <TrashCan />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Tile>

          {selectedPropertyId && (
            <Tile className="project-tile project-tile--full property-details-tile">
              <div className="property-tabs">
                <PropertyDetailTabs
                  projectId={projectId}
                  propertyId={selectedPropertyId}
                  propertyCompositeReturn={propertyComposite}
                  selectedSummary={selectedSummary}
                  options={optionsQuery.data}
                  onEditingChange={setIsDetailsEditing}
                />
              </div>
            </Tile>
          )}
        </>
      )}

      <DestructiveModal
        open={Boolean(propertyToDelete)}
        title="Delete Property?"
        message="This action will permanently delete this property and its associated data. This cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setPropertyToDelete(null)}
        loading={deletePropertyMutation.isPending}
      />
    </div>
  );
};
