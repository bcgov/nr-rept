package ca.bc.gov.nrs.hrs.exception;

public class ReportNotFoundException extends RuntimeException {

  public ReportNotFoundException(String reportId) {
    super("Report not found: " + reportId);
  }

  public ReportNotFoundException(String reportId, Throwable cause) {
    super("Report not found: " + reportId, cause);
  }
}
