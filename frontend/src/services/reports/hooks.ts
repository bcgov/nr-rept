import { useMutation } from '@tanstack/react-query';

import { requestReport } from './api';

import type { ReportRequestPayload, ReportResponse, ReptReportId } from './types';

export const useGenerateReport = (reportId?: ReptReportId) => {
  return useMutation<ReportResponse, Error, ReportRequestPayload>({
    mutationFn: (payload: ReportRequestPayload) => {
      if (!reportId) {
        return Promise.reject(new Error('Report identifier is required.'));
      }

      return requestReport(reportId, payload);
    },
  });
};
