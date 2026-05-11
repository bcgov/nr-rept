import {
  Button,
  Checkbox,
  InlineNotification,
  NumberInput,
  RadioButton,
  RadioButtonGroup,
  Select,
  SelectItem,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextArea,
  TextInput,
} from '@carbon/react';
import { Add, View } from '@carbon/react/icons';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import { Modal } from '@/components/Modal';
import { useNotification } from '@/context/notification/useNotification';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useGenerateReport } from '@/services/reports/hooks';
import {
  useCreateAgreementPayment,
  useReptAgreementPaymentOptions,
  useReptAgreementPayments,
} from '@/services/rept/hooks';
import { openBlobInNewTab } from '@/utils/download';

import {
  MISSING_VALUE,
  displayValue,
  formatBoolean,
  formatCurrency,
  formatDate,
  formatWithCode,
} from '../../utils';
import { FieldList } from '../FieldList';

import type {
  ReptAgreementPayee,
  ReptAgreementPayeeCandidate,
  ReptAgreementPayment,
} from '@/services/rept/types';

type AgreementPaymentsTabProps = {
  projectId: string;
  agreementId?: string | null;
};

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined) {
    return MISSING_VALUE;
  }
  return `${value}%`;
};

const buildPaymentFields = (payment: ReptAgreementPayment) => [
  { label: 'Request Date', value: formatDate(payment.requestDate) },
  { label: 'Payment Amount', value: formatCurrency(payment.amount) },
  { label: 'GST Amount', value: formatCurrency(payment.gstAmount) },
  { label: 'Total Invoice', value: formatCurrency(payment.totalAmount) },
  {
    label: 'Payment Term',
    value: formatWithCode(payment.paymentTermTypeLabel, payment.paymentTermTypeCode),
  },
  {
    label: 'Payment Type',
    value: formatWithCode(payment.paymentTypeLabel, payment.paymentTypeCode),
  },
  {
    label: 'Expense Authority',
    value: formatWithCode(payment.expenseAuthorityLabel, payment.expenseAuthorityCode),
  },
  {
    label: 'Qualified Receiver',
    value: formatWithCode(payment.qualifiedReceiverLabel, payment.qualifiedReceiverCode),
  },
  { label: 'Tax Rate', value: formatPercent(payment.taxRatePercent) },
  { label: 'CAS Client', value: displayValue(payment.casClient) },
  { label: 'CAS Responsibility Centre', value: displayValue(payment.casResponsibilityCentre) },
  { label: 'CAS Service Line', value: displayValue(payment.casServiceLine) },
  { label: 'CAS STOB', value: displayValue(payment.casStob) },
  { label: 'CAS Project Number', value: displayValue(payment.casProjectNumber) },
  {
    label: 'Processing Instructions',
    value: displayValue(payment.processingInstructions),
  },
  {
    label: 'Payment Rescinded',
    value: formatBoolean(payment.rescinded),
  },
  {
    label: 'Revision Count',
    value: displayValue(payment.revisionCount ?? null),
  },
];

const buildPayeeRow = (payee: ReptAgreementPayee) => [
  displayValue(payee.displayName ?? payee.companyName ?? payee.lastName ?? payee.firstName),
  displayValue(payee.contactTypeLabel ?? payee.contactTypeCode),
  displayValue(payee.parcelIdentifier),
  displayValue(payee.titleNumber),
  displayValue(payee.phone),
  displayValue(payee.email),
];

const buildInitialPaymentDraft = () => ({
  requestDate: '',
  amount: '',
  paymentTypeCode: '',
  paymentTermTypeCode: '',
  expenseAuthorityCode: '',
  qualifiedReceiverCode: '',
  casClient: '',
  casResponsibilityCentre: '',
  casServiceLine: '',
  casStob: '',
  casProjectNumber: '',
  processingInstructions: '',
  applyGst: true,
});

type PaymentDraftState = ReturnType<typeof buildInitialPaymentDraft>;

const getPayeeDisplayName = (
  payee: Pick<
    ReptAgreementPayeeCandidate,
    'displayName' | 'companyName' | 'lastName' | 'firstName'
  >,
) =>
  payee.displayName ??
  payee.companyName ??
  [payee.lastName, payee.firstName].filter(Boolean).join(', ');

