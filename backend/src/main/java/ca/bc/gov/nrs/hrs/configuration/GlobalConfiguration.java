package ca.bc.gov.nrs.hrs.configuration;

import ca.bc.gov.nrs.hrs.dto.CodeDescriptionDto;
import ca.bc.gov.nrs.hrs.dto.CodeNameDto;
import ca.bc.gov.nrs.hrs.dto.rept.report.ReptReportRequestDto;
import ca.bc.gov.nrs.hrs.exception.NotFoundGenericException;
import ca.bc.gov.nrs.hrs.exception.ReportGenerationException;
import ca.bc.gov.nrs.hrs.exception.ReportNotFoundException;
import ca.bc.gov.nrs.hrs.exception.RequestException;
import ca.bc.gov.nrs.hrs.exception.RetriableException;
import ca.bc.gov.nrs.hrs.exception.TooManyRequestsException;
import ca.bc.gov.nrs.hrs.exception.UnretriableException;
import ca.bc.gov.nrs.hrs.exception.UserNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import org.springframework.aot.hint.annotation.RegisterReflectionForBinding;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Configuration
@RegisterReflectionForBinding({
  CodeDescriptionDto.class,
  CodeNameDto.class,
  NotFoundGenericException.class,
  ReportGenerationException.class,
  ReportNotFoundException.class,
  RequestException.class,
  RetriableException.class,
  TooManyRequestsException.class,
  UnretriableException.class,
  UserNotFoundException.class,
  ReptReportRequestDto.class
})
public class GlobalConfiguration {

  @Bean
  public RestClient jasperReportClient(HrsConfiguration configuration) {
    HrsConfiguration.ReportingConfiguration reporting = configuration.getReporting();
    if (reporting == null || reporting.getJasper() == null) {
      throw new IllegalStateException("Reporting Jasper configuration must be provided");
    }

    HrsConfiguration.JasperConfiguration jasper = reporting.getJasper();
    if (!StringUtils.hasText(jasper.getBaseUrl())) {
      throw new IllegalStateException("Reporting Jasper base URL must be provided");
    }

  SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
  applyTimeout(jasper.getConnectTimeout(), requestFactory::setConnectTimeout);
  applyTimeout(jasper.getReadTimeout(), requestFactory::setReadTimeout);

    RestClient.Builder builder = RestClient
        .builder()
        .baseUrl(jasper.getBaseUrl())
        .requestFactory(requestFactory)
        .defaultHeader(HttpHeaders.ACCEPT, MediaType.ALL_VALUE);

    if (StringUtils.hasText(jasper.getUsername()) && StringUtils.hasText(jasper.getPassword())) {
      String credentials = jasper.getUsername() + ":" + jasper.getPassword();
      String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
      builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + encoded);
    }

    return builder.build();
  }

  @Bean
  public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
    return builder.build();
  }

  private void applyTimeout(Duration duration, java.util.function.Consumer<Integer> consumer) {
    if (duration != null) {
      consumer.accept(Math.toIntExact(duration.toMillis()));
    }
  }

}
