import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  getAcquisitionRequest,
  getProjectCreateOptions,
  getProjectFileSuffixes,
  getProjectSearchOptions,
  getProjectContacts,
  getProjectDetail,
  createProject,
  getPropertyContacts,
  getPropertyDetail,
  getPropertyExpropriation,
  getPropertyMilestones,
  getPropertyRegistration,
  getPropertySummaries,
  getProjectAgreements,
  getProjectAgreement,
  getAgreementProperties,
  getAgreementPayments,
  getAgreementPaymentOptions,
  updateAgreementProperties,
  updateAgreement,
  createAgreementPayment,
  searchProjects,
  searchUsers,
  getProjectUpdateOptions,
  updateProject,
  getAcquisitionRequestOptions,
  createAcquisitionRequest,
  updateAcquisitionRequest,
  getProjectContactOptions,
  searchContacts,
  addContactToProject,
  removeContactFromProject,
  addContactToProperty,
  removeContactFromProperty,
  // Property CRUD
  createProperty,
  updateProperty,
  updatePropertyMilestones,
  deleteProperty,
  getPropertyOptions,
  updatePropertyRegistration,
  deletePropertyRegistration,
  updatePropertyExpropriation,
  deletePropertyExpropriation,
  // Agreement Create
  getAgreementCreateOptions,
  createAgreement,
} from './api';

import type {
  ReptAcquisitionRequest,
  ReptAcquisitionRequestCreateRequest,
  ReptAcquisitionRequestOptions,
  ReptAcquisitionRequestUpdateRequest,
  ReptProjectSearchOptions,
  ReptProjectSearchParams,
  ReptProjectSearchResponse,
  ReptContact,
  ReptContactPage,
  ReptContactSearchResult,
  ReptProjectDetail,
  ReptProjectCreateOptions,
  ReptProjectCreateRequest,
  ReptProjectCreateResult,
  ReptProjectUpdateOptions,
  ReptProjectUpdateRequest,
  ReptProjectContactOptions,
  ReptProjectContactAddRequest,
  ReptPropertyDetail,
  ReptPropertyExpropriation,
  ReptPropertyMilestones,
  ReptPropertyRegistration,
  ReptPropertySummary,
  CodeName,
  ReptUserSearchParams,
  ReptUserSearchResponse,
  ReptAgreement,
  ReptAgreementProperty,
  ReptAgreementPropertyUpdateRequest,
  ReptAgreementPayment,
  ReptAgreementPaymentCreateRequest,
  ReptAgreementPaymentOptions,
  ReptAgreementUpdateRequest,
  ReptAgreementOptions,
  ReptAgreementCreateRequest,
  // Property CRUD types
  ReptPropertyOptions,
  ReptPropertyCreateRequest,
  ReptPropertyInsertResult,
  ReptPropertyUpdateRequest,
  ReptPropertyUpdateResult,
  ReptPropertyMilestoneUpdateRequest,
  ReptPropertyRegistrationUpsertRequest,
  ReptPropertyExpropriationUpsertRequest,
  ReptRegistrationResult,
  ReptExpropriationResult,
} from './types';

