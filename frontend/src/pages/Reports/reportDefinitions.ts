import type { ReportFormat, ReptReportId } from '@/services/reports/types';

export type SortOption = {
  value: string;
  label: string;
};

export type ReportFieldKey =
  | 'dateRange'
  | 'agreementType'
  | 'agreementActive'
  | 'sortOptions'
  | 'region'
  | 'district'
  | 'bctsOffice'
  | 'agreementExists'
  | 'projectStatus';

export type ReportDefinition = {
  id: ReptReportId;
  title: string;
  summary: string;
  defaults?: Partial<Record<string, string | boolean>>;
  availableFormats: ReportFormat[];
  fields: {
    dateRange?: boolean;
    agreementType?: boolean;
    agreementActive?: boolean;
    sortOptions?: SortOption[];
    region?: boolean;
    district?: boolean;
    bctsOffice?: boolean;
    agreementExists?: boolean;
    projectStatus?: boolean;
  };
  /**
   * Ordered rows of fields. Each inner array becomes a field-group row in the
   * 3-column grid, so columns line up across rows. If a row has fewer than 3
   * keys, trailing columns stay empty (this is what creates visual alignment
   * with neighbouring rows that have more fields).
   */
  layout?: ReportFieldKey[][];
};

const YES_NO_OPTIONS: SortOption[] = [
  { value: '', label: 'All' },
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' },
];

