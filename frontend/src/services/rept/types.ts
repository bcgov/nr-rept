export interface CodeName {
  code: string;
  name: string | null;
}

export interface CodeNameWithParent extends CodeName {
  parentCode?: string | null;
}

export interface ReptUserSummary {
  userId: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  idirGuid?: string | null;
  idirUserGuid?: string | null;
}

export interface ReptUserSearchResponse {
  results: ReptUserSummary[];
  total: number;
  page: number;
  size: number;
}

export interface ReptUserSearchParams {
  userId?: string;
  firstName?: string;
  lastName?: string;
  page?: number;
  size?: number;
}

export interface ReptProjectDetail {
  id: number;
  filePrefix?: string | null;
  projectNumber?: number | null;
  fileSuffix?: string | null;
  projectName?: string | null;
  statusCode?: string | null;
  statusLabel?: string | null;
  priorityCode?: string | null;
  priorityLabel?: string | null;
  regionNumber?: number | null;
  regionLabel?: string | null;
  districtNumber?: number | null;
  districtLabel?: string | null;
  bctsOfficeNumber?: number | null;
  bctsOfficeLabel?: string | null;
  requestDate?: string | null;
  requestingSourceId?: string | null;
  requestingSourceLabel?: string | null;
  requestorUserId?: string | null;
  projectManagerUserId?: string | null;
  projectManagerName?: string | null;
  projectManagerAssignedDate?: string | null;
  projectHistory?: string | null;
  relatedFiles?: string | null;
  relatedRegistrations?: string | null;
  projectComment?: string | null;
  projectFile?: string | null;
  revisionCount?: number | null;
}

export interface ReptProjectSearchResult {
  id: number;
  filePrefix?: string | null;
  projectNumber?: number | null;
  fileSuffix?: string | null;
  projectName?: string | null;
  regionNumber?: number | null;
  regionLabel?: string | null;
  districtNumber?: number | null;
  districtLabel?: string | null;
  statusCode?: string | null;
  statusLabel?: string | null;
}

export interface ReptProjectSearchResponse {
  results: ReptProjectSearchResult[];
  total: number;
  page: number;
  size: number;
}

export interface ReptProjectSearchOptions {
  regions: CodeName[];
  districts: CodeNameWithParent[];
  statuses: CodeName[];
  projectManagers: CodeName[];
  filePrefixes: CodeName[];
}

export interface ReptProjectCreateOptions {
  filePrefixes: CodeName[];
  statuses: CodeName[];
  regions: CodeName[];
  districts: CodeNameWithParent[];
  bctsOffices: CodeName[];
  requestingSources: CodeName[];
  priorities: CodeName[];
}

export interface ReptProjectCreateRequest {
  filePrefix: string;
  fileSuffix: string;
  projectName?: string | null;
  regionNumber?: string | null;
  districtNumber?: string | null;
  bctsOfficeNumber?: string | null;
  requestingSourceId?: string | null;
  requestorUserId?: string | null;
  statusCode: string;
  requestDate: string;
}

export interface ReptProjectCreateResult {
  id: number;
  revisionCount?: number | null;
  projectNumber?: number | null;
  filePrefix?: string | null;
  fileSuffix?: string | null;
  projectName?: string | null;
  statusCode?: string | null;
  priorityCode?: string | null;
  requestingSourceId?: string | null;
  requestorUserId?: string | null;
  requestDate?: string | null;
  projectFile?: string | null;
}

export interface ReptProjectSearchParams {
  projectFile?: string;
  projectName?: string;
  region?: string;
  district?: string;
  projectManager?: string;
  status?: string;
  filePrefix?: string;
  fileSuffix?: string;
  page?: number;
  size?: number;
}

export interface ReptAcquisitionRequest {
  id?: number | null;
  projectId: number;
  acquisitionTypeCode?: string | null;
  acquisitionTypeLabel?: string | null;
  fsrTypeCode?: string | null;
  fsrTypeLabel?: string | null;
  roadUseTypeCode?: string | null;
  roadUseTypeLabel?: string | null;
  receivedDate?: string | null;
  targetCompletionDate?: string | null;
  locationPlan?: string | null;
  justification?: string | null;
  propertiesDescription?: string | null;
  timberVolumeAccessed?: number | null;
  annualVolume?: number | null;
  availableFunds?: number | null;
  responsibilityCentre?: string | null;
  fundingCode?: string | null;
  fundingLabel?: string | null;
  serviceLine?: string | null;
  stob?: string | null;
  requestorUserId?: string | null;
  requestorName?: string | null;
  revisionCount?: number | null;
}

