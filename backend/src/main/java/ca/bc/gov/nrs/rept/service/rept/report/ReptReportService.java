package ca.bc.gov.nrs.rept.service.rept.report;

import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportFormat;
import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportRequestDto;
import ca.bc.gov.nrs.rept.exception.ReportGenerationException;
import ca.bc.gov.nrs.rept.exception.ReportNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.sql.DataSource;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class ReptReportService {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptReportService.class);

  private final DataSource dataSource;
  private final ReptReportParameterProvider parameterProvider;
  private final ConcurrentHashMap<String, JasperReport> compiledCache = new ConcurrentHashMap<>();

  public ReptReportService(DataSource dataSource, ReptReportParameterProvider parameterProvider) {
    this.dataSource = dataSource;
    this.parameterProvider = parameterProvider;
  }

  public ReptReportResult generateReport(String reportId, ReptReportRequestDto request) {
    ReptReportDefinition definition = ReptReportDefinition.fromId(reportId);
    ReptReportFormat format = ReptReportFormat.fromNullable(request.format());
    if (format != ReptReportFormat.PDF) {
      throw new IllegalArgumentException(
          "Embedded engine currently supports PDF only; requested " + format.name());
    }
    validateRequest(definition, request);

    Map<String, Object> params = parameterProvider.buildJasperParameters(definition, request);
    JasperReport jasperReport = compiledCache.computeIfAbsent(definition.getId(), id -> compileTemplate(definition));

    try (Connection connection = dataSource.getConnection()) {
      JasperPrint print = JasperFillManager.fillReport(jasperReport, params, connection);
      byte[] pdf = JasperExportManager.exportReportToPdf(print);
      if (pdf == null || pdf.length == 0) {
        throw new ReportGenerationException("Empty PDF produced for report " + reportId);
      }
      return new ReptReportResult(pdf, definition.resolveFilename(format), format.getMediaType());
    } catch (JRException ex) {
      LOGGER.error("Jasper fill/export failed for [{}]", reportId, ex);
      throw new ReportGenerationException("Failed to render report " + reportId, ex);
    } catch (SQLException ex) {
      LOGGER.error("Database connection failed for report [{}]", reportId, ex);
      throw new ReportGenerationException("Database connection failed for report " + reportId, ex);
    }
  }

  private JasperReport compileTemplate(ReptReportDefinition definition) {
    String path = "reports/" + definition.name() + ".jrxml";
    ClassPathResource resource = new ClassPathResource(path);
    if (!resource.exists()) {
      throw new ReportNotFoundException(definition.getId(),
          new IllegalStateException("No JRXML template at classpath:" + path));
    }
    try (InputStream is = resource.getInputStream()) {
      return JasperCompileManager.compileReport(is);
    } catch (JRException | IOException ex) {
      throw new ReportGenerationException("Failed to compile JRXML for " + definition.getId(), ex);
    }
  }

  private void validateRequest(ReptReportDefinition definition, ReptReportRequestDto request) {
    if (request.startDate() != null && request.endDate() != null
        && request.startDate().isAfter(request.endDate())) {
      throw new IllegalArgumentException(
          "Start date must not be after end date for report " + definition.getId());
    }
  }
}
