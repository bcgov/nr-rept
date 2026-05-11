import { AddAlt as Add, Edit } from '@carbon/icons-react';
import {
  Button,
  DatePicker,
  DatePickerInput,
  InlineNotification,
  NumberInput,
  Select,
  SelectItem,
  SkeletonText,
  TextArea,
  TextInput,
  Tile,
} from '@carbon/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import {
  useReptAcquisitionRequest,
  useReptAcquisitionRequestOptions,
  useCreateReptAcquisitionRequest,
  useUpdateReptAcquisitionRequest,
} from '@/services/rept/hooks';

import { displayValue, formatDate, formatWithCode } from '../utils';

import { FieldList, type DetailField } from './FieldList';

import type { ReptAcquisitionRequest } from '@/services/rept/types';

type AcquisitionTabProps = {
  projectId: string;
};

type AcquisitionFormState = {
  acquisitionTypeCode: string;
  fsrTypeCode: string;
  roadUseTypeCode: string;
  receivedDate: string;
  targetCompletionDate: string;
  locationPlan: string;
  justification: string;
  propertiesDescription: string;
  timberVolumeAccessed: string;
  annualVolume: string;
  availableFunds: string;
  responsibilityCentre: string;
  fundingCode: string;
  serviceLine: string;
  stob: string;
};

const buildAcquisitionDetails = (acquisition: ReptAcquisitionRequest): DetailField[] => [
  {
    label: 'Recommended Acq. Type',
    value: formatWithCode(acquisition.acquisitionTypeLabel, acquisition.acquisitionTypeCode),
  },
  {
    label: 'FSR Type',
    value: formatWithCode(acquisition.fsrTypeLabel, acquisition.fsrTypeCode),
  },
  {
    label: 'Road Use Type',
    value: formatWithCode(acquisition.roadUseTypeLabel, acquisition.roadUseTypeCode),
  },
  { label: 'Received Date', value: formatDate(acquisition.receivedDate) },
  { label: 'Target Complete Date', value: formatDate(acquisition.targetCompletionDate) },
  { label: 'Location Plan', value: displayValue(acquisition.locationPlan) },
  { label: 'Justification', value: displayValue(acquisition.justification) },
  { label: 'Properties', value: displayValue(acquisition.propertiesDescription) },
];

const buildTimberVolume = (acquisition: ReptAcquisitionRequest): DetailField[] => [
  { label: 'Timber Volume Accessed (m³)', value: displayValue(acquisition.timberVolumeAccessed) },
  { label: 'Annual Volume (m³)', value: displayValue(acquisition.annualVolume) },
];

const buildAcquisitionFunding = (acquisition: ReptAcquisitionRequest): DetailField[] => [
  { label: 'Responsibility Centre', value: displayValue(acquisition.responsibilityCentre) },
  {
    label: 'Funding',
    value: formatWithCode(acquisition.fundingLabel, acquisition.fundingCode),
  },
  { label: 'Service Line', value: displayValue(acquisition.serviceLine) },
  { label: 'Available Funds', value: displayValue(acquisition.availableFunds) },
  { label: 'STOB', value: displayValue(acquisition.stob) },
];

const createFormState = (acquisition?: ReptAcquisitionRequest | null): AcquisitionFormState => ({
  acquisitionTypeCode: acquisition?.acquisitionTypeCode ?? '',
  fsrTypeCode: acquisition?.fsrTypeCode ?? '',
  roadUseTypeCode: acquisition?.roadUseTypeCode ?? '',
  receivedDate: acquisition?.receivedDate ?? '',
  targetCompletionDate: acquisition?.targetCompletionDate ?? '',
  locationPlan: acquisition?.locationPlan ?? '',
  justification: acquisition?.justification ?? '',
  propertiesDescription: acquisition?.propertiesDescription ?? '',
  timberVolumeAccessed:
    acquisition?.timberVolumeAccessed != null ? String(acquisition.timberVolumeAccessed) : '',
  annualVolume: acquisition?.annualVolume != null ? String(acquisition.annualVolume) : '',
  availableFunds: acquisition?.availableFunds != null ? String(acquisition.availableFunds) : '',
  responsibilityCentre: acquisition?.responsibilityCentre ?? '',
  fundingCode: acquisition?.fundingCode ?? '',
  serviceLine: acquisition?.serviceLine ?? '',
  stob: acquisition?.stob ?? '',
});

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