const parseCurrencyInput = (value: string) => {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/[^0-9.]+/g, '');
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const validatePaymentDraft = (
  draft: PaymentDraftState,
  selectedPayeeId: number | null,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!draft.requestDate.trim()) {
    errors.requestDate = 'Request date is required.';
  }

  const amount = parseCurrencyInput(draft.amount);
  if (amount === null || amount <= 0) {
    errors.amount = 'A valid payment amount is required.';
  }

  if (!draft.paymentTypeCode.trim()) {
    errors.paymentTypeCode = 'Payment type is required.';
  }

  if (!draft.paymentTermTypeCode.trim()) {
    errors.paymentTermTypeCode = 'Payment term is required.';
  }

  if (!draft.casClient.trim()) {
    errors.casClient = 'CAS client is required.';
  }

  if (!draft.casResponsibilityCentre.trim()) {
    errors.casResponsibilityCentre = 'CAS responsibility centre is required.';
  }

  if (!draft.casServiceLine.trim()) {
    errors.casServiceLine = 'CAS service line is required.';
  }

  if (!draft.casStob.trim()) {
    errors.casStob = 'CAS STOB is required.';
  }

  if (!draft.casProjectNumber.trim()) {
    errors.casProjectNumber = 'CAS project number is required.';
  }

  if (selectedPayeeId === null) {
    errors.payee = 'A payee must be selected.';
  }

  return errors;
};

