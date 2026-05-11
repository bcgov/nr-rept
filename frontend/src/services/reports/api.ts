import { buildApiUrl } from '@/config/api/baseUrl';
import { ensureSessionFresh } from '@/context/auth/refreshSession';
import { buildAuthorizedHeaders } from '@/services/http/headers';

import type { ReportFormat, ReportRequestPayload, ReportResponse, ReptReportId } from './types';

const JSON_HEADERS = {
  'Accept': 'application/octet-stream',
  'Content-Type': 'application/json',
};

const buildUrl = (reportId: ReptReportId) => buildApiUrl(`/reports/${reportId}`);

const sanitizePayload = (payload: ReportRequestPayload): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return;
      }
      cleaned[key] = trimmed;
      return;
    }

    cleaned[key] = value;
  });

  return cleaned;
};

const fallbackFilename = (reportId: ReptReportId, format: ReportFormat): string => {
  return `report-${reportId}.${format}`;
};

const extractFilename = (
  response: Response,
  reportId: ReptReportId,
  format: ReportFormat,
): string => {
  const disposition = response.headers.get('content-disposition');
  if (!disposition) {
    return fallbackFilename(reportId, format);
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // ignore decoding issues and fall back to alternative parsing
    }
  }

  const regularMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (regularMatch && regularMatch[1]) {
    return regularMatch[1];
  }

  return fallbackFilename(reportId, format);
};

export const requestReport = async (
  reportId: ReptReportId,
  payload: ReportRequestPayload,
): Promise<ReportResponse> => {
  await ensureSessionFresh();

  const format = (payload.format ?? 'pdf') as ReportFormat;
  const response = await fetch(buildUrl(reportId), {
    method: 'POST',
    credentials: 'include',
    headers: buildAuthorizedHeaders(JSON_HEADERS),
    body: JSON.stringify(sanitizePayload(payload)),
  });

  if (!response.ok) {
    const error = new Error(`Report request failed with status ${response.status}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const filename = extractFilename(response, reportId, format);
  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';

  return {
    blob,
    filename,
    contentType,
  };
};
