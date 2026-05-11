import { buildApiUrl } from '@/config/api/baseUrl';
import { ensureSessionFresh } from '@/context/auth/refreshSession';
import { buildAuthorizedHeaders } from '@/services/http/headers';

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

const buildUrl = (path: string) => buildApiUrl(`/rept/admin${path}`);

const JSON_HEADERS = {
  Accept: 'application/json',
};

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  await ensureSessionFresh();

  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...init,
    headers: buildAuthorizedHeaders(JSON_HEADERS, init?.headers),
  });

  if (response.status === 204 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    // For server errors (5xx), never expose internal details (SQL, stack traces, etc.)
    if (response.status >= 500) {
      throw new Error('- please try again later.');
    }

    // For client errors (4xx), show the backend's message when it's safe to do so
    let message = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as { detail?: string; message?: string } | null;
      if (data) {
        message = data.detail ?? data.message ?? message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

const encodeQuery = (params: Record<string, string | number | boolean | undefined | null>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return;
      search.append(key, trimmed);
      return;
    }
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const searchExpenseAuthorities = (criteria: ExpenseAuthoritySearch) =>
  request<ExpenseAuthorityDto[]>(
    `/expense-authorities${encodeQuery({
      q: criteria.query,
      active: criteria.active,
    })}`,
  ).then((result) => result ?? []);

export const createExpenseAuthority = (payload: ExpenseAuthorityRequest) =>
  request<ExpenseAuthorityDto>('/expense-authorities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const updateExpenseAuthority = (id: number, payload: ExpenseAuthorityRequest) =>
  request<ExpenseAuthorityDto>(`/expense-authorities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const deleteExpenseAuthority = (id: number) =>
  request<void>(`/expense-authorities/${id}`, { method: 'DELETE' }).then(() => undefined);

export const searchRequestingSources = (criteria: RequestingSourceSearch) =>
  request<RequestingSourceDto[]>(
    `/requesting-sources${encodeQuery({
      q: criteria.query,
      external: criteria.external,
    })}`,
  ).then((result) => result ?? []);

export const createRequestingSource = (payload: RequestingSourceRequest) =>
  request<RequestingSourceDto>('/requesting-sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const updateRequestingSource = (id: number, payload: RequestingSourceRequest) =>
  request<RequestingSourceDto>(`/requesting-sources/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const deleteRequestingSource = (id: number, revisionCount: number) =>
  request<void>(`/requesting-sources/${id}?revision=${revisionCount}`, { method: 'DELETE' }).then(
    () => undefined,
  );

export const searchCoUsers = (criteria: CoUserSearch) =>
  request<CoUserDto[]>(
    `/co-users${encodeQuery({
      q: criteria.query,
      external: criteria.external,
    })}`,
  ).then((result) => result ?? []);

export const createCoUser = (payload: CoUserRequest) =>
  request<CoUserDto>('/co-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const updateCoUser = (id: number, payload: CoUserRequest) =>
  request<CoUserDto>(`/co-users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const deleteCoUser = (id: number, revisionCount: number) =>
  request<void>(`/co-users/${id}?revision=${revisionCount}`, { method: 'DELETE' }).then(
    () => undefined,
  );

export const searchContacts = (criteria: ContactSearchCriteria) =>
  request<ContactAdminDto[]>(
    `/contacts${encodeQuery({
      firstName: criteria.firstName,
      lastName: criteria.lastName,
      companyName: criteria.companyName,
    })}`,
  ).then((result) => result ?? []);

export const createContact = (payload: ContactUpsertRequest) =>
  request<ContactAdminDto>('/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const updateContact = (id: number, payload: ContactUpsertRequest) =>
  request<ContactAdminDto>(`/contacts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const deleteContact = (id: number, revisionCount: number) =>
  request<void>(`/contacts/${id}?revision=${revisionCount}`, { method: 'DELETE' }).then(
    () => undefined,
  );

export const searchOrgUnits = (criteria: OrgUnitSearchCriteria) =>
  request<OrgUnitSearchResult[]>(`/org-units${encodeQuery({ q: criteria.query })}`).then(
    (result) => result ?? [],
  );

export const searchQualifiedReceivers = (criteria: QualifiedReceiverSearch) =>
  request<QualifiedReceiverDto[]>(
    `/qualified-receivers${encodeQuery({
      q: criteria.query,
      active: criteria.active,
    })}`,
  ).then((result) => result ?? []);

export const createQualifiedReceiver = (payload: QualifiedReceiverRequest) =>
  request<QualifiedReceiverDto>('/qualified-receivers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const updateQualifiedReceiver = (id: number, payload: QualifiedReceiverRequest) =>
  request<QualifiedReceiverDto>(`/qualified-receivers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const deleteQualifiedReceiver = (id: number) =>
  request<void>(`/qualified-receivers/${id}`, { method: 'DELETE' }).then(() => undefined);