export interface ReptPropertySummary {
  id: number;
  titleNumber?: string | null;
  parcelIdentifier?: string | null;
  legalDescription?: string | null;
  parcelAddress?: string | null;
  city?: string | null;
  acquisitionCode?: string | null;
  acquisitionLabel?: string | null;
  landTitleOfficeCode?: string | null;
  landTitleOfficeLabel?: string | null;
  parcelArea?: number | null;
  projectArea?: number | null;
  assessedValue?: number | null;
  expropriationRecommended?: boolean | null;
}

export interface ReptPropertyDetail {
  id: number;
  projectId: number;
  titleNumber?: string | null;
  parcelIdentifier?: string | null;
  legalDescription?: string | null;
  parcelAddress?: string | null;
  city?: string | null;
  parcelArea?: number | null;
  projectArea?: number | null;
  assessedValue?: number | null;
  acquisitionCode?: string | null;
  acquisitionLabel?: string | null;
  landTitleOfficeCode?: string | null;
  landTitleOfficeLabel?: string | null;
  electoralDistrictCode?: string | null;
  electoralDistrictLabel?: string | null;
  orgUnitNumber?: number | null;
  orgUnitCode?: string | null;
  orgUnitName?: string | null;
  expropriationRecommended?: boolean | null;
  revisionCount?: number | null;
}

export interface ReptPropertyMilestones {
  ownerContactDate?: string | null;
  internalAppraisalDate?: string | null;
  roadValueRequestedDate?: string | null;
  roadValueReceivedDate?: string | null;
  fundingRequestedDate?: string | null;
  fundingApprovedDate?: string | null;
  surveyRequestedDate?: string | null;
  surveyReceivedDate?: string | null;
  assessmentComment?: string | null;
  feeAppraisalRequestedDate?: string | null;
  feeAppraisalReceivedDate?: string | null;
  offerDate?: string | null;
  negotiationComment?: string | null;
  offerAcceptedDate?: string | null;
  completionDate?: string | null;
  acquisitionComment?: string | null;
  expropriationRecommended?: boolean | null;
  revisionCount?: number | null;
}

export interface ReptPropertyRegistration {
  propertyId: number;
  ltoPlanNumber?: string | null;
  ltoDocumentNumber?: string | null;
  surveyTubeNumber?: string | null;
  registrationDate?: string | null;
  revisionCount?: number | null;
}

export interface ReptPropertyExpropriation {
  propertyId: number;
  executiveApprovalDate?: string | null;
  consensualServiceDate?: string | null;
  noticeAdvancePaymentDate?: string | null;
  vestingDate?: string | null;
  revisionCount?: number | null;
}

// Property Options for dropdowns
export interface ReptPropertyOptions {
  acquisitionTypes: ReptCodeOption[];
  landTitleOffices: ReptCodeOption[];
  electoralDistricts: ReptCodeOption[];
  forestDistricts: ReptOrgUnitOption[];
}

export interface ReptCodeOption {
  code: string;
  label: string;
}

export interface ReptOrgUnitOption {
  orgUnitNo: number;
  code?: string | null;
  name?: string | null;
}

// Property CRUD Request Types
export interface ReptPropertyCreateRequest {
  projectId: number;
  titleNumber?: string | null;
  parcelIdentifier?: string | null;
  legalDescription?: string | null;
  parcelAddress?: string | null;
  city?: string | null;
  parcelArea?: number | null;
  projectArea?: number | null;
  assessedValue?: number | null;
  acquisitionCode?: string | null;
  landTitleOfficeCode?: string | null;
  electoralDistrictCode?: string | null;
  orgUnitNumber?: number | null;
  expropriationRecommended?: boolean | null;
}

export interface ReptPropertyUpdateRequest {
  revisionCount: number;
  titleNumber?: string | null;
  parcelIdentifier?: string | null;
  legalDescription?: string | null;
  parcelAddress?: string | null;
  city?: string | null;
  parcelArea?: number | null;
  projectArea?: number | null;
  assessedValue?: number | null;
  acquisitionCode?: string | null;
  landTitleOfficeCode?: string | null;
  electoralDistrictCode?: string | null;
  orgUnitNumber?: number | null;
  expropriationRecommended?: boolean | null;
}

export interface ReptPropertyMilestoneUpdateRequest {
  revisionCount: number;
  ownerContactDate?: string | null;
  internalAppraisalDate?: string | null;
  roadValueRequestedDate?: string | null;
  roadValueReceivedDate?: string | null;
  fundingRequestedDate?: string | null;
  fundingApprovedDate?: string | null;
  surveyRequestedDate?: string | null;
  surveyReceivedDate?: string | null;
  assessmentComment?: string | null;
  feeAppraisalRequestedDate?: string | null;
  feeAppraisalReceivedDate?: string | null;
  offerDate?: string | null;
  negotiationComment?: string | null;
  offerAcceptedDate?: string | null;
  completionDate?: string | null;
  acquisitionComment?: string | null;
  expropriationRecommended?: boolean | null;
}