const reptKeys = {
  project: (projectId?: string) => ['rept', 'project', projectId] as const,
  projectUpdateOptions: (projectId?: string) =>
    ['rept', 'project', projectId, 'edit', 'options'] as const,
  acquisition: (projectId?: string) => ['rept', 'project', projectId, 'acquisition'] as const,
  acquisitionOptions: (projectId?: string) =>
    ['rept', 'project', projectId, 'acquisition', 'options'] as const,
  properties: (projectId?: string) => ['rept', 'project', projectId, 'properties'] as const,
  propertyDetail: (projectId?: string, propertyId?: string) =>
    ['rept', 'project', projectId, 'property', propertyId, 'detail'] as const,
  propertyMilestones: (projectId?: string, propertyId?: string) =>
    ['rept', 'project', projectId, 'property', propertyId, 'milestones'] as const,
  propertyRegistration: (projectId?: string, propertyId?: string) =>
    ['rept', 'project', projectId, 'property', propertyId, 'registration'] as const,
  propertyExpropriation: (projectId?: string, propertyId?: string) =>
    ['rept', 'project', projectId, 'property', propertyId, 'expropriation'] as const,
  propertyContacts: (projectId?: string, propertyId?: string) =>
    ['rept', 'project', projectId, 'property', propertyId, 'contacts'] as const,
  projectContacts: (projectId?: string) => ['rept', 'project', projectId, 'contacts'] as const,
  projectContactOptions: (projectId?: string) =>
    ['rept', 'project', projectId, 'contacts', 'options'] as const,
  contactSearch: (projectId?: string, params?: { contactName?: string; companyName?: string }) =>
    ['rept', 'project', projectId, 'contacts', 'search', params] as const,
  propertyOptions: (projectId?: string) =>
    ['rept', 'project', projectId, 'properties', 'options'] as const,
  agreements: (projectId?: string) => ['rept', 'project', projectId, 'agreements'] as const,
  agreement: (projectId?: string, agreementId?: string) =>
    ['rept', 'project', projectId, 'agreement', agreementId, 'detail'] as const,
  agreementProperties: (projectId?: string, agreementId?: string) =>
    ['rept', 'project', projectId, 'agreement', agreementId, 'properties'] as const,
  agreementPayments: (projectId?: string, agreementId?: string) =>
    ['rept', 'project', projectId, 'agreement', agreementId, 'payments'] as const,
  agreementPaymentOptions: (projectId?: string, agreementId?: string) =>
    ['rept', 'project', projectId, 'agreement', agreementId, 'payments', 'options'] as const,
  agreementCreateOptions: (projectId?: string) =>
    ['rept', 'project', projectId, 'agreements', 'options'] as const,
  projectSearchOptions: () => ['rept', 'project-search', 'options'] as const,
  projectCreateOptions: () => ['rept', 'project-create', 'options'] as const,
  projectCreate: () => ['rept', 'project-create'] as const,
  projectFileSuffixes: (prefix?: string) => ['rept', 'project-search', 'suffixes', prefix] as const,
  projectSearch: (params?: ReptProjectSearchParams | null) =>
    ['rept', 'project-search', 'results', params] as const,
  userSearch: (params?: ReptUserSearchParams | null) => ['rept', 'user-search', params] as const,
};

export const useReptProject = (
  projectId?: string,
): UseQueryResult<ReptProjectDetail | null, Error> => {
  return useQuery<ReptProjectDetail | null, Error>({
    queryKey: reptKeys.project(projectId),
    queryFn: () => getProjectDetail(projectId as string),
    enabled: Boolean(projectId),
  });
};

export const useReptAcquisitionRequest = (
  projectId?: string,
): UseQueryResult<ReptAcquisitionRequest | null, Error> => {
  return useQuery<ReptAcquisitionRequest | null, Error>({
    queryKey: reptKeys.acquisition(projectId),
    queryFn: () => getAcquisitionRequest(projectId as string),
    enabled: Boolean(projectId),
  });
};

export const useReptPropertySummaries = (
  projectId?: string,
): UseQueryResult<ReptPropertySummary[], Error> => {
  return useQuery<ReptPropertySummary[], Error>({
    queryKey: reptKeys.properties(projectId),
    queryFn: () => getPropertySummaries(projectId as string),
    enabled: Boolean(projectId),
  });
};

export const useReptPropertyDetail = (
  projectId?: string,
  propertyId?: string,
): UseQueryResult<ReptPropertyDetail | null, Error> => {
  return useQuery<ReptPropertyDetail | null, Error>({
    queryKey: reptKeys.propertyDetail(projectId, propertyId),
    queryFn: () => getPropertyDetail(projectId as string, propertyId as string),
    enabled: Boolean(projectId && propertyId),
  });
};