export const AgreementPaymentsTab: FC<AgreementPaymentsTabProps> = ({ projectId, agreementId }) => {
  const { canCreate } = useAuthorization();
  const { display } = useNotification();
  const agreementPaymentsQuery = useReptAgreementPayments(projectId, agreementId ?? undefined);
  const paymentOptionsQuery = useReptAgreementPaymentOptions(projectId, agreementId ?? undefined);
  const createPaymentMutation = useCreateAgreementPayment(projectId, agreementId ?? undefined);
  const invoiceReportMutation = useGenerateReport('2161');

  useEffect(() => {
    if (agreementPaymentsQuery.isError) {
      display({
        kind: 'error',
        title: 'Failed to load agreement payments',
        subtitle: (agreementPaymentsQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [agreementPaymentsQuery.isError, agreementPaymentsQuery.error, display]);

  useEffect(() => {
    if (paymentOptionsQuery.isError) {
      display({
        kind: 'error',
        title: 'Unable to load payment options',
        subtitle: (paymentOptionsQuery.error as Error).message,
        timeout: 6000,
      });
    }
  }, [paymentOptionsQuery.isError, paymentOptionsQuery.error, display]);

  const agreementPayments = useMemo(
    () => agreementPaymentsQuery.data ?? [],
    [agreementPaymentsQuery.data],
  );

  const [draft, setDraft] = useState<PaymentDraftState>(() => buildInitialPaymentDraft());
  const [selectedPayeeId, setSelectedPayeeId] = useState<number | null>(null);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const paymentOptions = paymentOptionsQuery.data;
  const payeeCandidates = useMemo(
    () => paymentOptions?.payeeCandidates ?? [],
    [paymentOptions?.payeeCandidates],
  );

  useEffect(() => {
    setDraft(buildInitialPaymentDraft());
    setSelectedPayeeId(null);
    setValidationErrors({});
  }, [agreementId]);

  useEffect(() => {
    if (!paymentOptions) {
      return;
    }
    setDraft((current) => ({
      ...current,
      paymentTypeCode: current.paymentTypeCode || paymentOptions.paymentTypes[0]?.code || '',
      paymentTermTypeCode:
        current.paymentTermTypeCode || paymentOptions.paymentTerms[0]?.code || '',
      expenseAuthorityCode:
        current.expenseAuthorityCode || paymentOptions.expenseAuthorities[0]?.code || '',
      qualifiedReceiverCode:
        current.qualifiedReceiverCode || paymentOptions.qualifiedReceivers[0]?.code || '',
    }));
  }, [paymentOptions]);

  const handleDraftChange = useCallback(
    <K extends keyof PaymentDraftState>(key: K, value: PaymentDraftState[K]) => {
      setDraft((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const handleSelectPayee = useCallback((payeeId: number) => {
    setSelectedPayeeId(payeeId);
  }, []);

  const handleClearPayee = useCallback(() => {
    setSelectedPayeeId(null);
  }, []);

  const handleOpenPaymentModal = useCallback(() => {
    setValidationErrors({});
    setPaymentModalOpen(true);
  }, []);

  const handleClosePaymentModal = useCallback(() => {
    setPaymentModalOpen(false);
    setValidationErrors({});
  }, []);

  const handleSavePayment = useCallback(() => {
    if (!agreementId) {
      return;
    }

    const errors = validatePaymentDraft(draft, selectedPayeeId);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    const amount = parseCurrencyInput(draft.amount)!;

    createPaymentMutation.mutate(
      {
        requestDate: draft.requestDate,
        amount,
        paymentTypeCode: draft.paymentTypeCode || null,
        paymentTermTypeCode: draft.paymentTermTypeCode || null,
        expenseAuthorityCode: draft.expenseAuthorityCode || null,
        qualifiedReceiverCode: draft.qualifiedReceiverCode || null,
        casClient: draft.casClient || null,
        casResponsibilityCentre: draft.casResponsibilityCentre || null,
        casServiceLine: draft.casServiceLine || null,
        casStob: draft.casStob || null,
        casProjectNumber: draft.casProjectNumber || null,
        processingInstructions: draft.processingInstructions || null,
        applyGst: draft.applyGst,
        propertyContactIds: [selectedPayeeId!],
      },
      {
        onSuccess: () => {
          setPaymentModalOpen(false);
          setDraft(buildInitialPaymentDraft());
          setSelectedPayeeId(null);
          setValidationErrors({});
          display({ kind: 'success', title: 'Payment created.', timeout: 4000 });
        },
        onError: (error) => {
          display({
            kind: 'error',
            title: 'Payment creation failed',
            subtitle: error.message ?? 'Failed to create payment.',
            timeout: 6000,
          });
        },
      },
    );
  }, [agreementId, draft, selectedPayeeId, createPaymentMutation, display]);

  const handleViewInvoice = useCallback(
    (paymentId: number) => {
      invoiceReportMutation.mutate(
        { paymentId, format: 'pdf' },
        {
          onSuccess: (response) => {
            openBlobInNewTab(response.blob);
          },
        },
      );
    },
    [invoiceReportMutation],
  );

  const amountValue = useMemo(() => parseCurrencyInput(draft.amount), [draft.amount]);
  const gstPercent = paymentOptions?.taxRate?.percent ?? null;
  const gstAmount = useMemo(() => {
    if (
      !draft.applyGst ||
      amountValue === null ||
      gstPercent === null ||
      Number.isNaN(gstPercent)
    ) {
      return 0;
    }
    return (amountValue * gstPercent) / 100;
  }, [amountValue, draft.applyGst, gstPercent]);
  const totalAmount = useMemo(() => {
    if (amountValue === null) {
      return 0;
    }
    return draft.applyGst ? amountValue + gstAmount : amountValue;
  }, [amountValue, draft.applyGst, gstAmount]);

  const selectedPayee = useMemo(
    () =>
      selectedPayeeId
        ? payeeCandidates.find((candidate) => candidate.propertyContactId === selectedPayeeId)
        : null,
    [payeeCandidates, selectedPayeeId],
  );

  if (!agreementId) {
    return <p className="field-empty">Select an agreement to view its payments.</p>;
  }

  if (agreementPaymentsQuery.isPending) {
    return <SkeletonText width="60%" lineCount={4} />;
  }

  if (agreementPaymentsQuery.isError) {
    return <p>Failed to load agreement payments.</p>;
  }

  return (
    <div className="agreement-payments">
      <section className="agreement-payment-card agreement-payment-card--new">
        <div className="agreement-payment-card__header">
          <div className="agreement-payment-card__title">
            <h3>Agreement payments</h3>
            <p>Create new payment requests and review the latest invoices.</p>
          </div>
          <Button
            kind="primary"
            size="md"
            renderIcon={Add}
            onClick={handleOpenPaymentModal}
            disabled={!canCreate}
          >
            New payment
          </Button>
        </div>
      </section>

      {agreementPayments.length === 0 ? (
        <InlineNotification
          kind="info"
          lowContrast
          title="There are no payments recorded for this agreement."
          hideCloseButton
        />
      ) : (
        agreementPayments.map((payment) => (
          <div className="agreement-payment-card" key={payment.id}>
            <div className="agreement-payment-card__header">
              <h3>
                Payment requested {formatDate(payment.requestDate)} &middot;{' '}
                {formatCurrency(payment.totalAmount)}
              </h3>
              <Button
                kind="ghost"
                size="sm"
                renderIcon={View}
                iconDescription="View invoice PDF"
                onClick={() => handleViewInvoice(payment.id)}
                disabled={invoiceReportMutation.isPending}
              >
                View invoice
              </Button>
            </div>
            <FieldList
              fields={buildPaymentFields(payment)}
              keyPrefix={`agreement-payment-${payment.id}`}
            />
            <h4>Payees</h4>
            {payment.payees && payment.payees.length > 0 ? (
              <Table className="project-table agreement-payees-table">
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>PID</TableHeader>
                    <TableHeader>Title Number</TableHeader>
                    <TableHeader>Phone</TableHeader>
                    <TableHeader>Email</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payment.payees.map((payee) => (
                    <TableRow key={payee.id}>
                      {buildPayeeRow(payee).map((value, index) => (
                        <TableCell key={`${payee.id}-${index}`}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="field-empty">No payees recorded for this payment.</p>
            )}
          </div>
        ))
      )}

      <Modal
        open={isPaymentModalOpen}
        modalHeading="New payment"
        passiveModal
        onRequestClose={handleClosePaymentModal}
        size="lg"
        className="add-contact-modal"
      >
        <div className="agreement-payment-modal">
          {paymentOptionsQuery.isPending && <SkeletonText width="70%" lineCount={4} />}

          {!paymentOptionsQuery.isPending && !paymentOptionsQuery.isError && (
            <>
              {payeeCandidates.length === 0 && (
                <InlineNotification
                  kind="warning"
                  lowContrast
                  hideCloseButton
                  title="A property contact is required before creating a payment"
                  subtitle="Link a property to this agreement and add at least one contact to that property."
                />
              )}
              <fieldset
                disabled={payeeCandidates.length === 0}
                className="agreement-payment-form__fieldset"
              >
                <div className="agreement-payment-form">
                  <div className="agreement-payment-form__grid">
                    <TextInput
                      id="payment-request-date"
                      type="date"
                      labelText="Request date *"
                      value={draft.requestDate}
                      onChange={(event) => handleDraftChange('requestDate', event.target.value)}
                      invalid={Boolean(validationErrors.requestDate)}
                      invalidText={validationErrors.requestDate}
                    />
                    <NumberInput
                      id="payment-amount"
                      label="Payment amount *"
                      value={draft.amount}
                      onChange={(_, { value }) =>
                        handleDraftChange('amount', value?.toString() ?? '')
                      }
                      placeholder="0.00"
                      step={0.01}
                      min={0}
                      invalid={Boolean(validationErrors.amount)}
                      invalidText={validationErrors.amount}
                      allowEmpty
                      hideSteppers
                      onKeyDown={(event) => {
                        if (['e', 'E', '+', '-'].includes(event.key)) {
                          event.preventDefault();
                        }
                      }}
                    />
                    <div className="agreement-payment-form__checkbox">
                      <Checkbox
                        id="payment-apply-gst"
                        labelText={
                          gstPercent !== null ? `Apply GST (${gstPercent}% currently)` : 'Apply GST'
                        }
                        hideLabel={false}
                        checked={draft.applyGst}
                        onChange={(
                          _: React.ChangeEvent<HTMLInputElement>,
                          { checked }: { checked: boolean },
                        ) => handleDraftChange('applyGst', checked)}
                      />
                    </div>
                    <Select
                      id="payment-type"
                      labelText="Payment type *"
                      value={draft.paymentTypeCode}
                      onChange={(event) => handleDraftChange('paymentTypeCode', event.target.value)}
                      invalid={Boolean(validationErrors.paymentTypeCode)}
                      invalidText={validationErrors.paymentTypeCode}
                    >
                      <SelectItem value="" text="Select a payment type" />
                      {paymentOptions?.paymentTypes.map((option) => (
                        <SelectItem
                          key={option.code}
                          value={option.code}
                          text={option.name ?? option.code}
                        />
                      ))}
                    </Select>
                    <Select
                      id="payment-term"
                      labelText="Payment term *"
                      value={draft.paymentTermTypeCode}
                      onChange={(event) =>
                        handleDraftChange('paymentTermTypeCode', event.target.value)
                      }
                      invalid={Boolean(validationErrors.paymentTermTypeCode)}
                      invalidText={validationErrors.paymentTermTypeCode}
                    >
                      <SelectItem value="" text="Select a payment term" />
                      {paymentOptions?.paymentTerms.map((option) => (
                        <SelectItem
                          key={option.code}
                          value={option.code}
                          text={option.name ?? option.code}
                        />
                      ))}
                    </Select>
                    <Select
                      id="payment-expense-authority"
                      labelText="Expense authority"
                      value={draft.expenseAuthorityCode}
                      onChange={(event) =>
                        handleDraftChange('expenseAuthorityCode', event.target.value)
                      }
                    >
                      <SelectItem value="" text="Select an expense authority" />
                      {paymentOptions?.expenseAuthorities.map((option) => (
                        <SelectItem
                          key={option.code}
                          value={option.code}
                          text={option.name ?? option.code}
                        />
                      ))}
                    </Select>
                    <Select
                      id="payment-qualified-receiver"
                      labelText="Qualified receiver"
                      value={draft.qualifiedReceiverCode}
                      onChange={(event) =>
                        handleDraftChange('qualifiedReceiverCode', event.target.value)
                      }
                    >
                      <SelectItem value="" text="Select a qualified receiver" />
                      {paymentOptions?.qualifiedReceivers.map((option) => (
                        <SelectItem
                          key={option.code}
                          value={option.code}
                          text={option.name ?? option.code}
                        />
                      ))}
                    </Select>
                    <TextInput
                      id="payment-cas-client"
                      labelText="CAS client *"
                      value={draft.casClient}
                      onChange={(event) => handleDraftChange('casClient', event.target.value)}
                      invalid={Boolean(validationErrors.casClient)}
                      invalidText={validationErrors.casClient}
                    />
                    <TextInput
                      id="payment-cas-rc"
                      labelText="CAS responsibility centre *"
                      value={draft.casResponsibilityCentre}
                      onChange={(event) =>
                        handleDraftChange('casResponsibilityCentre', event.target.value)
                      }
                      invalid={Boolean(validationErrors.casResponsibilityCentre)}
                      invalidText={validationErrors.casResponsibilityCentre}
                    />
                    <TextInput
                      id="payment-cas-sl"
                      labelText="CAS service line *"
                      value={draft.casServiceLine}
                      onChange={(event) => handleDraftChange('casServiceLine', event.target.value)}
                      invalid={Boolean(validationErrors.casServiceLine)}
                      invalidText={validationErrors.casServiceLine}
                    />
                    <TextInput
                      id="payment-cas-stob"
                      labelText="CAS STOB *"
                      value={draft.casStob}
                      onChange={(event) => handleDraftChange('casStob', event.target.value)}
                      invalid={Boolean(validationErrors.casStob)}
                      invalidText={validationErrors.casStob}
                    />
                    <NumberInput
                      id="payment-cas-project"
                      label="CAS project number *"
                      value={draft.casProjectNumber}
                      onChange={(_, { value }) =>
                        handleDraftChange('casProjectNumber', value?.toString() ?? '')
                      }
                      min={0}
                      invalid={Boolean(validationErrors.casProjectNumber)}
                      invalidText={validationErrors.casProjectNumber}
                      allowEmpty
                      hideSteppers
                      onKeyDown={(event) => {
                        if (['e', 'E', '+', '-', '.'].includes(event.key)) {
                          event.preventDefault();
                        }
                      }}
                    />
                  </div>

                  <TextArea
                    id="payment-processing-instructions"
                    labelText="Processing instructions"
                    value={draft.processingInstructions}
                    onChange={(event) =>
                      handleDraftChange('processingInstructions', event.target.value)
                    }
                    rows={4}
                  />

                  <div className="agreement-payment-form__totals">
                    <div>
                      <p>GST amount</p>
                      <strong>{formatCurrency(draft.applyGst ? gstAmount : 0)}</strong>
                    </div>
                    <div>
                      <p>Total invoice</p>
                      <strong>{formatCurrency(totalAmount)}</strong>
                    </div>
                  </div>
                </div>

                <div className="agreement-payee-selector">
                  <div className="agreement-payee-selector__header">
                    <h4>Select payee *</h4>
                    <div className="agreement-payee-selector__actions">
                      <Button
                        kind="ghost"
                        size="sm"
                        onClick={handleClearPayee}
                        disabled={selectedPayeeId === null}
                      >
                        Clear selection
                      </Button>
                    </div>
                  </div>

                  {validationErrors.payee && (
                    <p
                      className="form-error"
                      style={{
                        color: 'var(--cds-text-error, #da1e28)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {validationErrors.payee}
                    </p>
                  )}

                  {payeeCandidates.length === 0 ? (
                    <p className="field-empty">
                      No property contacts are available to use as payees for this agreement.
                    </p>
                  ) : (
                    <RadioButtonGroup
                      name="payee-selection"
                      valueSelected={selectedPayeeId?.toString() ?? ''}
                      onChange={(value) => handleSelectPayee(Number(value))}
                      orientation="vertical"
                    >
                      <Table className="project-table agreement-payee-table">
                        <TableHead>
                          <TableRow>
                            <TableHeader scope="col">Select</TableHeader>
                            <TableHeader scope="col">Name</TableHeader>
                            <TableHeader scope="col">Type</TableHeader>
                            <TableHeader scope="col">PID</TableHeader>
                            <TableHeader scope="col">Title Number</TableHeader>
                            <TableHeader scope="col">Phone</TableHeader>
                            <TableHeader scope="col">Email</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payeeCandidates.map((candidate) => {
                            const isSelected = selectedPayeeId === candidate.propertyContactId;
                            return (
                              <TableRow
                                key={candidate.propertyContactId}
                                className={
                                  isSelected
                                    ? 'agreement-payee-row agreement-payee-row--selected'
                                    : 'agreement-payee-row'
                                }
                                onClick={() => handleSelectPayee(candidate.propertyContactId)}
                              >
                                <TableCell>
                                  <RadioButton
                                    id={`payee-${candidate.propertyContactId}`}
                                    labelText=""
                                    value={candidate.propertyContactId.toString()}
                                    checked={isSelected}
                                  />
                                </TableCell>
                                <TableCell>
                                  {displayValue(getPayeeDisplayName(candidate))}
                                </TableCell>
                                <TableCell>
                                  {displayValue(
                                    candidate.contactTypeLabel ?? candidate.contactTypeCode,
                                  )}
                                </TableCell>
                                <TableCell>{displayValue(candidate.parcelIdentifier)}</TableCell>
                                <TableCell>{displayValue(candidate.titleNumber)}</TableCell>
                                <TableCell>{displayValue(candidate.phone)}</TableCell>
                                <TableCell>{displayValue(candidate.email)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </RadioButtonGroup>
                  )}

                  {selectedPayee && (
                    <div className="agreement-payee-selector__summary">
                      <h5>Selected payee</h5>
                      <ul>
                        <li>
                          <strong>{getPayeeDisplayName(selectedPayee) || 'Unnamed payee'}</strong>
                          <span>
                            {displayValue(
                              selectedPayee.contactTypeLabel ?? selectedPayee.contactTypeCode,
                            )}{' '}
                            {displayValue(selectedPayee.parcelIdentifier)}
                          </span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {createPaymentMutation.isPending && (
                  <InlineNotification
                    kind="info"
                    lowContrast
                    hideCloseButton
                    title="Creating payment..."
                    subtitle="Please wait while the payment is being saved."
                  />
                )}
              </fieldset>
            </>
          )}
        </div>

        <div className="add-contact-modal__actions">
          <Button kind="secondary" size="md" onClick={handleClosePaymentModal}>
            Cancel
          </Button>
          <Button
            kind="primary"
            size="md"
            disabled={createPaymentMutation.isPending || payeeCandidates.length === 0}
            onClick={handleSavePayment}
          >
            Save payment
          </Button>
        </div>
      </Modal>
    </div>
  );
};
