import { Edit, Search } from '@carbon/icons-react';
import {
  Button,
  DatePicker,
  DatePickerInput,
  InlineLoading,
  Select,
  SelectItem,
  TextInput,
  Tile,
} from '@carbon/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';

import { UserSearchModal } from '@/components/Form/UserSearchModal';
import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useResolvedUserName } from '@/hooks/useResolvedUserName';
import { useReptProjectUpdateOptions, useUpdateReptProject } from '@/services/rept/hooks';

import { displayValue, formatDate, formatWithCode } from '../utils';

import { FieldList, type DetailField } from './FieldList';

import type {
  ReptProjectDetail,
  ReptProjectUpdateOptions,
  ReptUserSummary,
  CodeNameWithParent,
} from '@/services/rept/types';

type ProjectSummaryTabProps = {
  project: ReptProjectDetail;
};

type ProjectFormState = {
  projectName: string;
  statusCode: string;
  priorityCode: string;
  regionNumber: string;
  districtNumber: string;
  bctsOfficeNumber: string;
  requestingSourceId: string;
  requestDate: string;
  requestorUserId: string;
  projectManagerUserId: string;
  projectManagerName: string;
  projectManagerAssignedDate: string;
  projectHistory: string;
  relatedFiles: string;
  relatedRegistrations: string;
  projectComment: string;
};

const buildProjectDetails = (
  project: ReptProjectDetail,
  resolvedRequestorValue: React.ReactNode,
): DetailField[] => [
  { label: 'Project File', value: displayValue(project.projectFile) },
  { label: 'Project Name', value: displayValue(project.projectName) },
  {
    label: 'Region',
    value: formatWithCode(project.regionLabel, project.regionNumber),
  },
  {
    label: 'District',
    value: formatWithCode(project.districtLabel, project.districtNumber),
  },
  {
    label: 'BCTS Office',
    value: formatWithCode(project.bctsOfficeLabel, project.bctsOfficeNumber),
  },
  {
    label: 'Requesting Source',
    value: formatWithCode(project.requestingSourceLabel, project.requestingSourceId),
  },
  {
    label: 'Request Date',
    value: formatDate(project.requestDate),
  },
  {
    label: 'Requestor IDIR',
    value: resolvedRequestorValue,
  },
];

const buildAssignmentDetails = (
  project: ReptProjectDetail,
  resolvedProjectManagerValue: React.ReactNode,
): DetailField[] => [
  {
    label: 'Project Manager',
    value: resolvedProjectManagerValue,
  },
  {
    label: 'Assigned Date',
    value: formatDate(project.projectManagerAssignedDate),
  },
  {
    label: 'Priority',
    value: formatWithCode(project.priorityLabel, project.priorityCode),
  },
];

