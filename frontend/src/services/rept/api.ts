import { buildApiUrl } from '@/config/api/baseUrl';
import { ensureSessionFresh } from '@/context/auth/refreshSession';
import { buildAuthorizedHeaders } from '@/services/http/headers';

import {
  type ReptAcquisitionRequest,
  type ReptAcquisitionRequestCreateRequest,
  type ReptAcquisitionRequestOptions,
  type ReptAcquisitionRequestUpdateRequest,
  type ReptProjectSearchOptions,
  type ReptProjectSearchParams,
  type ReptProjectSearchResponse,
  type ReptContact,
  type ReptContactPage,
  type ReptContactSearchResult,
  type ReptProjectDetail,
  type ReptProjectCreateOptions,
  type ReptProjectCreateRequest,
  type ReptProjectCreateResult,
  type ReptProjectUpdateOptions,
  type ReptProjectUpdateRequest,
  type ReptProjectContactOptions,
  type ReptProjectContactAddRequest,
  type ReptPropertyDetail,
  type ReptPropertyExpropriation,
  type ReptPropertyMilestones,
  type ReptPropertyOptions,
  type ReptPropertyRegistration,
  type ReptPropertySummary,
  type ReptPropertyCreateRequest,
  type ReptPropertyUpdateRequest,
  type ReptPropertyMilestoneUpdateRequest,
  type ReptPropertyRegistrationUpsertRequest,
  type ReptPropertyExpropriationUpsertRequest,
  type ReptPropertyInsertResult,
  type ReptPropertyUpdateResult,
  type ReptRegistrationResult,
  type ReptExpropriationResult,
  type CodeName,
  type ReptUserSearchParams,
  type ReptUserSearchResponse,
  type ReptAgreement,
  type ReptAgreementProperty,
  type ReptAgreementPropertyUpdateRequest,
  type ReptAgreementPayment,
  type ReptAgreementPaymentCreateRequest,
  type ReptAgreementPaymentOptions,
  type ReptAgreementUpdateRequest,
  type ReptAgreementOptions,
  type ReptAgreementCreateRequest,
} from './types';

const JSON_HEADERS = {
  Accept: 'application/json',
};

const buildUrl = (path: string) => buildApiUrl(`/rept${path}`);

const buildSearchQuery = (params: ReptProjectSearchParams) => {
  const searchParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return;
      }
      searchParams.append(key, trimmed);
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query.length ? `?${query}` : '';
};

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  await ensureSessionFresh();

  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...init,
    headers: await buildAuthorizedHeaders(JSON_HEADERS, init?.headers),
  });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    // For server errors (5xx), never expose internal details (SQL, stack traces, etc.)
    if (response.status >= 500) {
      throw new Error('- please try again later.');
    }

    let message = `Request failed with status ${response.status}`;
    let reason: string | undefined;

    try {
      const data = (await response.json()) as {
        detail?: string;
        message?: string;
        title?: string;
        reason?: string;
      } | null;
      if (data) {
        message = data.detail ?? data.message ?? data.title ?? message;
        reason = data.reason;
      }
    } catch {
      // Ignore JSON parsing errors for non-JSON responses
    }

    const error = new Error(message);
    (error as Error & { status?: number; reason?: string }).status = response.status;
    if (reason) {
      (error as Error & { status?: number; reason?: string }).reason = reason;
    }
    throw error;
  }

  return (await response.json()) as T;
}

export const getProjectDetail = (projectId: string) =>
  request<ReptProjectDetail>(`/projects/${projectId}`);

export const getAcquisitionRequest = (projectId: string) =>
  request<ReptAcquisitionRequest>(`/projects/${projectId}/acquisition-request`);

export const getPropertySummaries = (projectId: string) =>
  request<ReptPropertySummary[]>(`/projects/${projectId}/properties`).then(
    (result) => result ?? [],
  );

export const getPropertyOptions = (projectId: string) =>
  request<ReptPropertyOptions>(`/projects/${projectId}/properties/options`);

export const getPropertyDetail = (projectId: string, propertyId: string) =>
  request<ReptPropertyDetail>(`/projects/${projectId}/properties/${propertyId}`);

export const getPropertyMilestones = (projectId: string, propertyId: string) =>
  request<ReptPropertyMilestones>(`/projects/${projectId}/properties/${propertyId}/milestones`);

export const getPropertyRegistration = (projectId: string, propertyId: string) =>
  request<ReptPropertyRegistration>(`/projects/${projectId}/properties/${propertyId}/registration`);

export const getPropertyExpropriation = (projectId: string, propertyId: string) =>
  request<ReptPropertyExpropriation>(
    `/projects/${projectId}/properties/${propertyId}/expropriation`,
  );

export const getPropertyContacts = (projectId: string, propertyId: string) =>
  request<ReptContact[]>(`/projects/${projectId}/properties/${propertyId}/contacts`).then(
    (result) => result ?? [],
  );