export const useReptPropertyMilestones = (
  projectId?: string,
  propertyId?: string,
): UseQueryResult<ReptPropertyMilestones | null, Error> => {
  return useQuery<ReptPropertyMilestones | null, Error>({
    queryKey: reptKeys.propertyMilestones(projectId, propertyId),
    queryFn: () => getPropertyMilestones(projectId as string, propertyId as string),
    enabled: Boolean(projectId && propertyId),
  });
};

export const useReptPropertyRegistration = (
  projectId?: string,
  propertyId?: string,
): UseQueryResult<ReptPropertyRegistration | null, Error> => {
  return useQuery<ReptPropertyRegistration | null, Error>({
    queryKey: reptKeys.propertyRegistration(projectId, propertyId),
    queryFn: () => getPropertyRegistration(projectId as string, propertyId as string),
    enabled: Boolean(projectId && propertyId),
  });
};

export const useReptPropertyExpropriation = (
  projectId?: string,
  propertyId?: string,
): UseQueryResult<ReptPropertyExpropriation | null, Error> => {
  return useQuery<ReptPropertyExpropriation | null, Error>({
    queryKey: reptKeys.propertyExpropriation(projectId, propertyId),
    queryFn: () => getPropertyExpropriation(projectId as string, propertyId as string),
    enabled: Boolean(projectId && propertyId),
  });
};

export const useReptPropertyContacts = (
  projectId?: string,
  propertyId?: string,
): UseQueryResult<ReptContact[], Error> => {
  return useQuery<ReptContact[], Error>({
    queryKey: reptKeys.propertyContacts(projectId, propertyId),
    queryFn: () => getPropertyContacts(projectId as string, propertyId as string),
    enabled: Boolean(projectId && propertyId),
  });
};

export const useReptProjectContacts = (
  projectId?: string,
): UseQueryResult<ReptContactPage | null, Error> => {
  return useQuery<ReptContactPage | null, Error>({
    queryKey: reptKeys.projectContacts(projectId),
    queryFn: () => getProjectContacts(projectId as string),
    enabled: Boolean(projectId),
  });
};

export const useReptAgreements = (projectId?: string): UseQueryResult<ReptAgreement[], Error> => {
  return useQuery<ReptAgreement[], Error>({
    queryKey: reptKeys.agreements(projectId),
    queryFn: () => getProjectAgreements(projectId as string),
    enabled: Boolean(projectId),
  });
};

export const useReptAgreement = (
  projectId?: string,
  agreementId?: string,
): UseQueryResult<ReptAgreement | null, Error> => {
  return useQuery<ReptAgreement | null, Error>({
    queryKey: reptKeys.agreement(projectId, agreementId),
    queryFn: () => getProjectAgreement(projectId as string, agreementId as string),
    enabled: Boolean(projectId && agreementId),
  });
};

export const useReptAgreementProperties = (
  projectId?: string,
  agreementId?: string,
): UseQueryResult<ReptAgreementProperty[], Error> => {
  return useQuery<ReptAgreementProperty[], Error>({
    queryKey: reptKeys.agreementProperties(projectId, agreementId),
    queryFn: () => getAgreementProperties(projectId as string, agreementId as string),
    enabled: Boolean(projectId && agreementId),
  });
};

export const useReptAgreementPayments = (
  projectId?: string,
  agreementId?: string,
): UseQueryResult<ReptAgreementPayment[], Error> => {
  return useQuery<ReptAgreementPayment[], Error>({
    queryKey: reptKeys.agreementPayments(projectId, agreementId),
    queryFn: () => getAgreementPayments(projectId as string, agreementId as string),
    enabled: Boolean(projectId && agreementId),
  });
};

export const useReptAgreementPaymentOptions = (
  projectId?: string,
  agreementId?: string,
): UseQueryResult<ReptAgreementPaymentOptions | null, Error> => {
  return useQuery<ReptAgreementPaymentOptions | null, Error>({
    queryKey: reptKeys.agreementPaymentOptions(projectId, agreementId),
    queryFn: () => getAgreementPaymentOptions(projectId as string, agreementId as string),
    enabled: Boolean(projectId && agreementId),
  });
};

