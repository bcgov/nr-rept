package ca.bc.gov.nrs.rept.service.rept.report;

import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportFormat;
import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportRequestDto;
import ca.bc.gov.nrs.rept.exception.ReportGenerationException;
import ca.bc.gov.nrs.rept.exception.ReportNotFoundException;
import ca.bc.gov.nrs.rept.exception.UserNotFoundException;
import ca.bc.gov.nrs.rept.security.LoggedUserHelper;
import java.util.Optional;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class ReptReportService {

  private static final Logger LOGGER = LogManager.getLogger(ReptReportService.class);

  private final RestClient jasperReportClient;
  private final ReptReportParameterProvider parameterProvider;
  private final LoggedUserHelper loggedUserHelper;
  public ReptReportService(
      @Qualifier("jasperReportClient") RestClient jasperReportClient,
      ReptReportParameterProvider parameterProvider,
      LoggedUserHelper loggedUserHelper
  ) {
    this.jasperReportClient = jasperReportClient;
    this.parameterProvider = parameterProvider;
    this.loggedUserHelper = loggedUserHelper;
  }

  public ReptReportResult generateReport(String reportId, ReptReportRequestDto request) {
    ReptReportDefinition definition = ReptReportDefinition.fromId(reportId);
    ReptReportFormat format = ReptReportFormat.fromNullable(request.format());

    String userId = resolveUserId();
    validateRequest(definition, request);
    MultiValueMap<String, String> params = parameterProvider.buildParameters(definition, request, userId);

    if (LOGGER.isDebugEnabled()) {
      LOGGER.debug("Requesting Jasper report [{}] with params {}", reportId, params);
    }

    try {
    ResponseEntity<byte[]> responseEntity = jasperReportClient
          .get()
          .uri(builder -> {
            builder.path(definition.buildTargetPath(format));
            params.forEach((key, values) -> values.forEach(value -> builder.queryParam(key, value)));
            return builder.build();
      })
          .retrieve()
          .toEntity(byte[].class);

      byte[] body = responseEntity.getBody();
      if (body == null || body.length == 0) {
        throw new ReportGenerationException("Report response was empty for id " + reportId);
      }

      MediaType mediaType = Optional.ofNullable(responseEntity.getHeaders().getContentType())
          .orElse(format.getMediaType());
      String filename = Optional
          .ofNullable(responseEntity.getHeaders().getContentDisposition())
          .map(ContentDisposition::getFilename)
          .filter(StringUtils::hasText)
          .orElse(definition.resolveFilename(format));

      return new ReptReportResult(body, filename, mediaType);
    } catch (HttpClientErrorException.NotFound ex) {
      throw new ReportNotFoundException(reportId, ex);
    } catch (RestClientResponseException ex) {
      LOGGER.error("Jasper report request failed [{}]: {}", reportId, ex.getStatusText(), ex);
      throw new ReportGenerationException("Report request failed with status " + ex.getStatusCode(), ex);
    } catch (ResourceAccessException ex) {
      LOGGER.error("Unable to reach Jasper reporting service for [{}]", reportId, ex);
      throw new ReportGenerationException("Unable to reach Jasper reporting service", ex);
    }
  }

  private String resolveUserId() {
    try {
      return loggedUserHelper.getLoggedUserId();
    } catch (UserNotFoundException ex) {
      return "";
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
