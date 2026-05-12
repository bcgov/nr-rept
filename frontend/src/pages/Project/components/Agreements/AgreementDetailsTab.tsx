import { Edit } from '@carbon/icons-react';
import {
  Button,
  Checkbox,
  DatePicker,
  DatePickerInput,
  InlineNotification,
  NumberInput,
  TextArea,
  TextInput,
} from '@carbon/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';

import { CoUserSelect } from '@/components/Form/CoUserSelect';
import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useUpdateAgreement } from '@/services/rept/hooks';

import {
  MISSING_VALUE,
  displayValue,
  formatBoolean,
  formatDate,
  formatWithCode,
} from '../../utils';
import { FieldList, type DetailField } from '../FieldList';

import { deriveFieldRules } from './agreementFieldRules';

import type { ReptAgreement } from '@/services/rept/types';

type AgreementDetailsTabProps = {
  projectId: string;
  agreementId?: string | null;
  agreement?: ReptAgreement | null;
};

type AgreementDetailsFormState = {
  active: boolean;
  paymentTerms: string;
  agreementTerm: string;
  expiryDate: string;
  bringForwardDate: string;
  anniversaryDate: string;
  renegotiationDate: string;
  lessorsFile: string;
  commitmentDescription: string;
  coUserId?: number;
  coUserLabel?: string;
};

const buildAgreementDetails = (agreement?: ReptAgreement | null): DetailField[] => {
  if (!agreement) {
    return [];
  }

  const coUserCode = agreement.coUserId ? String(agreement.coUserId) : undefined;

  return [
    {
      label: 'Agreement Type',
      value:
        agreement.agreementType === 'ACQUISITION'
          ? formatWithCode(agreement.acquisitionAgreementLabel, agreement.acquisitionAgreementCode)
          : agreement.agreementType === 'DISPOSITION'
            ? formatWithCode(
                agreement.dispositionAgreementLabel,
                agreement.dispositionAgreementCode,
              )
            : displayValue(agreement.agreementLabel),
    },
    {
      label: 'Agreement Active',
      value: formatBoolean(agreement.active),
    },
    {
      label: 'Agreement Term (years)',
      value: displayValue(agreement.agreementTerm ?? null),
    },
    {
      label: 'Bring-forward Date (PC Date)',
      value: formatDate(agreement.bringForwardDate),
    },
    {
      label: 'Anniversary Date',
      value: formatDate(agreement.anniversaryDate),
    },
    {
      label: 'Negotiation Date',
      value: formatDate(agreement.renegotiationDate),
    },
    {
      label: 'Expiry Date',
      value: formatDate(agreement.expiryDate),
    },
    {
      label: "Lessor's File",
      value: displayValue(agreement.lessorsFile),
    },
    {
      label: 'Commitment Description',
      value: displayValue(agreement.commitmentDescription),
    },
    {
      label: 'Co-use Partner',
      value: formatWithCode(agreement.coUserLabel, coUserCode),
    },
    {
      label: 'Revision Count',
      value: displayValue(agreement.revisionCount ?? null),
    },
    {
      label: 'Payment Terms',
      value: displayValue(agreement.paymentTerms),
    },
  ];
};

const createFormState = (agreement?: ReptAgreement | null): AgreementDetailsFormState => ({
  active: Boolean(agreement?.active),
  paymentTerms: agreement?.paymentTerms ?? '',
  agreementTerm: agreement?.agreementTerm ? String(agreement.agreementTerm) : '',
  expiryDate: agreement?.expiryDate ?? '',
  bringForwardDate: agreement?.bringForwardDate ?? '',
  anniversaryDate: agreement?.anniversaryDate ?? '',
  renegotiationDate: agreement?.renegotiationDate ?? '',
  lessorsFile: agreement?.lessorsFile ?? '',
  commitmentDescription: agreement?.commitmentDescription ?? '',
  coUserId: agreement?.coUserId ?? undefined,
  coUserLabel: agreement?.coUserLabel ?? '',
});

const parseNumberOrNull = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : Math.trunc(parsed);
};

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const serializeFormState = (state: AgreementDetailsFormState) => ({
  active: Boolean(state.active),
  paymentTerms: state.paymentTerms.trim(),
  agreementTerm: parseNumberOrNull(state.agreementTerm),
  expiryDate: state.expiryDate || '',
  bringForwardDate: state.bringForwardDate || '',
  anniversaryDate: state.anniversaryDate || '',
  renegotiationDate: state.renegotiationDate || '',
  lessorsFile: state.lessorsFile.trim(),
  commitmentDescription: state.commitmentDescription.trim(),
  coUserId: state.coUserId ?? null,
});