export interface ReptPropertyRegistrationUpsertRequest {
  revisionCount?: number | null;
  ltoPlanNumber?: string | null;
  ltoDocumentNumber?: string | null;
  surveyTubeNumber?: string | null;
  registrationDate?: string | null;
}

export interface ReptPropertyExpropriationUpsertRequest {
  revisionCount?: number | null;
  executiveApprovalDate?: string | null;
  consensualServiceDate?: string | null;
  noticeAdvancePaymentDate?: string | null;
  vestingDate?: string | null;
}

// Property mutation result types
export interface ReptPropertyInsertResult {
  id: number;
  revisionCount: number;
}

export interface ReptPropertyUpdateResult {
  id: number;
  revisionCount: number;
}

export interface ReptRegistrationResult {
  propertyId: number;
  revisionCount: number;
}

export interface ReptExpropriationResult {
  propertyId: number;
  revisionCount: number;
}

export interface ReptContact {
  associationId: number;
  contactId: number;
  contactTypeCode?: string | null;
  contactTypeLabel?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  provinceState?: string | null;
  country?: string | null;
  postalZipCode?: string | null;
}

export interface ReptContactAssociation {
  associationId: number;
  associationType: 'PROJECT' | 'PROPERTY';
  propertyId?: number | null;
  propertyParcelIdentifier?: string | null;
  propertyTitleNumber?: string | null;
  contact: ReptContact;
}

export interface ReptContactPage {
  results: ReptContactAssociation[];
  total: number;
}

export interface ReptAgreement {
  id: number;
  projectId: number;
  agreementType?: 'ACQUISITION' | 'DISPOSITION' | null;
  agreementCode?: string | null;
  agreementLabel?: string | null;
  acquisitionAgreementCode?: string | null;
  acquisitionAgreementLabel?: string | null;
  dispositionAgreementCode?: string | null;
  dispositionAgreementLabel?: string | null;
  active?: boolean | null;
  paymentTerms?: string | null;
  agreementTerm?: number | null;
  expiryDate?: string | null;
  bringForwardDate?: string | null;
  anniversaryDate?: string | null;
  renegotiationDate?: string | null;
  lessorsFile?: string | null;
  commitmentDescription?: string | null;
  coUserId?: number | null;
  coUserLabel?: string | null;
  revisionCount?: number | null;
}

export interface ReptAgreementUpdateRequest {
  revisionCount: number;
  agreementType: 'ACQUISITION' | 'DISPOSITION';
  agreementCode: string;
  active: boolean;
  paymentTerms?: string | null;
  agreementTerm?: number | null;
  expiryDate?: string | null;
  bringForwardDate?: string | null;
  anniversaryDate?: string | null;
  renegotiationDate?: string | null;
  lessorsFile?: string | null;
  commitmentDescription?: string | null;
  coUserId?: number | null;
}

export interface ReptAgreementProperty {
  associationId: number;
  propertyId: number;
  parcelIdentifier?: string | null;
  titleNumber?: string | null;
  legalDescription?: string | null;
  acquisitionCode?: string | null;
  acquisitionLabel?: string | null;
  landTitleOfficeCode?: string | null;
  landTitleOfficeLabel?: string | null;
}

export interface ReptAgreementPropertyUpdateRequest {
  propertyIds: number[];
}

export interface ReptAgreementPayee {
  id: number;
  paymentId: number;
  propertyContactId: number;
  propertyId: number;
  parcelIdentifier?: string | null;
  titleNumber?: string | null;
  contactId: number;
  contactTypeCode?: string | null;
  contactTypeLabel?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  provinceState?: string | null;
  country?: string | null;
  postalZipCode?: string | null;
}

export interface ReptAgreementPayeeCandidate {
  propertyContactId: number;
  propertyId: number;
  parcelIdentifier?: string | null;
  titleNumber?: string | null;
  contactId: number;
  contactTypeCode?: string | null;
  contactTypeLabel?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  provinceState?: string | null;
  country?: string | null;
  postalZipCode?: string | null;
}

export interface ReptAgreementPaymentTaxRate {
  id?: number | null;
  percent?: number | null;
}

export interface ReptAgreementPaymentOptions {
  payeeCandidates: ReptAgreementPayeeCandidate[];
  paymentTypes: CodeName[];
  paymentTerms: CodeName[];
  expenseAuthorities: CodeName[];
  qualifiedReceivers: CodeName[];
  taxRate?: ReptAgreementPaymentTaxRate | null;
}

