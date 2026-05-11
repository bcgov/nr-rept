package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportRequestDto;
import ca.bc.gov.nrs.rept.exception.ReportGenerationException;
import ca.bc.gov.nrs.rept.exception.ReportNotFoundException;
import ca.bc.gov.nrs.rept.service.rept.report.ReptReportResult;
import ca.bc.gov.nrs.rept.service.rept.report.ReptReportService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@Validated
public class ReptReportController {

  private final ReptReportService reportService;

  public ReptReportController(ReptReportService reportService) {
    this.reportService = reportService;
  }

  @PostMapping("/{reportId}")
  public ResponseEntity<byte[]> generateReport(
      @PathVariable("reportId") String reportId,
      @Valid @RequestBody ReptReportRequestDto request
  ) {
    ReptReportResult result = reportService.generateReport(reportId, request);

    ContentDisposition disposition = ContentDisposition
        .attachment()
        .filename(result.filename(), StandardCharsets.UTF_8)
        .build();

    return ResponseEntity
        .ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
        .contentType(result.mediaType())
        .body(result.content());
  }

  @ExceptionHandler(ReportNotFoundException.class)
  public ResponseEntity<ProblemDetail> handleNotFound(ReportNotFoundException exception) {
    ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(detail);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ProblemDetail> handleBadRequest(IllegalArgumentException exception) {
    ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    return ResponseEntity.badRequest().body(detail);
  }

  @ExceptionHandler(ReportGenerationException.class)
  public ResponseEntity<ProblemDetail> handleReportFailure(ReportGenerationException exception) {
    ProblemDetail detail = ProblemDetail.forStatusAndDetail(
        HttpStatus.BAD_GATEWAY,
        exception.getMessage()
    );
    return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(detail);
  }
}
