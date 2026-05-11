import type { ReptPropertyOptions } from '@/services/rept/types';

// Form state types
export type PropertyDetailsFormState = {
  titleNumber: string;
  parcelIdentifier: string;
  legalDescription: string;
  parcelAddress: string;
  city: string;
  parcelArea: string;
  projectArea: string;
  assessedValue: string;
  acquisitionCode: string;
  landTitleOfficeCode: string;
  electoralDistrictCode: string;
  orgUnitNumber: string;
  expropriationRecommended: boolean;
};

export type PropertyMilestonesFormState = {
  ownerContactDate: string;
  internalAppraisalDate: string;
  roadValueRequestedDate: string;
  roadValueReceivedDate: string;
  fundingRequestedDate: string;
  fundingApprovedDate: string;
  surveyRequestedDate: string;
  surveyReceivedDate: string;
  feeAppraisalRequestedDate: string;
  feeAppraisalReceivedDate: string;
  offerDate: string;
  offerAcceptedDate: string;
  completionDate: string;
  assessmentComment: string;
  negotiationComment: string;
  acquisitionComment: string;
  expropriationRecommended: boolean;
};

export type PropertyRegistrationFormState = {
  ltoPlanNumber: string;
  ltoDocumentNumber: string;
  surveyTubeNumber: string;
  registrationDate: string;
};

export type PropertyExpropriationFormState = {
  executiveApprovalDate: string;
  consensualServiceDate: string;
  noticeAdvancePaymentDate: string;
  vestingDate: string;
};

export type StatusMessage = {
  text: string;
  kind: 'success' | 'warning';
} | null;

// Props types for edit form components
export type PropertyDetailsEditFormProps = {
  formState: PropertyDetailsFormState;
  onChange: <K extends keyof PropertyDetailsFormState>(
    key: K,
    value: PropertyDetailsFormState[K],
  ) => void;
  options?: ReptPropertyOptions | null;
  validationErrors?: Record<string, string>;
};

export type PropertyMilestonesEditFormProps = {
  formState: PropertyMilestonesFormState;
  onChange: <K extends keyof PropertyMilestonesFormState>(
    key: K,
    value: PropertyMilestonesFormState[K],
  ) => void;
};

export type PropertyRegistrationEditFormProps = {
  formState: PropertyRegistrationFormState;
  onChange: <K extends keyof PropertyRegistrationFormState>(
    key: K,
    value: PropertyRegistrationFormState[K],
  ) => void;
};

export type PropertyExpropriationEditFormProps = {
  formState: PropertyExpropriationFormState;
  onChange: <K extends keyof PropertyExpropriationFormState>(
    key: K,
    value: PropertyExpropriationFormState[K],
  ) => void;
  validationErrors?: Record<string, string>;
};
