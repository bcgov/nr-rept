package ca.bc.gov.nrs.rept.service.rept.report;

import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportRequestDto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ReptReportParameterProvider {

  private static final LocalDate DEFAULT_START_DATE = LocalDate.of(1900, 1, 1);
  private static final LocalDate DEFAULT_END_DATE = LocalDate.of(9999, 12, 31);

  public Map<String, Object> buildJasperParameters(
      ReptReportDefinition definition,
      ReptReportRequestDto request
  ) {
    return switch (definition) {
      case REPORT_2100 -> params2100(request);
      case REPORT_2101 -> params2101(request);
      case REPORT_2102 -> params2102(request);
      case REPORT_2103 -> params2103(request);
      case REPORT_2104 -> params2104(request);
      case REPORT_2105 -> params2105(request);
      case REPORT_2106 -> params2106(request);
      case REPORT_2107 -> params2107(request);
      case REPORT_2109 -> params2109(request);
      case REPORT_2161 -> params2161(request);
    };
  }

  private Map<String, Object> params2100(ReptReportRequestDto request) {
    Map<String, Object> params = new HashMap<>();
    putDateRange(params, request);
    params.put("IN_AGREEMENT_TYPE", trimToEmpty(request.agreementType()));
    params.put("IN_AGREEMENT_ACTIVE", trimToEmpty(request.agreementActive()));
    params.put("IN_RESCIND_IND", "");
    params.put("IN_SORT_COLUMN", defaultIfBlank(request.sortColumn(), "project_name"));
    return params;
  }

  private Map<String, Object> params2101(ReptReportRequestDto request) {
    Map<String, Object> params = new HashMap<>();
    putDateRange(params, request);
    params.put("IN_AGREEMENT_ACTIVE", trimToEmpty(request.agreementActive()));
    params.put("IN_SORT_COLUMN", defaultIfBlank(request.sortColumn(), "project_name"));
    return params;
  }

  private Map<String, Object> params2102(ReptReportRequestDto request) {
    Map<String, Object> params = new HashMap<>();
    putDateRange(params, request);
    params.put("IN_AGREEMENT_ACTIVE", trimToEmpty(request.agreementActive()));
    params.put("IN_SORT_COLUMN", defaultIfBlank(request.sortColumn(), "project_name"));
    return params;
  }

  private Map<String, Object> params2103(ReptReportRequestDto request) {
    Map<String, Object> params = new HashMap<>();
    putDateRange(params, request);
    params.put("IN_AGREEMENT_ACTIVE", trimToEmpty(request.agreementActive()));
    params.put("IN_SORT_COLUMN", defaultIfBlank(request.sortColumn(), "project_name"));
    return params;
  }

  private Map<String, Object> params2104(ReptReportRequestDto request) {
    Map<String, Object> params = new HashMap<>();
    putDateRange(params, request);
    params.put("IN_AGREEMENT_TYPE", trimToEmpty(request.agreementType()));
    params.put("IN_SORT_COLUMN", defaultIfBlank(request.sortColumn(), "service_line"));
    return params;
  }

  private Map<String, Object> params2105(ReptReportRequestDto request) {
    Map<String, Object> params = new HashMap<>();
    params.put("IN_REGION_NO", trimToEmpty(request.region()));
    params.put("IN_DISTRICT_NO", trimToEmpty(request.district()));
    params.put("IN_BCTS_NO", trimToEmpty(request.bctsOffice()));
    putDateRange(params, request);
    params.put("IN_AGREEMENT_ACTIVE", trimToEmpty(request.agreementActive()));
    params.put("IN_AGREEMENT_EXISTS", Boolean.TRUE.equals(request.agreementExists()) ? "Y" : "");
    return params;
  }

  private Map<String, Object> params2106(ReptReportRequestDto request) {
    Map<String, Object> params = new HashMap<>();
    params.put("IN_REGION_NO", trimToEmpty(request.region()));
    params.put("IN_DISTRICT_NO", trimToEmpty(request.district()));
    params.put("IN_BCTS_NO", trimToEmpty(request.bctsOffice()));
    params.put("IN_SORT_COLUMN", defaultIfBlank(request.sortColumn(), "project_file"));
    return params;
  }

  private Map<String, Object> params2107(ReptReportRequestDto request) {
    Map<String, Object> params = new HashMap<>();
    params.put("IN_REGION_NO", trimToEmpty(request.region()));
    params.put("IN_DISTRICT_NO", trimToEmpty(request.district()));
    params.put("IN_BCTS_NO", trimToEmpty(request.bctsOffice()));
    params.put("IN_STATUS", trimToEmpty(request.projectStatus()));
    params.put("IN_SORT_COLUMN", defaultIfBlank(request.sortColumn(), "project_manager_name"));
    return params;
  }

  private Map<String, Object> params2109(ReptReportRequestDto request) {
    Map<String, Object> params = new HashMap<>();
    putDateRange(params, request);
    params.put("IN_AGREEMENT_TYPE", trimToEmpty(request.agreementType()));
    params.put("IN_AGREEMENT_ACTIVE", trimToEmpty(request.agreementActive()));
    params.put("IN_SORT_COLUMN", defaultIfBlank(request.sortColumn(), "source_name"));
    return params;
  }

  private Map<String, Object> params2161(ReptReportRequestDto request) {
    Long paymentId = request.paymentId();
    if (paymentId == null || paymentId <= 0) {
      throw new IllegalArgumentException("Payment ID is required for report 2161");
    }
    Map<String, Object> params = new HashMap<>();
    params.put("IN_PAYMENT_ID", BigDecimal.valueOf(paymentId));
    return params;
  }

  private void putDateRange(Map<String, Object> params, ReptReportRequestDto request) {
    LocalDate start = request.startDate() != null ? request.startDate() : DEFAULT_START_DATE;
    LocalDate end = request.endDate() != null ? request.endDate() : DEFAULT_END_DATE;
    params.put("IN_START_DATE", toDate(start));
    params.put("IN_END_DATE", toDate(end));
  }

  private static Date toDate(LocalDate date) {
    return Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
  }

  private static String trimToEmpty(String value) {
    return value == null ? "" : value.trim();
  }

  private static String defaultIfBlank(String value, String fallback) {
    String trimmed = trimToEmpty(value);
    return trimmed.isEmpty() ? fallback : trimmed;
  }
}