export const useUpdateAgreement = (
  projectId?: string,
  agreementId?: string,
): UseMutationResult<ReptAgreement, Error, ReptAgreementUpdateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptAgreement, Error, ReptAgreementUpdateRequest>({
    mutationKey: ['rept', 'project', projectId, 'agreement', agreementId, 'update'],
    mutationFn: (payload) => {
      if (!projectId || !agreementId) {
        return Promise.reject(new Error('Project and agreement must be specified'));
      }
      return updateAgreement(projectId, agreementId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.agreement(projectId, agreementId) });
      queryClient.invalidateQueries({ queryKey: reptKeys.agreements(projectId) });
    },
  });
};

export const useUpdateAgreementProperties = (
  projectId?: string,
  agreementId?: string,
): UseMutationResult<ReptAgreementProperty[], Error, ReptAgreementPropertyUpdateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptAgreementProperty[], Error, ReptAgreementPropertyUpdateRequest>({
    mutationKey: ['rept', 'project', projectId, 'agreement', agreementId, 'properties', 'update'],
    mutationFn: (payload) => {
      if (!projectId || !agreementId) {
        return Promise.reject(new Error('Project and agreement must be specified'));
      }
      return updateAgreementProperties(projectId, agreementId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reptKeys.agreementProperties(projectId, agreementId),
      });
      queryClient.invalidateQueries({ queryKey: reptKeys.agreement(projectId, agreementId) });
      // Linked properties drive the payee candidate list on the New Payment
      // modal. Drop the cached payment options entirely so the next read does
      // a fresh fetch — needed because the modal is unmounted while the user
      // is on the Properties subtab, so an `invalidate` alone wouldn't refetch
      // until later, and on remove the candidate set shrinks.
      queryClient.removeQueries({
        queryKey: reptKeys.agreementPaymentOptions(projectId, agreementId),
      });
    },
  });
};

export const useCreateAgreementPayment = (
  projectId?: string,
  agreementId?: string,
): UseMutationResult<ReptAgreementPayment, Error, ReptAgreementPaymentCreateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptAgreementPayment, Error, ReptAgreementPaymentCreateRequest>({
    mutationKey: ['rept', 'project', projectId, 'agreement', agreementId, 'payments', 'create'],
    mutationFn: (payload) => {
      if (!projectId || !agreementId) {
        return Promise.reject(new Error('Project and agreement must be specified'));
      }
      return createAgreementPayment(projectId, agreementId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reptKeys.agreementPayments(projectId, agreementId),
      });
      queryClient.invalidateQueries({ queryKey: reptKeys.agreement(projectId, agreementId) });
    },
  });
};

// Agreement Create Options Hook
export const useAgreementCreateOptions = (
  projectId?: string,
): UseQueryResult<ReptAgreementOptions | null, Error> => {
  return useQuery<ReptAgreementOptions | null, Error>({
    queryKey: reptKeys.agreementCreateOptions(projectId),
    queryFn: () => getAgreementCreateOptions(projectId as string),
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
  });
};

// Agreement Create Mutation Hook
export const useCreateAgreement = (
  projectId?: string,
): UseMutationResult<ReptAgreement, Error, ReptAgreementCreateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptAgreement, Error, ReptAgreementCreateRequest>({
    mutationKey: ['rept', 'project', projectId, 'agreements', 'create'],
    mutationFn: (payload) => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID must be specified'));
      }
      const result = createAgreement(projectId, payload);
      if (!result) {
        return Promise.reject(new Error('Agreement creation response was empty'));
      }
      return result as Promise<ReptAgreement>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.agreements(projectId) });
    },
  });
};

export const useReptProjectSearchOptions = (): UseQueryResult<
  ReptProjectSearchOptions | null,
  Error
