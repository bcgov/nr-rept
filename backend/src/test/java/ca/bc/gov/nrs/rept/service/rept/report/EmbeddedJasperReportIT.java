package ca.bc.gov.nrs.rept.service.rept.report;

import static org.assertj.core.api.Assertions.assertThat;

import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportFormat;
import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportRequestDto;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;

/**
 * End-to-end smoke test for the embedded Jasper rendering path through the live
 * service bean. Opt-in: pass {@code -Drept.jasper.poc=true}. Requires the
 * {@code local,oracle} profiles and a reachable Oracle DB.
 */
@SpringBootTest
@ActiveProfiles({"local", "oracle"})
@EnabledIfSystemProperty(named = "rept.jasper.poc", matches = "true")
@DisplayName("IT | Embedded Jasper | all reports")
class EmbeddedJasperReportIT {

  @Autowired
  private ReptReportService reportService;

  @ParameterizedTest(name = "REPORT_{0}")
  @ValueSource(strings = {"2100", "2101", "2102", "2103", "2104", "2105", "2106", "2107", "2109"})
  void generatesPdf(String reportId) throws Exception {
    ReptReportRequestDto request = new ReptReportRequestDto(
        null, null, null, null, null, null, null, null, null, null, ReptReportFormat.PDF, null);

    ReptReportResult result = reportService.generateReport(reportId, request);

    assertThat(result.content()).as("PDF body for " + reportId).isNotEmpty();
    assertThat(result.mediaType()).isEqualTo(MediaType.APPLICATION_PDF);
    assertThat(result.filename()).endsWith(".pdf");

    Path dump = Path.of(System.getProperty("java.io.tmpdir"), "REPORT_" + reportId + "-debug.pdf");
    Files.write(dump, result.content());
  }

  /**
   * 2161 (Payment invoice) needs a real IN_PAYMENT_ID — the JRXML evaluates
   * {@code DecimalFormat.format($F{REQUISITION_AMOUNT})} in its summary band
   * and throws on null. Opt-in via {@code -Drept.jasper.poc.paymentId=12345}.
   */
  @Test
  @EnabledIfSystemProperty(named = "rept.jasper.poc.paymentId", matches = "\\d+")
  void generatesPdfForReport2161() throws Exception {
    long paymentId = Long.parseLong(System.getProperty("rept.jasper.poc.paymentId"));
    ReptReportRequestDto request = new ReptReportRequestDto(
        null, null, null, null, null, null, null, null, null, null, ReptReportFormat.PDF, paymentId);

    ReptReportResult result = reportService.generateReport("2161", request);

    assertThat(result.content()).isNotEmpty();
    assertThat(result.mediaType()).isEqualTo(MediaType.APPLICATION_PDF);

    Path dump = Path.of(System.getProperty("java.io.tmpdir"), "REPORT_2161-debug.pdf");
    Files.write(dump, result.content());
  }
}
