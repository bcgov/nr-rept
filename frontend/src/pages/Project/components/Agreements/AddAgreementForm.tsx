import {
  Button,
  Checkbox,
  NumberInput,
  Select,
  SelectItem,
  SkeletonText,
  TextArea,
  TextInput,
} from '@carbon/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import { CoUserSelect } from '@/components/Form/CoUserSelect';
import { useNotification } from '@/context/notification/useNotification';
import { useAgreementCreateOptions, useCreateAgreement } from '@/services/rept/hooks';

import {
  type AgreementFieldRules,
  defaultFieldRules,
  deriveFieldRules,
} from './agreementFieldRules';

import type { ReptAgreement } from '@/services/rept/types';

type AddAgreementFormProps = {
  projectId: string;
  onSuccess: (newAgreement: ReptAgreement) => void;
  onCancel: () => void;
};

type FormState = {
  agreementType: 'ACQUISITION' | 'DISPOSITION' | '';
  agreementCode: string;
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

const emptyFormState: FormState = {
  agreementType: '',
  agreementCode: '',
  active: true,
  paymentTerms: '',
  agreementTerm: '',
  expiryDate: '',
  bringForwardDate: '',
  anniversaryDate: '',
  renegotiationDate: '',
  lessorsFile: '',
  commitmentDescription: '',
  coUserId: undefined,
  coUserLabel: '',
};

const parseNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : Math.trunc(parsed);
};

const normalizeNullableString = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

/**
 * Build a minimal stub `ReptAgreement` from the current form state so that
 * `deriveFieldRules` can determine which conditional fields to show.
 */
const buildStubAgreement = (formState: FormState): ReptAgreement | null => {
  if (!formState.agreementType || !formState.agreementCode) {
    return null;
  }
  const code = formState.agreementCode.trim().toUpperCase();
  return {
    id: 0,
    projectId: 0,
    agreementType: formState.agreementType,
    agreementCode: code,
    acquisitionAgreementCode: formState.agreementType === 'ACQUISITION' ? code : null,
    dispositionAgreementCode: formState.agreementType === 'DISPOSITION' ? code : null,
  };
};