const sanitizeUserId = (value: string | null | undefined): string => {
  const trimmed = (value ?? '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'undefined') return '';
  return trimmed;
};

const createFormState = (project: ReptProjectDetail): ProjectFormState => ({
  projectName: project.projectName ?? '',
  statusCode: project.statusCode ?? '',
  priorityCode: project.priorityCode ?? '',
  regionNumber: project.regionNumber != null ? String(project.regionNumber) : '',
  districtNumber: project.districtNumber != null ? String(project.districtNumber) : '',
  bctsOfficeNumber: project.bctsOfficeNumber != null ? String(project.bctsOfficeNumber) : '',
  requestingSourceId: project.requestingSourceId != null ? String(project.requestingSourceId) : '',
  requestDate: project.requestDate ?? '',
  requestorUserId: sanitizeUserId(project.requestorUserId),
  projectManagerUserId: project.projectManagerUserId ?? '',
  projectManagerName: project.projectManagerName ?? '',
  projectManagerAssignedDate: project.projectManagerAssignedDate ?? '',
  projectHistory: project.projectHistory ?? '',
  relatedFiles: project.relatedFiles ?? '',
  relatedRegistrations: project.relatedRegistrations ?? '',
  projectComment: project.projectComment ?? '',
});

const normalizeNullableString = (value: string | number | null | undefined): string | null => {
  if (value == null) {
    return null;
  }
  const strValue = String(value).trim();
  return strValue.length ? strValue : null;
};

const parseNullableNumber = (value: string | number | null | undefined): number | null => {
  if (value == null) {
    return null;
  }
  const strValue = String(value).trim();
  if (!strValue.length) {
    return null;
  }
  const num = Number(strValue);
  return Number.isNaN(num) ? null : num;
};

const serializeFormState = (state: ProjectFormState) => ({
  projectName: normalizeNullableString(state.projectName),
  statusCode: normalizeNullableString(state.statusCode),
  priorityCode: normalizeNullableString(state.priorityCode),
  regionNumber: normalizeNullableString(state.regionNumber),
  districtNumber: normalizeNullableString(state.districtNumber),
  bctsOfficeNumber: normalizeNullableString(state.bctsOfficeNumber),
  requestingSourceId: normalizeNullableString(state.requestingSourceId),
  requestDate: normalizeNullableString(state.requestDate),
  requestorUserId: normalizeNullableString(state.requestorUserId),
  projectManagerUserId: normalizeNullableString(state.projectManagerUserId),
  projectManagerName: normalizeNullableString(state.projectManagerName),
  projectManagerAssignedDate: normalizeNullableString(state.projectManagerAssignedDate),
  projectHistory: normalizeNullableString(state.projectHistory),
  relatedFiles: normalizeNullableString(state.relatedFiles),
  relatedRegistrations: normalizeNullableString(state.relatedRegistrations),
  projectComment: normalizeNullableString(state.projectComment),
});

const getDistrictsForRegion = (
  options: ReptProjectUpdateOptions,
  regionNumber: string,
): CodeNameWithParent[] => {
  if (!regionNumber) {
    return options.districts;
  }
  return options.districts.filter((d) => d.parentCode === regionNumber || !d.parentCode);
};

export const ProjectSummaryTab: FC<ProjectSummaryTabProps> = ({ project }) => {
  const { canEdit } = useAuthorization();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ProjectFormState>(() => createFormState(project));
  const [initialFormState, setInitialFormState] = useState<ProjectFormState>(() =>
    createFormState(project),
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { display } = useNotification();

  // User search modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userSearchTarget, setUserSearchTarget] = useState<'requestorUserId' | 'projectManager'>(
    'requestorUserId',
  );

  // Resolve IDIR usernames to display names
  const { displayValue: resolvedRequestor, isLoading: isRequestorLoading } = useResolvedUserName(
    formState.requestorUserId,
  );
  const { displayValue: resolvedProjectManager, isLoading: isProjectManagerLoading } =
    useResolvedUserName(formState.projectManagerUserId);

  const optionsQuery = useReptProjectUpdateOptions(String(project.id));
  const options = optionsQuery.data;
  const mutation = useUpdateReptProject(String(project.id));
  const { reset: resetMutation } = mutation;
  const projectKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (mutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to save project',
        subtitle: (mutation.error as Error).message,
        timeout: 9000,
      });
    }
  }, [mutation.isError, mutation.error, display]);

  const baselineState = useMemo(() => serializeFormState(initialFormState), [initialFormState]);
  const currentState = useMemo(() => serializeFormState(formState), [formState]);
  const hasChanges = useMemo(() => {
    return Object.keys(baselineState).some((key) => {
      const typedKey = key as keyof typeof baselineState;
      return baselineState[typedKey] !== currentState[typedKey];
    });
  }, [baselineState, currentState]);

  const filteredDistricts = useMemo(
    () => (options ? getDistrictsForRegion(options, formState.regionNumber) : []),
    [options, formState.regionNumber],
  );

  useEffect(() => {
    const key = `${project.id}-${project.revisionCount ?? '0'}`;
    if (projectKeyRef.current === key) {
      return;
    }
    projectKeyRef.current = key;
    const nextState = createFormState(project);
    setInitialFormState(nextState);
    setFormState(nextState);
    setIsEditing(false);
    setValidationErrors({});
    resetMutation();
  }, [project, resetMutation]);

  const handleStartEdit = useCallback(() => {
    setFormState(initialFormState);
    setValidationErrors({});
    setIsEditing(true);
  }, [initialFormState]);

  const handleCancelEdit = useCallback(() => {
    setFormState(initialFormState);
    setValidationErrors({});
    setIsEditing(false);
  }, [initialFormState]);

  const handleFieldChange = useCallback(
    <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) => {
      setFormState((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  // ── User search modal handlers ──────────────────────────────────
  const handleProjectManagerSelection = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedUserId = e.target.value;
      if (!selectedUserId) {
        setFormState((prev) => ({
          ...prev,
          projectManagerUserId: '',
          projectManagerName: '',
          projectManagerAssignedDate: '',
        }));
        return;
      }
      const selectedPm = options?.projectManagers.find((pm) => pm.code === selectedUserId);
      setFormState((prev) => ({
        ...prev,
        projectManagerUserId: selectedUserId,
        projectManagerName: selectedPm?.name ?? '',
        projectManagerAssignedDate: new Date().toISOString().split('T')[0],
      }));
    },
    [options],
  );

  const handleOpenRequestorSearch = useCallback(() => {
    setUserSearchTarget('requestorUserId');
    setIsUserModalOpen(true);
  }, []);

  const handleUserModalClose = useCallback(() => {
    setIsUserModalOpen(false);
  }, []);

  const handleUserSelected = useCallback(
    (user: ReptUserSummary) => {
      const prefixedUserId = user.userId ? `IDIR\\${user.userId}` : '';
      if (userSearchTarget === 'requestorUserId') {
        setFormState((prev) => ({
          ...prev,
          requestorUserId: prefixedUserId,
        }));
      } else {
        const name =
          user.displayName ??
          (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.userId) ??
          '';
        setFormState((prev) => ({
          ...prev,
          projectManagerUserId: prefixedUserId,
          projectManagerName: name,
          projectManagerAssignedDate: new Date().toISOString().split('T')[0],
        }));
      }
    },
    [userSearchTarget],
  );

  const handleSave = useCallback(() => {
    const revisionCount = project.revisionCount;
    if (revisionCount === null || revisionCount === undefined) {
      return;
    }

    const errors: Record<string, string> = {};
    const isBlank = (value: string | undefined | null) => !value || value.trim().length === 0;

    if (isBlank(formState.projectName)) {
      errors.projectName = 'Project name is required.';
    }
    if (isBlank(formState.statusCode)) {
      errors.statusCode = 'Select a status.';
    }
    if (isBlank(formState.regionNumber)) {
      errors.regionNumber = 'Select a region.';
    }
    if (isBlank(formState.districtNumber)) {
      errors.districtNumber = 'Select a district.';
    }
    if (isBlank(formState.requestingSourceId)) {
      errors.requestingSourceId = 'Select a requesting source.';
    }
    if (isBlank(formState.requestDate)) {
      errors.requestDate = 'Provide a request date.';
    }
    if (!sanitizeUserId(formState.requestorUserId)) {
      errors.requestorUserId = 'Requestor IDIR is required.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    mutation.mutate(
      {
        revisionCount,
        projectName: normalizeNullableString(formState.projectName),
        statusCode: normalizeNullableString(formState.statusCode),
        priorityCode: normalizeNullableString(formState.priorityCode),
        regionNumber: parseNullableNumber(formState.regionNumber),
        districtNumber: parseNullableNumber(formState.districtNumber),
        bctsOfficeNumber: parseNullableNumber(formState.bctsOfficeNumber),
        requestingSourceId: normalizeNullableString(formState.requestingSourceId),
        requestDate: normalizeNullableString(formState.requestDate),
        requestorUserId:
          formState.requestorUserId === 'undefined'
            ? null
            : normalizeNullableString(formState.requestorUserId),
        projectManagerUserId: normalizeNullableString(formState.projectManagerUserId),
        projectManagerName: normalizeNullableString(formState.projectManagerName),
        projectManagerAssignedDate: normalizeNullableString(formState.projectManagerAssignedDate),
        projectHistory: normalizeNullableString(formState.projectHistory),
        relatedFiles: normalizeNullableString(formState.relatedFiles),
        relatedRegistrations: normalizeNullableString(formState.relatedRegistrations),
        projectComment: normalizeNullableString(formState.projectComment),
      },
      {
        onSuccess: () => {
          display({ kind: 'success', title: 'Project details saved.', timeout: 7000 });
          setIsEditing(false);
        },
      },
    );
  }, [project, formState, mutation, display]);

  const editDisabledReason = useMemo(() => {
    if (project.revisionCount === null || project.revisionCount === undefined) {
      return 'Revision metadata is required before editing.';
    }
    return null;
  }, [project]);

  // ── Build view-mode field lists with loading indicators ─────────

  const requestorViewValue = isRequestorLoading ? (
    <InlineLoading description="Looking up user…" />
  ) : (
    resolvedRequestor || displayValue(sanitizeUserId(project.requestorUserId) || null)
  );

  const projectManagerViewValue = isProjectManagerLoading ? (
    <InlineLoading description="Looking up user…" />
  ) : (
    resolvedProjectManager || displayValue(project.projectManagerUserId)
  );

  const projectDetails = buildProjectDetails(project, requestorViewValue);
  const assignmentDetails = buildAssignmentDetails(project, projectManagerViewValue);

  // View Mode
  if (!isEditing) {
    return (
      <div className="project-summary-readonly">
        {canEdit && (
          <div className="project-summary-readonly__actions">
            <Button
              kind="tertiary"
              size="sm"
              renderIcon={Edit}
              disabled={Boolean(editDisabledReason)}
              onClick={handleStartEdit}
              title={editDisabledReason ?? 'Edit project details'}
            >
              Edit
            </Button>
          </div>
        )}

        <div className="project-tiles-grid">
          <Tile className="project-tile">
            <h2 className="section-title">Project Details</h2>
            <FieldList fields={projectDetails} keyPrefix="project-detail" />
          </Tile>

          <Tile className="project-tile">
            <h2 className="section-title">Assignment</h2>
            <FieldList fields={assignmentDetails} keyPrefix="project-assignment" />
          </Tile>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="project-tab-panel">
      <div className="project-tiles-grid">
        <Tile className="project-tile">
          <h2 className="section-title">Project Details</h2>
          <div className="form-fields">
            <TextInput
              id="projectFile"
              labelText="Project File"
              value={project.projectFile ?? ''}
              readOnly
            />
            <TextInput
              id="projectName"
              labelText="Project Name *"
              value={formState.projectName}
              onChange={(e) => handleFieldChange('projectName', e.target.value)}
              invalid={Boolean(validationErrors.projectName)}
              invalidText={validationErrors.projectName}
            />
            <Select
              id="statusCode"
              labelText="Status *"
              value={formState.statusCode}
              onChange={(e) => handleFieldChange('statusCode', e.target.value)}
              invalid={Boolean(validationErrors.statusCode)}
              invalidText={validationErrors.statusCode}
            >
              <SelectItem value="" text="Select status..." />
              {options?.statuses.map((s) => (
                <SelectItem key={s.code} value={s.code} text={s.name ?? ''} />
              ))}
            </Select>
            <Select
              id="regionNumber"
              labelText="Region *"
              value={formState.regionNumber}
              onChange={(e) => {
                handleFieldChange('regionNumber', e.target.value);
                handleFieldChange('districtNumber', '');
              }}
              invalid={Boolean(validationErrors.regionNumber)}
              invalidText={validationErrors.regionNumber}
            >
              <SelectItem value="" text="Select region..." />
              {options?.regions.map((r) => (
                <SelectItem key={r.code} value={r.code} text={r.name ?? ''} />
              ))}
            </Select>
            <Select
              id="districtNumber"
              labelText="District *"
              value={formState.districtNumber}
              onChange={(e) => handleFieldChange('districtNumber', e.target.value)}
              invalid={Boolean(validationErrors.districtNumber)}
              invalidText={validationErrors.districtNumber}
            >
              <SelectItem value="" text="Select district..." />
              {filteredDistricts.map((d) => (
                <SelectItem key={d.code} value={d.code} text={d.name ?? ''} />
              ))}
            </Select>
            <Select
              id="bctsOfficeNumber"
              labelText="BCTS Office"
              value={formState.bctsOfficeNumber}
              onChange={(e) => handleFieldChange('bctsOfficeNumber', e.target.value)}
            >
              <SelectItem value="" text="Select BCTS office..." />
              {options?.bctsOffices.map((b) => (
                <SelectItem key={b.code} value={b.code} text={b.name ?? ''} />
              ))}
            </Select>
            <Select
              id="requestingSourceId"
              labelText="Requesting Source *"
              value={formState.requestingSourceId}
              onChange={(e) => handleFieldChange('requestingSourceId', e.target.value)}
              invalid={Boolean(validationErrors.requestingSourceId)}
              invalidText={validationErrors.requestingSourceId}
            >
              <SelectItem value="" text="Select requesting source..." />
              {options?.requestingSources.map((rs) => (
                <SelectItem key={rs.code} value={rs.code} text={rs.name ?? ''} />
              ))}
            </Select>
            <DatePicker
              datePickerType="single"
              dateFormat="Y-m-d"
              value={formState.requestDate}
              onChange={(dates: Date[]) => {
                const date = dates[0];
                handleFieldChange('requestDate', date ? date.toISOString().split('T')[0] : '');
              }}
            >
              <DatePickerInput
                id="requestDate"
                labelText="Request Date *"
                placeholder="YYYY-MM-DD"
                invalid={Boolean(validationErrors.requestDate)}
                invalidText={validationErrors.requestDate}
              />
            </DatePicker>
            <div className="user-lookup-field">
              <TextInput
                id="requestorUserId"
                labelText="Requestor IDIR *"
                className="user-lookup-field__input"
                value={resolvedRequestor}
                invalid={Boolean(validationErrors.requestorUserId)}
                invalidText={validationErrors.requestorUserId}
                readOnly
              />
              {isRequestorLoading && <InlineLoading description="Looking up user…" />}
              <Button
                type="button"
                kind="ghost"
                size="sm"
                renderIcon={Search}
                iconDescription="Find a user"
                disabled={mutation.isPending}
                onClick={handleOpenRequestorSearch}
              >
                Find user
              </Button>
            </div>
          </div>
        </Tile>

        <Tile className="project-tile">
          <h2 className="section-title">Assignment</h2>
          <div className="form-fields">
            <Select
              id="projectManager"
              labelText="Project Manager"
              value={formState.projectManagerUserId}
              onChange={handleProjectManagerSelection}
            >
              <SelectItem value="" text="Select project manager..." />
              {options?.projectManagers.map((pm) => (
                <SelectItem key={pm.code} value={pm.code} text={pm.name ?? ''} />
              ))}
            </Select>
            <DatePicker
              datePickerType="single"
              dateFormat="Y-m-d"
              value={formState.projectManagerAssignedDate}
              onChange={(dates: Date[]) => {
                const date = dates[0];
                handleFieldChange(
                  'projectManagerAssignedDate',
                  date ? date.toISOString().split('T')[0] : '',
                );
              }}
            >
              <DatePickerInput
                id="projectManagerAssignedDate"
                labelText="Assigned Date"
                placeholder="YYYY-MM-DD"
              />
            </DatePicker>
            <Select
              id="priorityCode"
              labelText="Priority"
              value={formState.priorityCode}
              onChange={(e) => handleFieldChange('priorityCode', e.target.value)}
            >
              <SelectItem value="" text="Select priority..." />
              {options?.priorities.map((p) => (
                <SelectItem key={p.code} value={p.code} text={p.name ?? ''} />
              ))}
            </Select>
          </div>
        </Tile>
      </div>

      <div className="form-actions">
        <Button kind="secondary" size="sm" disabled={mutation.isPending} onClick={handleCancelEdit}>
          Cancel
        </Button>
        <Button
          kind="primary"
          size="sm"
          disabled={mutation.isPending || !hasChanges}
          onClick={handleSave}
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <UserSearchModal
        open={isUserModalOpen}
        onClose={handleUserModalClose}
        onSelect={handleUserSelected}
      />
    </div>
  );
};
