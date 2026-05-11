import type { ReptAgreement } from '@/services/rept/types';

export type AgreementFieldRules = {
  showCommitment: boolean;
  requireCommitment: boolean;
  showTerm: boolean;
  requireTerm: boolean;
  showBringForward: boolean;
  requireBringForward: boolean;
  showAnniversary: boolean;
  requireAnniversary: boolean;
  showRenegotiation: boolean;
  requireRenegotiation: boolean;
  showLessorsFile: boolean;
  showCoUser: boolean;
  requireCoUser: boolean;
};

export const defaultFieldRules: AgreementFieldRules = {
  showCommitment: false,
  requireCommitment: false,
  showTerm: false,
  requireTerm: false,
  showBringForward: false,
  requireBringForward: false,
  showAnniversary: false,
  requireAnniversary: false,
  showRenegotiation: false,
  requireRenegotiation: false,
  showLessorsFile: false,
  showCoUser: false,
  requireCoUser: false,
};

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

export const deriveFieldRules = (agreement?: ReptAgreement | null): AgreementFieldRules => {
  if (!agreement) {
    return defaultFieldRules;
  }

  const code = normalizeAgreementCode(agreement);
  if (!code) {
    return defaultFieldRules;
  }

  const isAcquisition = agreement.agreementType === 'ACQUISITION';
  const rules: AgreementFieldRules = { ...defaultFieldRules };

  const enableTermAndDates = () => {
    rules.showTerm = true;
    rules.requireTerm = true;
    rules.showBringForward = true;
    rules.requireBringForward = true;
    rules.showAnniversary = true;
    rules.requireAnniversary = true;
  };

  switch (code) {
    case 'COM':
      rules.showCommitment = true;
      rules.requireCommitment = true;
      break;
    case 'LEA':
      enableTermAndDates();
      rules.showRenegotiation = true;
      rules.requireRenegotiation = true;
      rules.showLessorsFile = true;
      break;
    case 'LOO':
    case 'ROW':
    case 'SLS':
      enableTermAndDates();
      rules.showRenegotiation = true;
      rules.requireRenegotiation = true;
      break;
    case 'COU':
      if (!isAcquisition) {
        enableTermAndDates();
        rules.showCoUser = true;
        rules.requireCoUser = true;
      }
      break;
    default:
      break;
  }

  return rules;
};
