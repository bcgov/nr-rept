export type NullableString = string | null | undefined;

export interface ReptOrgUnitRef {
  number: number;
  code: NullableString;
  name: NullableString;
}

export interface ExpenseAuthorityDto {
  id: number;
  name: string;
  active: boolean;
}

export interface ExpenseAuthorityRequest {
  name: string;
  active?: boolean | null;
}

export interface ExpenseAuthoritySearch {
  query?: string;
  active?: boolean | null;
}

export interface RequestingSourceDto {
  id: number;
  name: string;
  external: boolean;
  orgUnit?: ReptOrgUnitRef | null;
  revisionCount?: number | null;
}

export interface RequestingSourceSearch {
  query?: string;
  external?: boolean | null;
}

export interface RequestingSourceRequest {
  name: string | null;
  external?: boolean | null;
  orgUnitNumber?: number | null;
  revisionCount?: number | null;
}

export interface CoUserDto {
  id: number;
  name: string;
  external: boolean;
  orgUnit?: ReptOrgUnitRef | null;
  revisionCount?: number | null;
}

export interface CoUserSearch {
  query?: string;
  external?: boolean | null;
}

export interface CoUserRequest {
  name: string | null;
  external?: boolean | null;
  orgUnitNumber?: number | null;
  revisionCount?: number | null;
}

export interface ContactAdminDto {
  id: number;
  revisionCount?: number | null;
  displayName?: NullableString;
  firstName?: NullableString;
  lastName?: NullableString;
  companyName?: NullableString;
  address?: NullableString;
  city?: NullableString;
  provinceState?: NullableString;
  country?: NullableString;
  postalZipCode?: NullableString;
  email?: NullableString;
  phone?: NullableString;
  fax?: NullableString;
}

export interface ContactSearchCriteria {
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export interface ContactUpsertRequest {
  revisionCount?: number | null;
  firstName?: NullableString;
  lastName?: NullableString;
  companyName?: NullableString;
  address?: NullableString;
  city?: NullableString;
  provinceState?: NullableString;
  country?: NullableString;
  postalZipCode?: NullableString;
  email?: NullableString;
  phone?: NullableString;
  fax?: NullableString;
}

export type OrgUnitSearchResult = ReptOrgUnitRef;

export type OrgUnitSearchCriteria = {
  query?: string;
};

export interface QualifiedReceiverDto {
  id: number;
  name: string;
  active: boolean;
}

export interface QualifiedReceiverSearch {
  query?: string;
  active?: boolean | null;
}

export interface QualifiedReceiverRequest {
  sourceName: string;
  active?: boolean | null;
}
