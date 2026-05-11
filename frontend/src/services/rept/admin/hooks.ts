import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import {
  createCoUser,
  createContact,
  createExpenseAuthority,
  createRequestingSource,
  createQualifiedReceiver,
  deleteCoUser,
  deleteContact,
  deleteExpenseAuthority,
  deleteRequestingSource,
  deleteQualifiedReceiver,
  searchCoUsers,
  searchContacts,
  searchExpenseAuthorities,
  searchOrgUnits,
  searchQualifiedReceivers,
  searchRequestingSources,
  updateCoUser,
  updateContact,
  updateExpenseAuthority,
  updateQualifiedReceiver,
  updateRequestingSource,
} from './api';

import type {
  CoUserDto,
  CoUserRequest,
  CoUserSearch,
  ContactAdminDto,
  ContactSearchCriteria,
  ContactUpsertRequest,
  ExpenseAuthorityDto,
  ExpenseAuthorityRequest,
  ExpenseAuthoritySearch,
  OrgUnitSearchCriteria,
  OrgUnitSearchResult,
  QualifiedReceiverDto,
  QualifiedReceiverRequest,
  QualifiedReceiverSearch,
  RequestingSourceDto,
  RequestingSourceRequest,
  RequestingSourceSearch,
} from './types';

const adminKeys = {
  expenseAuthorities: (criteria: ExpenseAuthoritySearch) => ['admin', 'expense', criteria] as const,
  requestingSources: (criteria: RequestingSourceSearch) =>
    ['admin', 'requesting', criteria] as const,
  coUsers: (criteria: CoUserSearch) => ['admin', 'coUsers', criteria] as const,
  contacts: (criteria: ContactSearchCriteria) => ['admin', 'contacts', criteria] as const,
  qualifiedReceivers: (criteria: QualifiedReceiverSearch) =>
    ['admin', 'qualified', criteria] as const,
  orgUnits: (criteria: OrgUnitSearchCriteria) => ['admin', 'orgUnits', criteria] as const,
};

export const useExpenseAuthoritySearch = (criteria: ExpenseAuthoritySearch) => {
  return useQuery<ExpenseAuthorityDto[], Error>({
    queryKey: adminKeys.expenseAuthorities(criteria),
    queryFn: () => searchExpenseAuthorities(criteria),
  });
};

export const useRequestingSourceSearch = (criteria: RequestingSourceSearch) => {
  return useQuery<RequestingSourceDto[], Error>({
    queryKey: adminKeys.requestingSources(criteria),
    queryFn: () => searchRequestingSources(criteria),
  });
};

export const useCoUserSearch = (criteria: CoUserSearch, options?: { enabled?: boolean }) => {
  return useQuery<CoUserDto[], Error>({
    queryKey: adminKeys.coUsers(criteria),
    queryFn: () => searchCoUsers(criteria),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useContactSearch = (
  criteria: ContactSearchCriteria,
  options?: { enabled?: boolean },
) => {
  return useQuery<ContactAdminDto[], Error>({
    queryKey: adminKeys.contacts(criteria),
    queryFn: () => searchContacts(criteria),
    enabled: options?.enabled ?? true,
  });
};

export const useOrgUnitSearch = (criteria: OrgUnitSearchCriteria) => {
  return useQuery<OrgUnitSearchResult[], Error>({
    queryKey: adminKeys.orgUnits(criteria),
    queryFn: () => searchOrgUnits(criteria),
    enabled: Boolean(criteria.query && criteria.query.trim().length > 0),
  });
};

export const useQualifiedReceiverSearch = (criteria: QualifiedReceiverSearch) => {
  return useQuery<QualifiedReceiverDto[], Error>({
    queryKey: adminKeys.qualifiedReceivers(criteria),
    queryFn: () => searchQualifiedReceivers(criteria),
  });
};

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return {
    expenseAuthorities: (criteria: ExpenseAuthoritySearch) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.expenseAuthorities(criteria) }),
    requestingSources: (criteria: RequestingSourceSearch) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.requestingSources(criteria) }),
    coUsers: (criteria: CoUserSearch) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.coUsers(criteria) }),
    contacts: (criteria: ContactSearchCriteria) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.contacts(criteria) }),
    qualifiedReceivers: (criteria: QualifiedReceiverSearch) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.qualifiedReceivers(criteria) }),
  };
};