const makeSortOptions = (entries: [string, string][]): SortOption[] =>
  entries.map(([value, label]) => ({ value, label }));

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: '2100',
    title: 'Upcoming Payments',
    summary:
      'List upcoming agreement payments within a date range, filtered by agreement type and status.',
    availableFormats: ['pdf'],
    defaults: {
      sortColumn: 'project_name',
    },
    fields: {
      dateRange: true,
      agreementType: true,
      agreementActive: true,
      sortOptions: makeSortOptions([
        ['project_name', 'Project name'],
        ['project_file', 'Project file'],
        ['project_number', 'Project number'],
        ['pc_date', 'PC date'],
        ['anniversary_date', 'Anniversary date'],
      ]),
    },
    layout: [['dateRange'], ['agreementType', 'agreementActive', 'sortOptions']],
  },
  {
    id: '2101',
    title: 'Right of Way Inventory',
    summary: 'Inventory of rights of way filtered by agreement status and optional date range.',
    availableFormats: ['pdf'],
    defaults: {
      sortColumn: 'project_name',
    },
    fields: {
      dateRange: true,
      agreementActive: true,
      sortOptions: makeSortOptions([
        ['project_name', 'Project name'],
        ['project_file', 'Project file'],
        ['project_number', 'Project number'],
        ['source_name', 'Source name'],
        ['region_name', 'Region name'],
        ['district_bcts_name', 'District / BCTS name'],
        ['expiry_date', 'Expiry date'],
      ]),
    },
    layout: [['dateRange'], ['agreementActive', 'sortOptions']],
  },
  {
    id: '2102',
    title: 'Site Agreement Inventory',
    summary: 'Inventory all site agreements by status with optional date range filtering.',
    availableFormats: ['pdf'],
    defaults: {
      sortColumn: 'project_name',
    },
    fields: {
      dateRange: true,
      agreementActive: true,
      sortOptions: makeSortOptions([
        ['project_name', 'Project name'],
        ['project_file', 'Project file'],
        ['project_number', 'Project number'],
        ['source_name', 'Source name'],
        ['region_name', 'Region name'],
        ['district_bcts_name', 'District / BCTS name'],
        ['expiry_date', 'Expiry date'],
      ]),
    },
    layout: [['dateRange'], ['agreementActive', 'sortOptions']],
  },
  {
    id: '2103',
    title: 'Co-Use Agreement Inventory',
    summary: 'Report co-use agreements with optional filters and sortable output.',
    availableFormats: ['pdf'],
    defaults: {
      sortColumn: 'project_name',
    },
    fields: {
      dateRange: true,
      agreementActive: true,
      sortOptions: makeSortOptions([
        ['project_name', 'Project name'],
        ['project_file', 'Project file'],
        ['project_number', 'Project number'],
        ['co_user_name', 'Co-user name'],
        ['tenure_term', 'Tenure term'],
        ['expiry_date', 'Expiry date'],
        ['pc_date', 'PC date'],
      ]),
    },
    layout: [['dateRange'], ['agreementActive', 'sortOptions']],
  },
  {
    id: '2104',
    title: 'Expenditure Disbursement',
    summary: 'Summarize payments by type, service line, and agreement characteristics.',
    availableFormats: ['pdf'],
    defaults: {
      sortColumn: 'service_line',
    },
    fields: {
      dateRange: true,
      agreementType: true,
      sortOptions: makeSortOptions([
        ['service_line', 'Service line'],
        ['project_name', 'Project name'],
        ['project_file', 'Project file'],
        ['project_number', 'Project number'],
        ['payment_type', 'Payment type'],
        ['payment_amount', 'Payment amount'],
      ]),
    },
    layout: [['dateRange'], ['agreementType', 'sortOptions']],
  },
  {
    id: '2105',
    title: 'Projects by RC',
    summary:
      'List projects grouped by region, district, and BCTS office with agreement status flags.',
    availableFormats: ['pdf'],
    fields: {
      dateRange: true,
      region: true,
      district: true,
      bctsOffice: true,
      agreementActive: true,
      agreementExists: true,
    },
    layout: [
      ['dateRange'],
      ['agreementActive', 'region', 'district'],
      ['bctsOffice'],
      ['agreementExists'],
    ],
  },
  {
    id: '2106',
    title: 'Active Project Listing',
    summary: 'Active projects filtered by geography with sortable ordering.',
    availableFormats: ['pdf'],
    defaults: {
      sortColumn: 'project_file',
    },
    fields: {
      region: true,
      district: true,
      bctsOffice: true,
      sortOptions: makeSortOptions([
        ['project_file', 'Project file'],
        ['project_name', 'Project name'],
        ['project_number', 'Project number'],
        ['region_name', 'Region name'],
        ['district_bcts_name', 'District / BCTS name'],
      ]),
    },
    layout: [['region', 'district'], ['bctsOffice'], ['sortOptions']],
  },
  {
    id: '2107',
    title: 'Projects by Project Manager',
    summary: 'Show projects assigned to managers with optional region and status filters.',
    availableFormats: ['pdf'],
    defaults: {
      sortColumn: 'project_manager_name',
    },
    fields: {
      region: true,
      district: true,
      bctsOffice: true,
      projectStatus: true,
      sortOptions: makeSortOptions([
        ['project_manager_name', 'Project manager name'],
        ['project_manager_assign_date', 'Manager assigned date'],
        ['project_name', 'Project name'],
        ['project_file', 'Project file'],
        ['project_number', 'Project number'],
        ['volume', 'Volume'],
      ]),
    },
    layout: [['region', 'district'], ['bctsOffice'], ['projectStatus', 'sortOptions']],
  },
  {
    id: '2109',
    title: 'Payments by Requesting Source',
    summary: 'Payment history filtered by agreement type, status, and requesting source.',
    availableFormats: ['pdf'],
    defaults: {
      sortColumn: 'source_name',
    },
    fields: {
      dateRange: true,
      agreementType: true,
      agreementActive: true,
      sortOptions: makeSortOptions([
        ['source_name', 'Requesting source'],
        ['agreement_type', 'Agreement type'],
        ['agreement_expiry_date', 'Agreement expiry date'],
        ['payment_request_date', 'Payment request date'],
        ['payment_amount', 'Payment amount'],
      ]),
    },
    layout: [['dateRange'], ['agreementType', 'agreementActive', 'sortOptions']],
  },
];

export const AGREEMENT_ACTIVE_OPTIONS = YES_NO_OPTIONS;