export const createProperty = (projectId: string, payload: ReptPropertyCreateRequest) =>
  request<ReptPropertyInsertResult>(`/projects/${projectId}/properties`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const updateProperty = (
  projectId: string,
  propertyId: string,
  payload: ReptPropertyUpdateRequest,
) =>
  request<ReptPropertyUpdateResult>(`/projects/${projectId}/properties/${propertyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const deleteProperty = (projectId: string, propertyId: string, revisionCount: number) =>
  request<void>(`/projects/${projectId}/properties/${propertyId}?revisionCount=${revisionCount}`, {
    method: 'DELETE',
  });

export const updatePropertyMilestones = (
  projectId: string,
  propertyId: string,
  payload: ReptPropertyMilestoneUpdateRequest,
) =>
  request<ReptPropertyUpdateResult>(`/projects/${projectId}/properties/${propertyId}/milestones`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const updatePropertyRegistration = (
  projectId: string,
  propertyId: string,
  payload: ReptPropertyRegistrationUpsertRequest,
) =>
  request<ReptRegistrationResult>(`/projects/${projectId}/properties/${propertyId}/registration`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const updatePropertyExpropriation = (
  projectId: string,
  propertyId: string,
  payload: ReptPropertyExpropriationUpsertRequest,
) =>
  request<ReptExpropriationResult>(
    `/projects/${projectId}/properties/${propertyId}/expropriation`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

export const deletePropertyRegistration = (
  projectId: string,
  propertyId: string,
  revisionCount: number,
) =>
  request<void>(
    `/projects/${projectId}/properties/${propertyId}/registration?revisionCount=${revisionCount}`,
    {
      method: 'DELETE',
    },
  );

export const deletePropertyExpropriation = (
  projectId: string,
  propertyId: string,
  revisionCount: number,
) =>
  request<void>(
    `/projects/${projectId}/properties/${propertyId}/expropriation?revisionCount=${revisionCount}`,
    {
      method: 'DELETE',
    },
  );

export const getProjectContacts = (projectId: string) =>
  request<ReptContactPage>(`/projects/${projectId}/contacts`);

export const getProjectAgreements = (projectId: string) =>
  request<ReptAgreement[]>(`/projects/${projectId}/agreements`).then((result) => result ?? []);

export const getAgreementCreateOptions = (projectId: string) =>
  request<ReptAgreementOptions>(`/projects/${projectId}/agreements/options`).then((result) => ({
    acquisitionCodes: result?.acquisitionCodes ?? [],
    dispositionCodes: result?.dispositionCodes ?? [],
  }));

export const createAgreement = (projectId: string, payload: ReptAgreementCreateRequest) =>
  request<ReptAgreement>(`/projects/${projectId}/agreements`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const getProjectAgreement = (projectId: string, agreementId: string) =>
  request<ReptAgreement>(`/projects/${projectId}/agreements/${agreementId}`);

export const getAgreementProperties = (projectId: string, agreementId: string) =>
  request<ReptAgreementProperty[]>(
    `/projects/${projectId}/agreements/${agreementId}/properties`,
  ).then((result) => result ?? []);

export const getAgreementPayments = (projectId: string, agreementId: string) =>
  request<ReptAgreementPayment[]>(`/projects/${projectId}/agreements/${agreementId}/payments`).then(
    (result) => {
      if (!result) {
        return [];
      }
      return result.map((payment) => ({
        ...payment,
        payees: payment.payees ?? [],
      }));
    },
  );

export const getAgreementPaymentOptions = (projectId: string, agreementId: string) =>
  request<ReptAgreementPaymentOptions>(
    `/projects/${projectId}/agreements/${agreementId}/payments/options`,
  ).then((result) => ({
    payeeCandidates: result?.payeeCandidates ?? [],
    paymentTypes: result?.paymentTypes ?? [],
    paymentTerms: result?.paymentTerms ?? [],
    expenseAuthorities: result?.expenseAuthorities ?? [],
    qualifiedReceivers: result?.qualifiedReceivers ?? [],
    taxRate: result?.taxRate ?? null,
  }));

export const updateAgreementProperties = (
  projectId: string,
  agreementId: string,
  payload: ReptAgreementPropertyUpdateRequest,
) =>
  request<ReptAgreementProperty[]>(`/projects/${projectId}/agreements/${agreementId}/properties`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((result) => result ?? []);

export const updateAgreement = (
  projectId: string,
  agreementId: string,
  payload: ReptAgreementUpdateRequest,
) =>
  request<ReptAgreement>(`/projects/${projectId}/agreements/${agreementId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((result) => {
    if (!result) {
      throw new Error('Agreement update response was empty');
    }
    return result;
  });

export const createAgreementPayment = (
  projectId: string,
  agreementId: string,
  payload: ReptAgreementPaymentCreateRequest,
) =>
  request<ReptAgreementPayment>(`/projects/${projectId}/agreements/${agreementId}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((result) => {
    if (!result) {
      throw new Error('Payment creation response was empty');
    }
    return {
      ...result,
      payees: result.payees ?? [],
    };
  });

export const getProjectSearchOptions = () =>
  request<ReptProjectSearchOptions>('/projects/search/options');

export const getProjectCreateOptions = () =>
  request<ReptProjectCreateOptions>('/projects/create/options');

export const getProjectFileSuffixes = (prefix: string) =>
  request<CodeName[]>(`/projects/search/file-suffixes?prefix=${encodeURIComponent(prefix)}`).then(
    (result) => result ?? [],
  );

export const searchProjects = (params: ReptProjectSearchParams) =>
  request<ReptProjectSearchResponse>(`/projects/search${buildSearchQuery(params)}`);

export const searchUsers = (params: ReptUserSearchParams) =>
  request<ReptUserSearchResponse>(`/users/search${buildSearchQuery(params)}`).then((result) => {
    if (!result) {
      return {
        results: [],
        total: 0,
        page: params.page ?? 0,
        size: params.size ?? 0,
      } satisfies ReptUserSearchResponse;
    }
    return result;
  });

export const createProject = async (payload: ReptProjectCreateRequest) => {
  const result = await request<ReptProjectCreateResult>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!result) {
    throw new Error('Project creation response was empty');
  }

  return result;
};

// Project Update APIs
export const getProjectUpdateOptions = (projectId: string) =>
  request<ReptProjectUpdateOptions>(`/projects/${projectId}/edit/options`).then((result) => ({
    statuses: result?.statuses ?? [],
    priorities: result?.priorities ?? [],
    regions: result?.regions ?? [],
    districts: result?.districts ?? [],
    bctsOffices: result?.bctsOffices ?? [],
    requestingSources: result?.requestingSources ?? [],
    projectManagers: result?.projectManagers ?? [],
  }));

export const updateProject = async (projectId: string, payload: ReptProjectUpdateRequest) => {
  const result = await request<ReptProjectDetail>(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!result) {
    throw new Error('Project update response was empty');
  }

  return result;
};

// Acquisition Request APIs
export const getAcquisitionRequestOptions = (projectId: string) =>
  request<ReptAcquisitionRequestOptions>(`/projects/${projectId}/acquisition-request/options`).then(
    (result) => ({
      acquisitionTypes: result?.acquisitionTypes ?? [],
      fundingCodes: result?.fundingCodes ?? [],
      fsrTypes: result?.fsrTypes ?? [],
      roadUseTypes: result?.roadUseTypes ?? [],
    }),
  );

export const createAcquisitionRequest = async (
  projectId: string,
  payload: ReptAcquisitionRequestCreateRequest,
) => {
  const result = await request<ReptAcquisitionRequest>(
    `/projects/${projectId}/acquisition-request`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!result) {
    throw new Error('Acquisition request creation response was empty');
  }

  return result;
};

export const updateAcquisitionRequest = async (
  projectId: string,
  payload: ReptAcquisitionRequestUpdateRequest,
) => {
  const result = await request<ReptAcquisitionRequest>(
    `/projects/${projectId}/acquisition-request`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!result) {
    throw new Error('Acquisition request update response was empty');
  }

  return result;
};

// Project Contact APIs
export const getProjectContactOptions = (projectId: string) =>
  request<ReptProjectContactOptions>(`/projects/${projectId}/contacts/options`).then((result) => ({
    contactTypes: result?.contactTypes ?? [],
  }));

export const searchContacts = (
  projectId: string,
  params: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    page?: number;
    size?: number;
  },
) => {
  const searchParams = new URLSearchParams();
  if (params.firstName) searchParams.append('firstName', params.firstName);
  if (params.lastName) searchParams.append('lastName', params.lastName);
  if (params.companyName) searchParams.append('companyName', params.companyName);
  if (params.page !== undefined) searchParams.append('page', String(params.page));
  if (params.size !== undefined) searchParams.append('size', String(params.size));

  const query = searchParams.toString();
  return request<ReptContactSearchResult>(
    `/projects/${projectId}/contacts/search${query ? `?${query}` : ''}`,
  ).then((result) => ({
    contacts: result?.contacts ?? [],
    totalCount: result?.totalCount ?? 0,
    page: result?.page ?? 0,
    pageSize: result?.pageSize ?? 20,
  }));
};

export const addContactToProject = async (
  projectId: string,
  payload: ReptProjectContactAddRequest,
) => {
  return await request<void>(`/projects/${projectId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const removeContactFromProject = async (projectId: string, associationId: number) => {
  await request<void>(`/projects/${projectId}/contacts/${associationId}`, {
    method: 'DELETE',
  });
};

export const addContactToProperty = async (
  projectId: string,
  propertyId: string,
  payload: ReptProjectContactAddRequest,
) => {
  return await request<ReptContact[]>(`/projects/${projectId}/properties/${propertyId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const removeContactFromProperty = async (
  projectId: string,
  propertyId: string,
  associationId: number,
) => {
  await request<void>(`/projects/${projectId}/properties/${propertyId}/contacts/${associationId}`, {
    method: 'DELETE',
  });
};