// Block scientific-notation and sign chars that <input type="number"> accepts by default.
const blockNonNumericKeys = (event: ReactKeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-'].includes(event.key)) {
    event.preventDefault();
  }
};

const parseNumberOrNull = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

const serializeFormState = (state: AcquisitionFormState) => ({
  acquisitionTypeCode: normalizeNullableString(state.acquisitionTypeCode),
  fsrTypeCode: normalizeNullableString(state.fsrTypeCode),
  roadUseTypeCode: normalizeNullableString(state.roadUseTypeCode),
  receivedDate: normalizeNullableString(state.receivedDate),
  targetCompletionDate: normalizeNullableString(state.targetCompletionDate),
  locationPlan: normalizeNullableString(state.locationPlan),
  justification: normalizeNullableString(state.justification),
  propertiesDescription: normalizeNullableString(state.propertiesDescription),
  timberVolumeAccessed: parseNumberOrNull(state.timberVolumeAccessed),
  annualVolume: parseNumberOrNull(state.annualVolume),
  availableFunds: parseNumberOrNull(state.availableFunds),
  responsibilityCentre: normalizeNullableString(state.responsibilityCentre),
  fundingCode: normalizeNullableString(state.fundingCode),
  serviceLine: normalizeNullableString(state.serviceLine),
  stob: normalizeNullableString(state.stob),
});

