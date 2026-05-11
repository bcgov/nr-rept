export type ReptReportId =
  | '2100'
  | '2101'
  | '2102'
  | '2103'
  | '2104'
  | '2105'
  | '2106'
  | '2107'
  | '2109'
  | '2161';

export type ReportFormat = 'pdf' | 'csv';

export type ReportRequestPayload = {
  startDate?: string | null;
  endDate?: string | null;
  agreementType?: string | null;
  agreementActive?: string | null;
  sortColumn?: string | null;
  region?: string | null;
  district?: string | null;
  bctsOffice?: string | null;
  agreementExists?: boolean | null;
  projectStatus?: string | null;
  format?: ReportFormat | null;
  paymentId?: number | null;
};

export type ReportResponse = {
  blob: Blob;
  filename: string;
  contentType: string;
};
