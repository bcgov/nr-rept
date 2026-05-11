package ca.bc.gov.nrs.rept.service.rept.report;

import org.springframework.http.MediaType;

public record ReptReportResult(byte[] content, String filename, MediaType mediaType) {}