> => {
  return useQuery<ReptProjectSearchOptions | null, Error>({
    queryKey: reptKeys.projectSearchOptions(),
    queryFn: () => getProjectSearchOptions(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useReptProjectCreateOptions = (): UseQueryResult<
  ReptProjectCreateOptions | null,
  Error
> => {
  return useQuery<ReptProjectCreateOptions | null, Error>({
    queryKey: reptKeys.projectCreateOptions(),
    queryFn: () => getProjectCreateOptions(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useReptProjectFileSuffixes = (prefix?: string): UseQueryResult<CodeName[], Error> => {
  const normalizedPrefix = prefix?.trim() ?? '';
  return useQuery<CodeName[], Error>({
    queryKey: reptKeys.projectFileSuffixes(normalizedPrefix),
    queryFn: () => getProjectFileSuffixes(normalizedPrefix),
    enabled: normalizedPrefix.length > 0,
    initialData: [],
  });
};

export const useReptProjectSearch = (
  params?: ReptProjectSearchParams | null,
): UseQueryResult<ReptProjectSearchResponse | null, Error> => {
  return useQuery<ReptProjectSearchResponse | null, Error>({
    queryKey: reptKeys.projectSearch(params),
    queryFn: () => searchProjects(params ?? {}),
    enabled: Boolean(params),
    placeholderData: keepPreviousData,
  });
};

export const useReptUserSearch = (
  params?: ReptUserSearchParams | null,
): UseQueryResult<ReptUserSearchResponse | null, Error> => {
  const enabled = Boolean(
    params &&
      ((params.userId && params.userId.trim().length > 0) ||
        (params.firstName && params.firstName.trim().length > 0) ||
        (params.lastName && params.lastName.trim().length > 0)),
  );

  return useQuery<ReptUserSearchResponse | null, Error>({
    queryKey: reptKeys.userSearch(params),
    queryFn: () => searchUsers(params ?? {}),
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useCreateReptProject = (): UseMutationResult<
  ReptProjectCreateResult,
  Error,
  ReptProjectCreateRequest
> => {
  const queryClient = useQueryClient();

  return useMutation<ReptProjectCreateResult, Error, ReptProjectCreateRequest>({
    mutationKey: reptKeys.projectCreate(),
    mutationFn: (payload) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.projectSearchOptions(), exact: false });
      queryClient.invalidateQueries({ queryKey: reptKeys.projectCreateOptions(), exact: false });
      queryClient.invalidateQueries({ queryKey: ['rept', 'project-search'], exact: false });
    },
  });
};

export const useReptPropertyComposite = (
  projectId?: string,
  propertyId?: string,
): {
  detail: UseQueryResult<ReptPropertyDetail | null, Error>;
  milestones: UseQueryResult<ReptPropertyMilestones | null, Error>;
  registration: UseQueryResult<ReptPropertyRegistration | null, Error>;
  expropriation: UseQueryResult<ReptPropertyExpropriation | null, Error>;
  contacts: UseQueryResult<ReptContact[], Error>;
} => {
  const detail = useReptPropertyDetail(projectId, propertyId);
  const milestones = useReptPropertyMilestones(projectId, propertyId);
  const registration = useReptPropertyRegistration(projectId, propertyId);
  const expropriation = useReptPropertyExpropriation(projectId, propertyId);
  const contacts = useReptPropertyContacts(projectId, propertyId);

  return useMemo(
    () => ({
      detail,
      milestones,
      registration,
      expropriation,
      contacts,
    }),
    [detail, milestones, registration, expropriation, contacts],
  );
};

// Project Update Hooks
export const useReptProjectUpdateOptions = (
  projectId?: string,
): UseQueryResult<ReptProjectUpdateOptions | null, Error> => {
  return useQuery<ReptProjectUpdateOptions | null, Error>({
    queryKey: reptKeys.projectUpdateOptions(projectId),
    queryFn: () => getProjectUpdateOptions(projectId as string),
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateReptProject = (
  projectId?: string,
): UseMutationResult<ReptProjectDetail, Error, ReptProjectUpdateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptProjectDetail, Error, ReptProjectUpdateRequest>({
    mutationKey: ['rept', 'project', projectId, 'update'],
    mutationFn: (payload) => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID must be specified'));
      }
      return updateProject(projectId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.project(projectId) });
      queryClient.invalidateQueries({ queryKey: ['rept', 'project-search'], exact: false });
    },
  });
};

// Acquisition Request Hooks
export const useReptAcquisitionRequestOptions = (
  projectId?: string,
): UseQueryResult<ReptAcquisitionRequestOptions | null, Error> => {
  return useQuery<ReptAcquisitionRequestOptions | null, Error>({
    queryKey: reptKeys.acquisitionOptions(projectId),
    queryFn: () => getAcquisitionRequestOptions(projectId as string),
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateReptAcquisitionRequest = (
  projectId?: string,
): UseMutationResult<ReptAcquisitionRequest, Error, ReptAcquisitionRequestCreateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptAcquisitionRequest, Error, ReptAcquisitionRequestCreateRequest>({
    mutationKey: ['rept', 'project', projectId, 'acquisition', 'create'],
    mutationFn: (payload) => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID must be specified'));
      }
      return createAcquisitionRequest(projectId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.acquisition(projectId) });
      queryClient.invalidateQueries({ queryKey: reptKeys.project(projectId) });
    },
  });
};

export const useUpdateReptAcquisitionRequest = (
  projectId?: string,
): UseMutationResult<ReptAcquisitionRequest, Error, ReptAcquisitionRequestUpdateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptAcquisitionRequest, Error, ReptAcquisitionRequestUpdateRequest>({
    mutationKey: ['rept', 'project', projectId, 'acquisition', 'update'],
    mutationFn: (payload) => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID must be specified'));
      }
      return updateAcquisitionRequest(projectId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.acquisition(projectId) });
      queryClient.invalidateQueries({ queryKey: reptKeys.project(projectId) });
    },
  });
};

// Project Contact Hooks
export const useReptProjectContactOptions = (
  projectId?: string,
): UseQueryResult<ReptProjectContactOptions | null, Error> => {
  return useQuery<ReptProjectContactOptions | null, Error>({
    queryKey: reptKeys.projectContactOptions(projectId),
    queryFn: () => getProjectContactOptions(projectId as string),
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useReptContactSearch = (
  projectId?: string,
  params?: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    page?: number;
    size?: number;
  } | null,
): UseQueryResult<ReptContactSearchResult | null, Error> => {
  const hasSearchTerms = Boolean(
    params?.firstName?.trim() || params?.lastName?.trim() || params?.companyName?.trim(),
  );

  return useQuery<ReptContactSearchResult | null, Error>({
    queryKey: reptKeys.contactSearch(projectId, params ?? undefined),
    queryFn: () => searchContacts(projectId as string, params ?? {}),
    enabled: Boolean(projectId) && hasSearchTerms,
    placeholderData: keepPreviousData,
  });
};

export const useAddReptProjectContact = (
  projectId?: string,
): UseMutationResult<void, Error, ReptProjectContactAddRequest> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReptProjectContactAddRequest>({
    mutationKey: ['rept', 'project', projectId, 'contacts', 'add'],
    mutationFn: async (payload) => {
      if (!projectId) {
        throw new Error('Project ID must be specified');
      }
      await addContactToProject(projectId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.projectContacts(projectId) });
      // Agreement payment options derive their payee candidates from project +
      // property contacts — invalidate all agreement-scoped queries for this
      // project so the New Payment modal sees the new contact.
      queryClient.invalidateQueries({ queryKey: ['rept', 'project', projectId, 'agreement'] });
    },
  });
};

export const useRemoveReptProjectContact = (
  projectId?: string,
): UseMutationResult<void, Error, { associationId: number }> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { associationId: number }>({
    mutationKey: ['rept', 'project', projectId, 'contacts', 'remove'],
    mutationFn: ({ associationId }) => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID must be specified'));
      }
      return removeContactFromProject(projectId, associationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.projectContacts(projectId) });
      queryClient.invalidateQueries({ queryKey: ['rept', 'project', projectId, 'agreement'] });
    },
  });
};