const normalizeAgreementCode = (agreement?: ReptAgreement | null) => {
  if (!agreement) {
    return null;
  }
  const rawCode =
    agreement.agreementCode ??
    (agreement.agreementType === 'ACQUISITION'
      ? agreement.acquisitionAgreementCode
      : agreement.dispositionAgreementCode);
  return rawCode?.trim().toUpperCase() ?? null;
};

export const AgreementDetailsTab: FC<AgreementDetailsTabProps> = ({
  projectId,
  agreementId,
  agreement,
}) => {
  const { canEdit } = useAuthorization();
  const { display } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<AgreementDetailsFormState>(() =>
    createFormState(agreement),
  );
  const [initialFormState, setInitialFormState] = useState<AgreementDetailsFormState>(() =>
    createFormState(agreement),
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const detailFields = useMemo(() => buildAgreementDetails(agreement), [agreement]);
  const rules = useMemo(() => deriveFieldRules(agreement), [agreement]);
  const normalizedCode = useMemo(() => normalizeAgreementCode(agreement), [agreement]);
  const baselineState = useMemo(() => serializeFormState(initialFormState), [initialFormState]);
  const currentState = useMemo(() => serializeFormState(formState), [formState]);
  const hasChanges = useMemo(() => {
    return Object.keys(baselineState).some((key) => {
      const typedKey = key as keyof typeof baselineState;
      return baselineState[typedKey] !== currentState[typedKey];
    });
  }, [baselineState, currentState]);

  const mutation = useUpdateAgreement(projectId, agreementId ?? undefined);
  const { reset: resetMutation } = mutation;
  const agreementKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (mutation.isError) {
      display({
        kind: 'error',
        title: 'Unable to save agreement',
        subtitle: (mutation.error as Error)?.message ?? 'Update failed.',
        timeout: 9000,
      });
    }
  }, [mutation.isError, mutation.error, display]);

  const handleCoUserSelection = useCallback((selection: { id: number | null; name: string }) => {
    setFormState((prev) => ({
      ...prev,
      coUserId: selection.id ?? undefined,
      coUserLabel: selection.name ?? '',
    }));
  }, []);

  useEffect(() => {
    const key = agreement ? `${agreement.id}-${agreement.revisionCount ?? '0'}` : 'none';
    if (agreementKeyRef.current === key) {
      return;
    }
    agreementKeyRef.current = key;
    const nextState = createFormState(agreement);
    setInitialFormState(nextState);
    setFormState(nextState);
    setIsEditing(false);
    setValidationErrors({});
    resetMutation();
  }, [agreement, resetMutation]);

  const agreementTypeLabel =
    agreement?.agreementType === 'ACQUISITION'
      ? 'Acquisition'
      : agreement?.agreementType === 'DISPOSITION'
        ? 'Disposition'
        : '';
  const agreementMethodLabel = agreement
    ? agreement.agreementType === 'ACQUISITION'
      ? formatWithCode(agreement.acquisitionAgreementLabel, agreement.acquisitionAgreementCode)
      : agreement.agreementType === 'DISPOSITION'
        ? formatWithCode(agreement.dispositionAgreementLabel, agreement.dispositionAgreementCode)
        : displayValue(agreement.agreementLabel)
    : '';
  const resolvedMethodLabel = agreementMethodLabel === MISSING_VALUE ? '' : agreementMethodLabel;

  const editDisabledReason = useMemo(() => {
    if (!agreement || !agreementId) {
      return 'Select an agreement to edit its details.';
    }
    if (agreement.revisionCount === null || agreement.revisionCount === undefined) {
      return 'Revision metadata is required before editing.';
    }
    if (!agreement.agreementType) {
      return 'Agreement type was not provided by the service.';
    }
    if (!normalizedCode) {
      return 'Agreement code is missing for this record.';
    }
    return null;
  }, [agreement, agreementId, normalizedCode]);

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
    <K extends keyof AgreementDetailsFormState>(key: K, value: AgreementDetailsFormState[K]) => {
      setFormState((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!agreement || !agreementId || !normalizedCode || !agreement.agreementType) {
      return;
    }
    const revisionCount = agreement.revisionCount;
    if (revisionCount === null || revisionCount === undefined) {
      return;
    }

    const errors: Record<string, string> = {};
    if (rules.requireCommitment && !formState.commitmentDescription.trim()) {
      errors.commitmentDescription = 'Provide a commitment description.';
    }
    if (rules.requireTerm) {
      const term = parseNumberOrNull(formState.agreementTerm);
      if (term === null || term <= 0) {
        errors.agreementTerm = 'Enter a valid term in years.';
      }
    }
    if (rules.requireBringForward && !formState.bringForwardDate) {
      errors.bringForwardDate = 'PC date is required.';
    }
    if (rules.requireAnniversary && !formState.anniversaryDate) {
      errors.anniversaryDate = 'Anniversary date is required.';
    }
    if (rules.requireRenegotiation && !formState.renegotiationDate) {
      errors.renegotiationDate = 'Negotiation date is required.';
    }
    if (rules.requireCoUser && !formState.coUserId) {
      errors.coUserId = 'Select a co-use partner.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    mutation.mutate(
      {
        revisionCount,
        agreementType: agreement.agreementType,
        agreementCode: normalizedCode,
        active: Boolean(formState.active),
        paymentTerms: normalizeNullableString(formState.paymentTerms),
        agreementTerm: rules.showTerm ? parseNumberOrNull(formState.agreementTerm) : null,
        expiryDate: formState.expiryDate || null,
        bringForwardDate: rules.showBringForward ? formState.bringForwardDate || null : null,
        anniversaryDate: rules.showAnniversary ? formState.anniversaryDate || null : null,
        renegotiationDate: rules.showRenegotiation ? formState.renegotiationDate || null : null,
        lessorsFile: rules.showLessorsFile ? normalizeNullableString(formState.lessorsFile) : null,
        commitmentDescription: rules.showCommitment
          ? normalizeNullableString(formState.commitmentDescription)
          : null,
        coUserId: rules.showCoUser ? (formState.coUserId ?? null) : null,
      },
      {
        onSuccess: () => {
          display({ kind: 'success', title: 'Agreement details saved.', timeout: 7000 });
          setIsEditing(false);
        },
      },
    );
  }, [agreement, agreementId, formState, mutation, normalizedCode, rules, display]);

  if (!agreement || !agreementId) {
    return <p className="field-empty">Select an agreement to see its details.</p>;
  }

  return (
    <div className="agreement-details-tab">
      {!isEditing && canEdit && (
        <div className="project-summary-readonly__actions">
          <Button
            kind="tertiary"
            size="sm"
            renderIcon={Edit}
            disabled={Boolean(editDisabledReason)}
            onClick={handleStartEdit}
          >
            Edit
          </Button>
        </div>
      )}

      {editDisabledReason && !isEditing && (
        <InlineNotification
          kind="info"
          lowContrast
          title="Editing unavailable"
          subtitle={editDisabledReason}
        />
      )}

      {!isEditing && (
        <FieldList fields={detailFields} keyPrefix={`agreement-${agreement.id}-details`} />
      )}

      {isEditing && (
        <div className="agreement-details-form">
          <div className="agreement-details-form__grid">
            <TextInput
              id="agreement-type"
              labelText="Agreement type"
              value={agreementTypeLabel}
              readOnly
              disabled
            />
            <TextInput
              id="agreement-label"
              labelText="Agreement label"
              value={agreement.agreementLabel ?? ''}
              readOnly
              disabled
            />
            <TextInput
              id="agreement-method"
              labelText="Acquisition/Disposition method"
              value={resolvedMethodLabel}
              readOnly
              disabled
            />
            <TextInput
              id="agreement-revision"
              labelText="Revision count"
              value={
                agreement.revisionCount !== null && agreement.revisionCount !== undefined
                  ? String(agreement.revisionCount)
                  : ''
              }
              readOnly
              disabled
            />
            <div className="agreement-details-form__checkbox">
              <Checkbox
                id="agreement-active"
                labelText="Agreement active"
                checked={Boolean(formState.active)}
                onChange={(_, { checked }) => handleFieldChange('active', checked)}
                disabled={mutation.isPending}
              />
            </div>
            <DatePicker
              datePickerType="single"
              dateFormat="Y-m-d"
              value={formState.expiryDate}
              onChange={(dates: Date[]) => {
                const date = dates[0];
                handleFieldChange('expiryDate', date ? date.toISOString().split('T')[0] : '');
              }}
            >
              <DatePickerInput
                id="agreement-expiry-date"
                labelText="Expiry date"
                placeholder="YYYY-MM-DD"
                disabled={mutation.isPending}
              />
            </DatePicker>
            {rules.showTerm && (
              <NumberInput
                id="agreement-term"
                label="Agreement term (years) *"
                value={formState.agreementTerm}
                onChange={(_, { value }) =>
                  handleFieldChange('agreementTerm', value?.toString() ?? '')
                }
                disabled={mutation.isPending}
                invalid={Boolean(validationErrors.agreementTerm)}
                invalidText={validationErrors.agreementTerm}
                min={0}
                max={9999}
                allowEmpty
                hideSteppers
                onKeyDown={(event) => {
                  if (['e', 'E', '+', '-', '.'].includes(event.key)) {
                    event.preventDefault();
                    return;
                  }
                  if (/^\d$/.test(event.key)) {
                    const input = event.currentTarget;
                    const isReplacing = input.selectionStart !== input.selectionEnd;
                    if (input.value.length >= 4 && !isReplacing) {
                      event.preventDefault();
                    }
                  }
                }}
              />
            )}
            {rules.showBringForward && (
              <DatePicker
                datePickerType="single"
                dateFormat="Y-m-d"
                value={formState.bringForwardDate}
                onChange={(dates: Date[]) => {
                  const date = dates[0];
                  handleFieldChange(
                    'bringForwardDate',
                    date ? date.toISOString().split('T')[0] : '',
                  );
                }}
              >
                <DatePickerInput
                  id="agreement-bring-forward"
                  labelText="Bring-forward/PC date *"
                  placeholder="YYYY-MM-DD"
                  disabled={mutation.isPending}
                  invalid={Boolean(validationErrors.bringForwardDate)}
                  invalidText={validationErrors.bringForwardDate}
                />
              </DatePicker>
            )}
            {rules.showAnniversary && (
              <DatePicker
                datePickerType="single"
                dateFormat="Y-m-d"
                value={formState.anniversaryDate}
                onChange={(dates: Date[]) => {
                  const date = dates[0];
                  handleFieldChange(
                    'anniversaryDate',
                    date ? date.toISOString().split('T')[0] : '',
                  );
                }}
              >
                <DatePickerInput
                  id="agreement-anniversary"
                  labelText="Anniversary date *"
                  placeholder="YYYY-MM-DD"
                  disabled={mutation.isPending}
                  invalid={Boolean(validationErrors.anniversaryDate)}
                  invalidText={validationErrors.anniversaryDate}
                />
              </DatePicker>
            )}
            {rules.showRenegotiation && (
              <DatePicker
                datePickerType="single"
                dateFormat="Y-m-d"
                value={formState.renegotiationDate}
                onChange={(dates: Date[]) => {
                  const date = dates[0];
                  handleFieldChange(
                    'renegotiationDate',
                    date ? date.toISOString().split('T')[0] : '',
                  );
                }}
              >
                <DatePickerInput
                  id="agreement-renegotiation"
                  labelText="Negotiation date *"
                  placeholder="YYYY-MM-DD"
                  disabled={mutation.isPending}
                  invalid={Boolean(validationErrors.renegotiationDate)}
                  invalidText={validationErrors.renegotiationDate}
                />
              </DatePicker>
            )}
            {rules.showLessorsFile && (
              <TextInput
                id="agreement-lessors-file"
                labelText="Lessor's file"
                value={formState.lessorsFile}
                onChange={(event) => handleFieldChange('lessorsFile', event.target.value)}
                disabled={mutation.isPending}
                maxLength={120}
              />
            )}
          </div>

          {rules.showCommitment && (
            <TextArea
              id="agreement-commitment"
              labelText="Commitment description"
              value={formState.commitmentDescription}
              onChange={(event) => handleFieldChange('commitmentDescription', event.target.value)}
              rows={4}
              disabled={mutation.isPending}
              maxLength={1000}
              invalid={Boolean(validationErrors.commitmentDescription)}
              invalidText={validationErrors.commitmentDescription}
            />
          )}

          {rules.showCoUser && (
            <CoUserSelect
              id="agreement-co-user"
              labelText="Co-use partner *"
              helperText="Available for co-use disposition agreements"
              value={formState.coUserId ?? null}
              valueLabel={formState.coUserLabel ?? ''}
              onChange={handleCoUserSelection}
              disabled={mutation.isPending}
              invalid={Boolean(validationErrors.coUserId)}
              invalidText={validationErrors.coUserId}
              enableFetch={isEditing}
            />
          )}

          <TextArea
            id="agreement-payment-terms"
            labelText="Payment terms"
            maxLength={4000}
            className="agreement-details-form__full-width"
            value={formState.paymentTerms}
            onChange={(event) => handleFieldChange('paymentTerms', event.target.value)}
            rows={4}
            disabled={mutation.isPending}
          />

          <div className="form-actions">
            <Button
              kind="secondary"
              size="sm"
              disabled={mutation.isPending}
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button
              kind="primary"
              size="sm"
              disabled={mutation.isPending || !hasChanges}
              onClick={handleSave}
            >
              {mutation.isPending ? 'Saving…' : 'Save details'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