export const useExpenseAuthorityMutations = (
  criteria: ExpenseAuthoritySearch,
): {
  create: UseMutationResult<ExpenseAuthorityDto | null, Error, ExpenseAuthorityRequest>;
  update: UseMutationResult<
    ExpenseAuthorityDto | null,
    Error,
    { id: number; payload: ExpenseAuthorityRequest }
  >;
  remove: UseMutationResult<void, Error, number>;
} => {
  const invalidate = useInvalidate();
  return {
    create: useMutation({
      mutationFn: createExpenseAuthority,
      onSuccess: () => invalidate.expenseAuthorities(criteria),
    }),
    update: useMutation({
      mutationFn: ({ id, payload }) => updateExpenseAuthority(id, payload),
      onSuccess: () => invalidate.expenseAuthorities(criteria),
    }),
    remove: useMutation({
      mutationFn: deleteExpenseAuthority,
      onSuccess: () => invalidate.expenseAuthorities(criteria),
    }),
  };
};

export const useRequestingSourceMutations = (
  criteria: RequestingSourceSearch,
): {
  create: UseMutationResult<RequestingSourceDto | null, Error, RequestingSourceRequest>;
  update: UseMutationResult<
    RequestingSourceDto | null,
    Error,
    { id: number; payload: RequestingSourceRequest }
  >;
  remove: UseMutationResult<void, Error, { id: number; revisionCount: number }>;
} => {
  const invalidate = useInvalidate();
  return {
    create: useMutation({
      mutationFn: createRequestingSource,
      onSuccess: () => invalidate.requestingSources(criteria),
    }),
    update: useMutation({
      mutationFn: ({ id, payload }) => updateRequestingSource(id, payload),
      onSuccess: () => invalidate.requestingSources(criteria),
    }),
    remove: useMutation({
      mutationFn: ({ id, revisionCount }) => deleteRequestingSource(id, revisionCount),
      onSuccess: () => invalidate.requestingSources(criteria),
    }),
  };
};

export const useCoUserMutations = (
  criteria: CoUserSearch,
): {
  create: UseMutationResult<CoUserDto | null, Error, CoUserRequest>;
  update: UseMutationResult<CoUserDto | null, Error, { id: number; payload: CoUserRequest }>;
  remove: UseMutationResult<void, Error, { id: number; revisionCount: number }>;
} => {
  const invalidate = useInvalidate();
  return {
    create: useMutation({
      mutationFn: createCoUser,
      onSuccess: () => invalidate.coUsers(criteria),
    }),
    update: useMutation({
      mutationFn: ({ id, payload }) => updateCoUser(id, payload),
      onSuccess: () => invalidate.coUsers(criteria),
    }),
    remove: useMutation({
      mutationFn: ({ id, revisionCount }) => deleteCoUser(id, revisionCount),
      onSuccess: () => invalidate.coUsers(criteria),
    }),
  };
};

export const useContactMutations = (
  criteria: ContactSearchCriteria,
): {
  create: UseMutationResult<ContactAdminDto | null, Error, ContactUpsertRequest>;
  update: UseMutationResult<
    ContactAdminDto | null,
    Error,
    { id: number; payload: ContactUpsertRequest }
  >;
  remove: UseMutationResult<void, Error, { id: number; revisionCount: number }>;
} => {
  const invalidate = useInvalidate();
  return {
    create: useMutation({
      mutationFn: createContact,
      onSuccess: () => invalidate.contacts(criteria),
    }),
    update: useMutation({
      mutationFn: ({ id, payload }) => updateContact(id, payload),
      onSuccess: () => invalidate.contacts(criteria),
    }),
    remove: useMutation({
      mutationFn: ({ id, revisionCount }) => deleteContact(id, revisionCount),
      onSuccess: () => invalidate.contacts(criteria),
    }),
  };
};

export const useQualifiedReceiverMutations = (
  criteria: QualifiedReceiverSearch,
): {
  create: UseMutationResult<QualifiedReceiverDto | null, Error, QualifiedReceiverRequest>;
  update: UseMutationResult<
    QualifiedReceiverDto | null,
    Error,
    { id: number; payload: QualifiedReceiverRequest }
  >;
  remove: UseMutationResult<void, Error, number>;
} => {
  const invalidate = useInvalidate();
  return {
    create: useMutation({
      mutationFn: createQualifiedReceiver,
      onSuccess: () => invalidate.qualifiedReceivers(criteria),
    }),
    update: useMutation({
      mutationFn: ({ id, payload }) => updateQualifiedReceiver(id, payload),
      onSuccess: () => invalidate.qualifiedReceivers(criteria),
    }),
    remove: useMutation({
      mutationFn: deleteQualifiedReceiver,
      onSuccess: () => invalidate.qualifiedReceivers(criteria),
    }),
  };
};