// Property Options Hook
export const useReptPropertyOptions = (
  projectId?: string,
): UseQueryResult<ReptPropertyOptions | null, Error> => {
  return useQuery<ReptPropertyOptions | null, Error>({
    queryKey: reptKeys.propertyOptions(projectId),
    queryFn: () => getPropertyOptions(projectId as string),
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
  });
};

// Property CRUD Mutation Hooks
export const useCreateReptProperty = (
  projectId?: string,
): UseMutationResult<ReptPropertyInsertResult, Error, ReptPropertyCreateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptPropertyInsertResult, Error, ReptPropertyCreateRequest>({
    mutationKey: ['rept', 'project', projectId, 'properties', 'create'],
    mutationFn: async (payload) => {
      if (!projectId) {
        throw new Error('Project ID must be specified');
      }
      const result = await createProperty(projectId, payload);
      if (!result) {
        throw new Error('Property creation response was empty');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.properties(projectId) });
      queryClient.invalidateQueries({ queryKey: reptKeys.project(projectId) });
    },
  });
};

export const useUpdateReptPropertyDetails = (
  projectId?: string,
  propertyId?: string,
): UseMutationResult<ReptPropertyUpdateResult, Error, ReptPropertyUpdateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptPropertyUpdateResult, Error, ReptPropertyUpdateRequest>({
    mutationKey: ['rept', 'project', projectId, 'property', propertyId, 'update'],
    mutationFn: async (payload) => {
      if (!projectId || !propertyId) {
        throw new Error('Project and property must be specified');
      }
      const result = await updateProperty(projectId, propertyId, payload);
      if (!result) {
        throw new Error('Property update response was empty');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.propertyDetail(projectId, propertyId) });
      queryClient.invalidateQueries({ queryKey: reptKeys.properties(projectId) });
    },
  });
};