export const AddAgreementForm: FC<AddAgreementFormProps> = ({ projectId, onSuccess, onCancel }) => {
  const { display } = useNotification();
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const optionsQuery = useAgreementCreateOptions(projectId);
  const createMutation = useCreateAgreement(projectId);

  useEffect(() => {
    if (optionsQuery.isError) {
      display({
        kind: 'error',
        title: 'Failed to load agreement options',
        subtitle: (optionsQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [optionsQuery.isError, optionsQuery.error, display]);

  useEffect(() => {
    if (createMutation.isError) {
      display({
        kind: 'error',
        title: 'Failed to create agreement',
        subtitle: (createMutation.error as Error)?.message ?? 'Please try again.',
        timeout: 6000,
      });
    }
  }, [createMutation.isError, createMutation.error, display]);

  const codeOptions = useMemo(() => {
    if (!optionsQuery.data) return [];
    if (formState.agreementType === 'ACQUISITION') {
      return optionsQuery.data.acquisitionCodes;
    }
    if (formState.agreementType === 'DISPOSITION') {
      return optionsQuery.data.dispositionCodes;
    }
    return [];
  }, [formState.agreementType, optionsQuery.data]);

  const stubAgreement = useMemo(() => buildStubAgreement(formState), [formState]);
  const rules: AgreementFieldRules = useMemo(
    () => (stubAgreement ? deriveFieldRules(stubAgreement) : defaultFieldRules),
    [stubAgreement],
  );

  const handleFieldChange = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setFormState((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const handleTypeChange = useCallback((value: 'ACQUISITION' | 'DISPOSITION' | '') => {
    setFormState((prev) => ({
      ...prev,
      agreementType: value,
      agreementCode: '', // reset code when type changes
    }));
  }, []);

  const handleCoUserSelection = useCallback((selection: { id: number | null; name: string }) => {
    setFormState((prev) => ({
      ...prev,
      coUserId: selection.id ?? undefined,
      coUserLabel: selection.name ?? '',
    }));
  }, []);

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formState.agreementType) {
      errors.agreementType = 'Select an agreement type.';
    }
    if (!formState.agreementCode) {
      errors.agreementCode = 'Select an agreement method.';
    }
    if (rules.requireCommitment && !formState.commitmentDescription.trim()) {
      errors.commitmentDescription = 'Provide a commitment description.';
    }
    if (rules.requireTerm) {
      const term = parseNumberOrNull(formState.agreementTerm);
      if (term === null || term <= 0) {
        errors.agreementTerm = 'Enter a valid agreement term (whole years).';
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

    return errors;
  };

  const handleSave = useCallback(() => {
    const errors = validate();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!formState.agreementType || !formState.agreementCode) return;

    const code = formState.agreementCode.trim().toUpperCase();

    createMutation.mutate(
      {
        agreementType: formState.agreementType,
        agreementCode: code,
        active: formState.active,
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
        onSuccess: (created) => {
          onSuccess(created);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState, rules, createMutation, onSuccess]);

  if (optionsQuery.isPending) {
    return <SkeletonText width="60%" lineCount={3} />;
  }

  if (optionsQuery.isError) {
    return <p>Failed to load agreement options.</p>;
  }

  const isPending = createMutation.isPending;

  return (
    <div className="add-agreement-form">
      {/* ── Agreement Details ── */}
      <section className="add-agreement-form__section">
        <h4 className="section-title">Add Agreement</h4>

        <div className="agreement-details-form__grid">
          {/* Type selector */}
          <Select
            id="new-agreement-type"
            labelText="Agreement type *"
            value={formState.agreementType}
            onChange={(e) => handleTypeChange(e.target.value as 'ACQUISITION' | 'DISPOSITION' | '')}
            disabled={isPending}
            invalid={Boolean(validationErrors.agreementType)}
            invalidText={validationErrors.agreementType}
          >
            <SelectItem value="" text="Select type…" />
            <SelectItem value="ACQUISITION" text="Acquisition" />
            <SelectItem value="DISPOSITION" text="Disposition" />
          </Select>

          {/* Agreement method / code */}
          <Select
            id="new-agreement-code"
            labelText="Acquisition / Disposition method *"
            value={formState.agreementCode}
            onChange={(e) => handleFieldChange('agreementCode', e.target.value)}
            disabled={isPending || !formState.agreementType}
            invalid={Boolean(validationErrors.agreementCode)}
            invalidText={validationErrors.agreementCode}
          >
            <SelectItem value="" text={formState.agreementType ? 'Select method…' : '—'} />
            {codeOptions.map((opt) => (
              <SelectItem key={opt.code} value={opt.code} text={`${opt.label} (${opt.code})`} />
            ))}
          </Select>

          {/* Active checkbox */}
          <div className="agreement-details-form__checkbox">
            <Checkbox
              id="new-agreement-active"
              labelText="Agreement active"
              checked={formState.active}
              onChange={(_, { checked }) => handleFieldChange('active', checked)}
              disabled={isPending}
            />
          </div>

          {/* Expiry date */}
          <TextInput
            id="new-agreement-expiry-date"
            type="date"
            labelText="Expiry date"
            value={formState.expiryDate}
            onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
            disabled={isPending}
          />

          {/* Payment terms – full width */}
          <TextArea
            id="new-agreement-payment-terms"
            labelText="Payment terms"
            maxLength={4000}
            className="agreement-details-form__full-width"
            value={formState.paymentTerms}
            onChange={(e) => handleFieldChange('paymentTerms', e.target.value)}
            rows={4}
            disabled={isPending}
          />
        </div>
      </section>

      {/* ── Co-Use / Conditional Details (shown only when a code is selected) ── */}
      {stubAgreement && (
        <section className="add-agreement-form__section">
          <h4 className="section-title">
            {rules.showCoUser ? 'Co-Use Details' : 'Additional Details'}
          </h4>

          <div className="agreement-details-form__grid">
            {rules.showTerm && (
              <NumberInput
                id="new-agreement-term"
                label="Agreement term (years) *"
                value={formState.agreementTerm}
                onChange={(_, { value }) =>
                  handleFieldChange('agreementTerm', value?.toString() ?? '')
                }
                disabled={isPending}
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
              <TextInput
                id="new-agreement-bring-forward"
                type="date"
                labelText="Bring-forward/PC date *"
                value={formState.bringForwardDate}
                onChange={(e) => handleFieldChange('bringForwardDate', e.target.value)}
                disabled={isPending}
                invalid={Boolean(validationErrors.bringForwardDate)}
                invalidText={validationErrors.bringForwardDate}
              />
            )}
            {rules.showAnniversary && (
              <TextInput
                id="new-agreement-anniversary"
                type="date"
                labelText="Anniversary date *"
                value={formState.anniversaryDate}
                onChange={(e) => handleFieldChange('anniversaryDate', e.target.value)}
                disabled={isPending}
                invalid={Boolean(validationErrors.anniversaryDate)}
                invalidText={validationErrors.anniversaryDate}
              />
            )}
            {rules.showRenegotiation && (
              <TextInput
                id="new-agreement-renegotiation"
                type="date"
                labelText="Negotiation date *"
                value={formState.renegotiationDate}
                onChange={(e) => handleFieldChange('renegotiationDate', e.target.value)}
                disabled={isPending}
                invalid={Boolean(validationErrors.renegotiationDate)}
                invalidText={validationErrors.renegotiationDate}
              />
            )}
            {rules.showLessorsFile && (
              <TextInput
                id="new-agreement-lessors-file"
                labelText="Lessor's file"
                value={formState.lessorsFile}
                onChange={(e) => handleFieldChange('lessorsFile', e.target.value)}
                disabled={isPending}
                maxLength={120}
              />
            )}
          </div>

          {rules.showCommitment && (
            <TextArea
              id="new-agreement-commitment"
              labelText="Commitment description *"
              value={formState.commitmentDescription}
              onChange={(e) => handleFieldChange('commitmentDescription', e.target.value)}
              rows={4}
              disabled={isPending}
              maxLength={1000}
              invalid={Boolean(validationErrors.commitmentDescription)}
              invalidText={validationErrors.commitmentDescription}
            />
          )}

          {rules.showCoUser && (
            <CoUserSelect
              id="new-agreement-co-user"
              labelText="Co-use partner *"
              helperText="Required for co-use disposition agreements"
              value={formState.coUserId ?? null}
              valueLabel={formState.coUserLabel ?? ''}
              onChange={handleCoUserSelection}
              disabled={isPending}
              invalid={Boolean(validationErrors.coUserId)}
              invalidText={validationErrors.coUserId}
              enableFetch
            />
          )}
        </section>
      )}

      {/* ── Actions ── */}
      <div className="form-actions">
        <Button kind="tertiary" size="sm" disabled={isPending} onClick={onCancel}>
          Cancel
        </Button>
        <Button kind="primary" size="sm" disabled={isPending} onClick={handleSave}>
          {isPending ? 'Saving…' : 'Save agreement'}
        </Button>
      </div>
    </div>
  );
};
