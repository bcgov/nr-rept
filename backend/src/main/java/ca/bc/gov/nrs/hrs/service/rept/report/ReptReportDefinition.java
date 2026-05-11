package ca.bc.gov.nrs.hrs.service.rept.report;

import ca.bc.gov.nrs.hrs.dto.rept.report.ReptReportFormat;
import java.util.Arrays;
import java.util.Optional;

public enum ReptReportDefinition {
  REPORT_2100("2100", "Reports/REPT/REPORT_2100", "Upcoming_Payments_Report"),
  REPORT_2101("2101", "Reports/REPT/REPORT_2101", "Right_Of_Way_Inventory_Report"),
  REPORT_2102("2102", "Reports/REPT/REPORT_2102", "Site_Inventory_Report"),
  REPORT_2103("2103", "Reports/REPT/REPORT_2103", "Co-Use_Agreement_Report"),
  REPORT_2104("2104", "Reports/REPT/REPORT_2104", "Expenditure_Disbursement_Report"),
  REPORT_2105("2105", "Reports/REPT/REPORT_2105", "Agreements_By_RC_Report"),
  REPORT_2106("2106", "Reports/REPT/REPORT_2106", "Active_Project_Listing"),
  REPORT_2107("2107", "Reports/REPT/REPORT_2107", "Projects_By_Project_Manager"),
  REPORT_2109("2109", "Reports/REPT/REPORT_2109", "Payments_by_Requesting_Source_Report"),
  REPORT_2161("2161", "Reports/REPT/REPORT_2161", "Payment");

  private final String id;
  private final String jasperPath;
  private final String defaultFilename;

  ReptReportDefinition(String id, String jasperPath, String defaultFilename) {
    this.id = id;
    this.jasperPath = jasperPath;
    this.defaultFilename = defaultFilename;
  }

  public String getId() {
    return id;
  }

  public String getJasperPath() {
    return jasperPath;
  }

  public String buildTargetPath(ReptReportFormat format) {
    return jasperPath + ".rpt." + format.getExtension();
  }

  public String resolveFilename(ReptReportFormat format) {
    return defaultFilename + "." + format.getExtension();
  }

  public static ReptReportDefinition fromId(String reportId) {
    return Optional
        .ofNullable(reportId)
        .flatMap(id -> Arrays.stream(values()).filter(def -> def.id.equalsIgnoreCase(id)).findFirst())
        .orElseThrow(() -> new IllegalArgumentException("Unknown report id: " + reportId));
  }
}