export const useUpdateReptPropertyMilestones = (
  projectId?: string,
  propertyId?: string,
): UseMutationResult<ReptPropertyUpdateResult, Error, ReptPropertyMilestoneUpdateRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptPropertyUpdateResult, Error, ReptPropertyMilestoneUpdateRequest>({
    mutationKey: ['rept', 'project', projectId, 'property', propertyId, 'milestones', 'update'],
    mutationFn: async (payload) => {
      if (!projectId || !propertyId) {
        throw new Error('Project and property must be specified');
      }
      const result = await updatePropertyMilestones(projectId, propertyId, payload);
      if (!result) {
        throw new Error('Property milestones update response was empty');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reptKeys.propertyMilestones(projectId, propertyId),
      });
      queryClient.invalidateQueries({ queryKey: reptKeys.properties(projectId) });
    },
  });
};

export const useDeleteReptProperty = (
  projectId?: string,
): UseMutationResult<void, Error, { propertyId: string; revisionCount: number }> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { propertyId: string; revisionCount: number }>({
    mutationKey: ['rept', 'project', projectId, 'properties', 'delete'],
    mutationFn: async ({ propertyId, revisionCount }) => {
      if (!projectId) {
        throw new Error('Project ID must be specified');
      }
      await deleteProperty(projectId, propertyId, revisionCount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reptKeys.properties(projectId) });
      queryClient.invalidateQueries({ queryKey: reptKeys.project(projectId) });
    },
  });
};

// Property Registration Mutation Hooks
export const useUpsertReptPropertyRegistration = (
  projectId?: string,
  propertyId?: string,
): UseMutationResult<ReptRegistrationResult, Error, ReptPropertyRegistrationUpsertRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptRegistrationResult, Error, ReptPropertyRegistrationUpsertRequest>({
    mutationKey: ['rept', 'project', projectId, 'property', propertyId, 'registration', 'upsert'],
    mutationFn: async (payload) => {
      if (!projectId || !propertyId) {
        throw new Error('Project and property must be specified');
      }
      const result = await updatePropertyRegistration(projectId, propertyId, payload);
      if (!result) {
        throw new Error('Registration update response was empty');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reptKeys.propertyRegistration(projectId, propertyId),
      });
    },
  });
};