export interface ReptAgreementPayment {
  id: number;
  agreementId: number;
  rescinded?: boolean | null;
  requestDate?: string | null;
  amount?: number | null;
  gstAmount?: number | null;
  totalAmount?: number | null;
  paymentTermTypeCode?: string | null;
  paymentTermTypeLabel?: string | null;
  paymentTypeCode?: string | null;
  paymentTypeLabel?: string | null;
  processingInstructions?: string | null;
  casClient?: string | null;
  casResponsibilityCentre?: string | null;
  casServiceLine?: string | null;
  casStob?: string | null;
  casProjectNumber?: string | null;
  taxRateId?: number | null;
  taxRatePercent?: number | null;
  expenseAuthorityCode?: string | null;
  expenseAuthorityLabel?: string | null;
  qualifiedReceiverCode?: string | null;
  qualifiedReceiverLabel?: string | null;
  revisionCount?: number | null;
  payees: ReptAgreementPayee[];
}

export interface ReptAgreementPaymentCreateRequest {
  requestDate: string;
  amount: number;
  paymentTypeCode?: string | null;
  paymentTermTypeCode?: string | null;
  expenseAuthorityCode?: string | null;
  qualifiedReceiverCode?: string | null;
  casClient?: string | null;
  casResponsibilityCentre?: string | null;
  casServiceLine?: string | null;
  casStob?: string | null;
  casProjectNumber?: string | null;
  processingInstructions?: string | null;
  applyGst?: boolean | null;
  propertyContactIds: number[];
}

// Project Update Types
export interface ReptProjectUpdateOptions {
  statuses: CodeName[];
  priorities: CodeName[];
  regions: CodeName[];
  districts: CodeNameWithParent[];
  bctsOffices: CodeName[];
  requestingSources: CodeName[];
  projectManagers: CodeName[];
}

export interface ReptProjectUpdateRequest {
  revisionCount: number;
  projectName: string | null;
  statusCode: string | null;
  priorityCode?: string | null;
  regionNumber?: number | null;
  districtNumber?: number | null;
  bctsOfficeNumber?: number | null;
  requestDate: string | null;
  requestorUserId?: string | null;
  requestingSourceId?: string | null;
  projectManagerName?: string | null;
  projectManagerUserId?: string | null;
  projectManagerAssignedDate?: string | null;
  projectHistory?: string | null;
  relatedFiles?: string | null;
  relatedRegistrations?: string | null;
  projectComment?: string | null;
}

// Acquisition Request Types
export interface ReptAcquisitionRequestOptions {
  acquisitionTypes: CodeName[];
  fsrTypes: CodeName[];
  roadUseTypes: CodeName[];
  fundingCodes: CodeName[];
}

export interface ReptAcquisitionRequestCreateRequest {
  acquisitionTypeCode: string;
  fsrTypeCode?: string | null;
  roadUseTypeCode?: string | null;
  receivedDate: string | null;
  targetCompletionDate: string | null;
  locationPlan?: string | null;
  justification: string;
  propertiesDescription: string;
  timberVolumeAccessed: number;
  annualVolume?: number | null;
  availableFunds?: number | null;
  responsibilityCentre?: string | null;
  fundingCode?: string | null;
  serviceLine?: string | null;
  stob?: string | null;
  requestorName?: string | null;
  requestorUserId?: string | null;
}

export interface ReptAcquisitionRequestUpdateRequest {
  revisionCount: number;
  acquisitionTypeCode: string;
  fsrTypeCode?: string | null;
  roadUseTypeCode?: string | null;
  receivedDate: string | null;
  targetCompletionDate: string | null;
  locationPlan?: string | null;
  justification: string;
  propertiesDescription: string;
  timberVolumeAccessed: number;
  annualVolume?: number | null;
  availableFunds?: number | null;
  responsibilityCentre?: string | null;
  fundingCode?: string | null;
  serviceLine?: string | null;
  stob?: string | null;
  requestorName?: string | null;
  requestorUserId?: string | null;
}

// Contact Types
export interface ReptProjectContactOptions {
  contactTypes: CodeName[];
}

export interface ReptContactSearchItem {
  id: number;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ReptContactSearchResult {
  contacts: ReptContactSearchItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ReptProjectContactAddRequest {
  contactId: number;
  contactTypeCode: string;
}

// Agreement Create Types
export interface ReptAgreementCodeOption {
  code: string;
  label: string;
}

export interface ReptAgreementOptions {
  acquisitionCodes: ReptAgreementCodeOption[];
  dispositionCodes: ReptAgreementCodeOption[];
}

export interface ReptAgreementCreateRequest {
  agreementType: 'ACQUISITION' | 'DISPOSITION';
  agreementCode: string;
  active: boolean;
  paymentTerms?: string | null;
  agreementTerm?: number | null;
  expiryDate?: string | null;
  bringForwardDate?: string | null;
  anniversaryDate?: string | null;
  renegotiationDate?: string | null;
  lessorsFile?: string | null;
  commitmentDescription?: string | null;
  coUserId?: number | null;
}
