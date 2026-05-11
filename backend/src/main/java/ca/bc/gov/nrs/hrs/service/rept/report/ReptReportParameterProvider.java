package ca.bc.gov.nrs.hrs.service.rept.report;

import ca.bc.gov.nrs.hrs.dto.rept.report.ReptReportRequestDto;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Component
public class ReptReportParameterProvider {

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
  private static final LocalDate DEFAULT_START_DATE = LocalDate.of(1900, 1, 1);
  private static final LocalDate DEFAULT_END_DATE = LocalDate.of(9999, 12, 31);

  public MultiValueMap<String, String> buildParameters(
      ReptReportDefinition definition,
      ReptReportRequestDto request,
      String userId
  ) {
    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("user", Objects.requireNonNullElse(userId, ""));
    params.add("RPT_CURSOR", "0");

    switch (definition) {
      case REPORT_2100 -> populate2100(params, request);
      case REPORT_2101 -> populate2101(params, request);
      case REPORT_2102 -> populate2102(params, request);
      case REPORT_2103 -> populate2103(params, request);
      case REPORT_2104 -> populate2104(params, request);
      case REPORT_2105 -> populate2105(params, request);
      case REPORT_2106 -> populate2106(params, request);
      case REPORT_2107 -> populate2107(params, request);
      case REPORT_2109 -> populate2109(params, request);
      case REPORT_2161 -> populate2161(params, request);
      default -> throw new IllegalArgumentException("Unsupported report: " + definition.getId());
    }

    return params;
  }

  private void populate2100(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    addDateRange(params, request);
    params.add("IN_AGREEMENT_TYPE", defaultString(request.agreementType()));
    params.add("IN_AGREEMENT_ACTIVE", defaultString(request.agreementActive()));
    params.add("IN_RESCIND_IND", "");
    params.add("IN_SORT_COLUMN", defaultString(request.sortColumn(), "project_name"));
  }

  private void populate2101(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    addDateRange(params, request);
    params.add("IN_AGREEMENT_ACTIVE", defaultString(request.agreementActive()));
    params.add("IN_SORT_COLUMN", defaultString(request.sortColumn(), "project_name"));
  }

  private void populate2102(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    addDateRange(params, request);
    params.add("IN_AGREEMENT_ACTIVE", defaultString(request.agreementActive()));
    params.add("IN_SORT_COLUMN", defaultString(request.sortColumn(), "project_name"));
  }

  private void populate2103(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    addDateRange(params, request);
    params.add("IN_AGREEMENT_ACTIVE", defaultString(request.agreementActive()));
    params.add("IN_SORT_COLUMN", defaultString(request.sortColumn(), "project_name"));
  }

  private void populate2104(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    addDateRange(params, request);
    params.add("IN_AGREEMENT_TYPE", defaultString(request.agreementType()));
    params.add("IN_SORT_COLUMN", defaultString(request.sortColumn(), "service_line"));
  }

  private void populate2105(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    params.add("IN_REGION_NO", defaultString(request.region()));
    params.add("IN_DISTRICT_NO", defaultString(request.district()));
    params.add("IN_BCTS_NO", defaultString(request.bctsOffice()));
    addDateRange(params, request);
    params.add("IN_AGREEMENT_ACTIVE", defaultString(request.agreementActive()));
    params.add("IN_AGREEMENT_EXISTS", Boolean.TRUE.equals(request.agreementExists()) ? "Y" : "");
  }

  private void populate2106(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    params.add("IN_REGION_NO", defaultString(request.region()));
    params.add("IN_DISTRICT_NO", defaultString(request.district()));
    params.add("IN_BCTS_NO", defaultString(request.bctsOffice()));
    params.add("IN_SORT_COLUMN", defaultString(request.sortColumn(), "project_file"));
  }

  private void populate2107(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    params.add("IN_REGION_NO", defaultString(request.region()));
    params.add("IN_DISTRICT_NO", defaultString(request.district()));
    params.add("IN_BCTS_NO", defaultString(request.bctsOffice()));
    params.add("IN_STATUS", defaultString(request.projectStatus()));
    params.add("IN_SORT_COLUMN", defaultString(request.sortColumn(), "project_manager_name"));
  }

  private void populate2109(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    addDateRange(params, request);
    params.add("IN_AGREEMENT_TYPE", defaultString(request.agreementType()));
    params.add("IN_AGREEMENT_ACTIVE", defaultString(request.agreementActive()));
    params.add("IN_SORT_COLUMN", defaultString(request.sortColumn(), "source_name"));
  }

  private void populate2161(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    // Payment invoice report - requires payment ID
    Long paymentId = request.paymentId();
    if (paymentId == null || paymentId <= 0) {
      throw new IllegalArgumentException("Payment ID is required for report 2161");
    }
    params.add("IN_PAYMENT_ID", String.valueOf(paymentId));
  }

  private void addDateRange(MultiValueMap<String, String> params, ReptReportRequestDto request) {
    params.add("IN_START_DATE", formatStart(request.startDate()));
    params.add("IN_END_DATE", formatEnd(request.endDate()));
  }

  private String formatStart(LocalDate value) {
    LocalDate effective = value != null ? value : DEFAULT_START_DATE;
    return DATE_FORMATTER.format(effective);
  }

  private String formatEnd(LocalDate value) {
    LocalDate effective = value != null ? value : DEFAULT_END_DATE;
    return DATE_FORMATTER.format(effective);
  }

  private String defaultString(String value) {
    return value == null ? "" : value.trim();
  }

  private String defaultString(String value, String fallback) {
    String trimmed = value == null ? "" : value.trim();
    return trimmed.isEmpty() ? fallback : trimmed;
  }
}