export const useDeleteReptPropertyRegistration = (
  projectId?: string,
  propertyId?: string,
): UseMutationResult<void, Error, { revisionCount: number }> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { revisionCount: number }>({
    mutationKey: ['rept', 'project', projectId, 'property', propertyId, 'registration', 'delete'],
    mutationFn: async ({ revisionCount }) => {
      if (!projectId || !propertyId) {
        throw new Error('Project and property must be specified');
      }
      await deletePropertyRegistration(projectId, propertyId, revisionCount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reptKeys.propertyRegistration(projectId, propertyId),
      });
    },
  });
};

// Property Expropriation Mutation Hooks
export const useUpsertReptPropertyExpropriation = (
  projectId?: string,
  propertyId?: string,
): UseMutationResult<ReptExpropriationResult, Error, ReptPropertyExpropriationUpsertRequest> => {
  const queryClient = useQueryClient();

  return useMutation<ReptExpropriationResult, Error, ReptPropertyExpropriationUpsertRequest>({
    mutationKey: ['rept', 'project', projectId, 'property', propertyId, 'expropriation', 'upsert'],
    mutationFn: async (payload) => {
      if (!projectId || !propertyId) {
        throw new Error('Project and property must be specified');
      }
      const result = await updatePropertyExpropriation(projectId, propertyId, payload);
      if (!result) {
        throw new Error('Expropriation update response was empty');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reptKeys.propertyExpropriation(projectId, propertyId),
      });
    },
  });
};

export const useDeleteReptPropertyExpropriation = (
  projectId?: string,
  propertyId?: string,
): UseMutationResult<void, Error, { revisionCount: number }> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { revisionCount: number }>({
    mutationKey: ['rept', 'project', projectId, 'property', propertyId, 'expropriation', 'delete'],
    mutationFn: async ({ revisionCount }) => {
      if (!projectId || !propertyId) {
        throw new Error('Project and property must be specified');
      }
      await deletePropertyExpropriation(projectId, propertyId, revisionCount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reptKeys.propertyExpropriation(projectId, propertyId),
      });
    },
  });
};

// Property Contact Mutation Hooks
export const useAddReptPropertyContact = (
  projectId?: string,
  propertyId?: string,
): UseMutationResult<void, Error, ReptProjectContactAddRequest> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReptProjectContactAddRequest>({
    mutationKey: ['rept', 'project', projectId, 'property', propertyId, 'contacts', 'add'],
    mutationFn: async (payload) => {
      if (!projectId || !propertyId) {
        throw new Error('Project and property must be specified');
      }
      await addContactToProperty(projectId, propertyId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reptKeys.propertyContacts(projectId, propertyId),
      });
      // Also refresh the project-level contacts list since it includes property contacts
      queryClient.invalidateQueries({ queryKey: reptKeys.projectContacts(projectId) });
      // Agreement payee candidates are derived from project + property contacts,
      // so invalidate all agreement-scoped queries for this project.
      queryClient.invalidateQueries({ queryKey: ['rept', 'project', projectId, 'agreement'] });
    },
  });
};

export const useRemoveReptPropertyContact = (
  projectId?: string,
  propertyId?: string,
): UseMutationResult<void, Error, { associationId: number }> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { associationId: number }>({
    mutationKey: ['rept', 'project', projectId, 'property', propertyId, 'contacts', 'remove'],
    mutationFn: async ({ associationId }) => {
      if (!projectId || !propertyId) {
        throw new Error('Project and property must be specified');
      }
      await removeContactFromProperty(projectId, propertyId, associationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reptKeys.propertyContacts(projectId, propertyId),
      });
      queryClient.invalidateQueries({ queryKey: reptKeys.projectContacts(projectId) });
      queryClient.invalidateQueries({ queryKey: ['rept', 'project', projectId, 'agreement'] });
    },
  });
};
