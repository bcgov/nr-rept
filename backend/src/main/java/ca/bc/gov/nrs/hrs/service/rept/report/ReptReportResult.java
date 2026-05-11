package ca.bc.gov.nrs.hrs.service.rept.report;

import org.springframework.http.MediaType;

public record ReptReportResult(byte[] content, String filename, MediaType mediaType) {}