export const AcquisitionTab: FC<AcquisitionTabProps> = ({ projectId }) => {
  const { canEdit, canCreate } = useAuthorization();
  const { display } = useNotification();
  const acquisitionQuery = useReptAcquisitionRequest(projectId);
  const acquisition = acquisitionQuery.data ?? null;
  const optionsQuery = useReptAcquisitionRequestOptions(projectId);
  const options = optionsQuery.data;

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formState, setFormState] = useState<AcquisitionFormState>(() =>
    createFormState(acquisition),
  );
  const [initialFormState, setInitialFormState] = useState<AcquisitionFormState>(() =>
    createFormState(acquisition),
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateReptAcquisitionRequest(projectId);
  const updateMutation = useUpdateReptAcquisitionRequest(projectId);
  const activeMutation = isCreating ? createMutation : updateMutation;

  useEffect(() => {
    if (acquisitionQuery.isError) {
      display({
        kind: 'error',
        title: 'Failed to load acquisition request',
        subtitle: (acquisitionQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [acquisitionQuery.isError, acquisitionQuery.error, display]);

  useEffect(() => {
    if (activeMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to save acquisition request',
        subtitle: (activeMutation.error as Error).message,
        timeout: 6000,
      });
    }
  }, [activeMutation.isError, activeMutation.error, display]);

  const acquisitionKeyRef = useRef<string | null>(null);

  const baselineState = useMemo(() => serializeFormState(initialFormState), [initialFormState]);
  const currentState = useMemo(() => serializeFormState(formState), [formState]);
  const hasChanges = useMemo(() => {
    return Object.keys(baselineState).some((key) => {
      const typedKey = key as keyof typeof baselineState;
      return baselineState[typedKey] !== currentState[typedKey];
    });
  }, [baselineState, currentState]);

  useEffect(() => {
    const key = acquisition
      ? `${acquisition.id ?? 'new'}-${acquisition.revisionCount ?? '0'}`
      : 'none';
    if (acquisitionKeyRef.current === key) {
      return;
    }
    acquisitionKeyRef.current = key;
    const nextState = createFormState(acquisition);
    setInitialFormState(nextState);
    setFormState(nextState);
    setIsEditing(false);
    setIsCreating(false);
    setValidationErrors({});
  }, [acquisition]);

  const handleStartEdit = useCallback(() => {
    setFormState(createFormState(acquisition));
    setValidationErrors({});
    setIsEditing(true);
    setIsCreating(false);
  }, [acquisition]);

  const handleStartCreate = useCallback(() => {
    setFormState(createFormState(null));
    setInitialFormState(createFormState(null));
    setValidationErrors({});
    setIsCreating(true);
    setIsEditing(false);
  }, []);

  const handleCancel = useCallback(() => {
    setFormState(createFormState(acquisition));
    setValidationErrors({});
    setIsEditing(false);
    setIsCreating(false);
  }, [acquisition]);

  const handleFieldChange = useCallback(
    <K extends keyof AcquisitionFormState>(key: K, value: AcquisitionFormState[K]) => {
      setFormState((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!formState.acquisitionTypeCode.trim()) {
      errors.acquisitionTypeCode = 'Acquisition type is required.';
    }
    if (!formState.justification.trim()) {
      errors.justification = 'Justification is required.';
    }
    if (!formState.propertiesDescription.trim()) {
      errors.propertiesDescription = 'Properties description is required.';
    }
    if (!formState.timberVolumeAccessed.trim()) {
      errors.timberVolumeAccessed = 'Timber volume accessed is required.';
    }
    if (!formState.receivedDate.trim()) {
      errors.receivedDate = 'Received date is required.';
    }
    if (!formState.targetCompletionDate.trim()) {
      errors.targetCompletionDate = 'Target completion date is required.';
    }
    if (!formState.availableFunds.trim()) {
      errors.availableFunds = 'Available funds is required.';
    }
    if (!formState.responsibilityCentre.trim()) {
      errors.responsibilityCentre = 'Responsibility centre is required.';
    }
    if (!formState.serviceLine.trim()) {
      errors.serviceLine = 'Service line is required.';
    }
    if (!formState.stob.trim()) {
      errors.stob = 'STOB is required.';
    }
    if (!formState.fundingCode.trim()) {
      errors.fundingCode = 'Funding code is required.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    if (isCreating) {
      createMutation.mutate(
        {
          acquisitionTypeCode: formState.acquisitionTypeCode,
          fsrTypeCode: normalizeNullableString(formState.fsrTypeCode),
          roadUseTypeCode: normalizeNullableString(formState.roadUseTypeCode),
          receivedDate: normalizeNullableString(formState.receivedDate),
          targetCompletionDate: normalizeNullableString(formState.targetCompletionDate),
          locationPlan: normalizeNullableString(formState.locationPlan),
          justification: formState.justification,
          propertiesDescription: formState.propertiesDescription,
          timberVolumeAccessed: parseNumberOrNull(formState.timberVolumeAccessed) ?? 0,
          annualVolume: parseNumberOrNull(formState.annualVolume),
          availableFunds: parseNumberOrNull(formState.availableFunds),
          responsibilityCentre: normalizeNullableString(formState.responsibilityCentre),
          fundingCode: normalizeNullableString(formState.fundingCode),
          serviceLine: normalizeNullableString(formState.serviceLine),
          stob: normalizeNullableString(formState.stob),
        },
        {
          onSuccess: () => {
            display({ kind: 'success', title: 'Acquisition request created.', timeout: 4000 });
            setIsCreating(false);
          },
        },
      );
    } else if (isEditing && acquisition) {
      const revisionCount = acquisition.revisionCount;
      if (revisionCount === null || revisionCount === undefined) {
        return;
      }

      updateMutation.mutate(
        {
          revisionCount,
          acquisitionTypeCode: formState.acquisitionTypeCode,
          fsrTypeCode: normalizeNullableString(formState.fsrTypeCode),
          roadUseTypeCode: normalizeNullableString(formState.roadUseTypeCode),
          receivedDate: normalizeNullableString(formState.receivedDate),
          targetCompletionDate: normalizeNullableString(formState.targetCompletionDate),
          locationPlan: normalizeNullableString(formState.locationPlan),
          justification: formState.justification,
          propertiesDescription: formState.propertiesDescription,
          timberVolumeAccessed: parseNumberOrNull(formState.timberVolumeAccessed) ?? 0,
          annualVolume: parseNumberOrNull(formState.annualVolume),
          availableFunds: parseNumberOrNull(formState.availableFunds),
          responsibilityCentre: normalizeNullableString(formState.responsibilityCentre),
          fundingCode: normalizeNullableString(formState.fundingCode),
          serviceLine: normalizeNullableString(formState.serviceLine),
          stob: normalizeNullableString(formState.stob),
        },
        {
          onSuccess: () => {
            display({ kind: 'success', title: 'Acquisition request updated.', timeout: 4000 });
            setIsEditing(false);
          },
        },
      );
    }
  }, [acquisition, formState, isCreating, isEditing, createMutation, updateMutation, display]);

  if (acquisitionQuery.isPending) {
    return (
      <div className="project-tab-panel">
        <SkeletonText width="60%" lineCount={3} />
      </div>
    );
  }

  if (acquisitionQuery.isError) {
    return (
      <div className="project-tab-panel">
        <p>Failed to load acquisition request.</p>
      </div>
    );
  }

  // No acquisition request exists - show create button
  if (!acquisition && !isCreating) {
    return (
      <div className="project-tab-panel">
        {canCreate && (
          <div className="tab-actions">
            <Button kind="primary" size="sm" renderIcon={Add} onClick={handleStartCreate}>
              Create Acquisition Request
            </Button>
          </div>
        )}
        <InlineNotification
          kind="info"
          lowContrast
          title="There are no recorded acquisition request for this project"
          hideCloseButton
        />
      </div>
    );
  }

  // Edit/Create mode
  if (isEditing || isCreating) {
    return (
      <div className="project-tab-panel">
        <div className="project-tiles-grid">
          <Tile className="project-tile project-tile--full">
            <h2 className="section-title">Acquisition Details</h2>
            <div className="form-fields">
              <Select
                id="acquisitionTypeCode"
                labelText="Recommended Acq. Type *"
                value={formState.acquisitionTypeCode}
                onChange={(e) => handleFieldChange('acquisitionTypeCode', e.target.value)}
                invalid={Boolean(validationErrors.acquisitionTypeCode)}
                invalidText={validationErrors.acquisitionTypeCode}
              >
                <SelectItem value="" text="Select acquisition type..." />
                {options?.acquisitionTypes.map((t) => (
                  <SelectItem key={t.code} value={t.code} text={t.name ?? ''} />
                ))}
              </Select>
              <Select
                id="fsrTypeCode"
                labelText="FSR Type"
                value={formState.fsrTypeCode}
                onChange={(e) => handleFieldChange('fsrTypeCode', e.target.value)}
              >
                <SelectItem value="" text="Select FSR type..." />
                {options?.fsrTypes.map((t) => (
                  <SelectItem key={t.code} value={t.code} text={t.name ?? ''} />
                ))}
              </Select>
              <Select
                id="roadUseTypeCode"
                labelText="Road Use Type"
                value={formState.roadUseTypeCode}
                onChange={(e) => handleFieldChange('roadUseTypeCode', e.target.value)}
              >
                <SelectItem value="" text="Select road use type..." />
                {options?.roadUseTypes.map((t) => (
                  <SelectItem key={t.code} value={t.code} text={t.name ?? ''} />
                ))}
              </Select>
              <DatePicker
                datePickerType="single"
                dateFormat="Y-m-d"
                value={formState.receivedDate}
                onChange={(dates: Date[]) => {
                  const date = dates[0];
                  handleFieldChange('receivedDate', date ? date.toISOString().split('T')[0] : '');
                }}
              >
                <DatePickerInput
                  id="receivedDate"
                  invalid={Boolean(validationErrors.receivedDate)}
                  invalidText={validationErrors.receivedDate}
                  labelText="Received Date *"
                  placeholder="YYYY-MM-DD"
                />
              </DatePicker>
              <DatePicker
                datePickerType="single"
                dateFormat="Y-m-d"
                value={formState.targetCompletionDate}
                onChange={(dates: Date[]) => {
                  const date = dates[0];
                  handleFieldChange(
                    'targetCompletionDate',
                    date ? date.toISOString().split('T')[0] : '',
                  );
                }}
              >
                <DatePickerInput
                  id="targetCompletionDate"
                  labelText="Target Complete Date *"
                  invalid={Boolean(validationErrors.targetCompletionDate)}
                  invalidText={validationErrors.targetCompletionDate}
                  placeholder="YYYY-MM-DD"
                />
              </DatePicker>
              <TextInput
                id="locationPlan"
                labelText="Location Plan"
                value={formState.locationPlan}
                onChange={(e) => handleFieldChange('locationPlan', e.target.value)}
              />
              <TextArea
                id="justification"
                labelText="Justification *"
                value={formState.justification}
                onChange={(e) => handleFieldChange('justification', e.target.value)}
                invalid={Boolean(validationErrors.justification)}
                invalidText={validationErrors.justification}
                rows={3}
                maxLength={4000}
              />
              <TextArea
                id="propertiesDescription"
                labelText="Properties *"
                value={formState.propertiesDescription}
                onChange={(e) => handleFieldChange('propertiesDescription', e.target.value)}
                invalid={Boolean(validationErrors.propertiesDescription)}
                invalidText={validationErrors.propertiesDescription}
                rows={3}
                maxLength={4000}
              />
            </div>
          </Tile>

          <Tile className="project-tile project-tile--full">
            <h2 className="section-title">Timber Volume</h2>
            <div className="form-fields">
              <NumberInput
                id="timberVolumeAccessed"
                label="Timber Volume Accessed (m³) *"
                value={formState.timberVolumeAccessed}
                onChange={(_, { value }) =>
                  handleFieldChange('timberVolumeAccessed', value?.toString() ?? '')
                }
                onKeyDown={blockNonNumericKeys}
                invalid={Boolean(validationErrors.timberVolumeAccessed)}
                invalidText={validationErrors.timberVolumeAccessed}
                allowEmpty
                hideSteppers
              />
              <NumberInput
                id="annualVolume"
                label="Annual Volume (m³)"
                value={formState.annualVolume}
                onChange={(_, { value }) =>
                  handleFieldChange('annualVolume', value?.toString() ?? '')
                }
                onKeyDown={blockNonNumericKeys}
                allowEmpty
                hideSteppers
              />
            </div>
          </Tile>

          <Tile className="project-tile project-tile--full">
            <h2 className="section-title">Funding</h2>
            <div className="form-fields">
              <TextInput
                id="responsibilityCentre"
                labelText="Responsibility Centre *"
                invalid={Boolean(validationErrors.responsibilityCentre)}
                invalidText={validationErrors.responsibilityCentre}
                value={formState.responsibilityCentre}
                onChange={(e) => handleFieldChange('responsibilityCentre', e.target.value)}
              />
              <Select
                id="fundingCode"
                labelText="Funding *"
                invalid={Boolean(validationErrors.fundingCode)}
                invalidText={validationErrors.fundingCode}
                value={formState.fundingCode}
                onChange={(e) => handleFieldChange('fundingCode', e.target.value)}
              >
                <SelectItem value="" text="Select funding code..." />
                {options?.fundingCodes.map((f) => (
                  <SelectItem key={f.code} value={f.code} text={f.name ?? ''} />
                ))}
              </Select>
              <TextInput
                id="serviceLine"
                labelText="Service Line *"
                invalid={Boolean(validationErrors.serviceLine)}
                invalidText={validationErrors.serviceLine}
                value={formState.serviceLine}
                onChange={(e) => handleFieldChange('serviceLine', e.target.value)}
              />
              <NumberInput
                id="availableFunds"
                label="Available Funds *"
                value={formState.availableFunds}
                onChange={(_, { value }) =>
                  handleFieldChange('availableFunds', value?.toString() ?? '')
                }
                onKeyDown={blockNonNumericKeys}
                invalid={Boolean(validationErrors.availableFunds)}
                invalidText={validationErrors.availableFunds}
                allowEmpty
                hideSteppers
              />
              <TextInput
                id="stob"
                labelText="STOB *"
                invalid={Boolean(validationErrors.stob)}
                invalidText={validationErrors.stob}
                value={formState.stob}
                onChange={(e) => handleFieldChange('stob', e.target.value)}
              />
            </div>
          </Tile>
        </div>

        <div className="form-actions">
          <Button
            kind="tertiary"
            size="sm"
            disabled={activeMutation.isPending}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            kind="primary"
            size="sm"
            disabled={activeMutation.isPending || (!isCreating && !hasChanges)}
            onClick={handleSave}
          >
            {activeMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  // View mode
  const detailsFields = buildAcquisitionDetails(acquisition!);
  const timberFields = buildTimberVolume(acquisition!);
  const fundingFields = buildAcquisitionFunding(acquisition!);

  return (
    <div className="project-summary-readonly">
      {canEdit && (
        <div className="project-summary-readonly__actions">
          <Button
            kind="primary"
            size="sm"
            renderIcon={Edit}
            onClick={handleStartEdit}
            title="Edit acquisition request"
          >
            Edit
          </Button>
        </div>
      )}

      <div className="project-tiles-grid">
        <Tile className="project-tile project-tile--full">
          <h2 className="section-title">Acquisition Details</h2>
          <FieldList fields={detailsFields} keyPrefix="acquisition-details" />
        </Tile>

        <Tile className="project-tile project-tile--full">
          <h2 className="section-title">Timber Volume</h2>
          <FieldList fields={timberFields} keyPrefix="acquisition-timber" />
        </Tile>

        <Tile className="project-tile project-tile--full">
          <h2 className="section-title">Funding</h2>
          <FieldList fields={fundingFields} keyPrefix="acquisition-funding" />
        </Tile>
      </div>
    </div>
  );
};
