package ca.bc.gov.nrs.rept.configuration;

import ca.bc.gov.nrs.rept.dto.CodeDescriptionDto;
import ca.bc.gov.nrs.rept.dto.CodeNameDto;
import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportRequestDto;
import ca.bc.gov.nrs.rept.exception.NotFoundGenericException;
import ca.bc.gov.nrs.rept.exception.ReportGenerationException;
import ca.bc.gov.nrs.rept.exception.ReportNotFoundException;
import ca.bc.gov.nrs.rept.exception.RequestException;
import ca.bc.gov.nrs.rept.exception.RetriableException;
import ca.bc.gov.nrs.rept.exception.TooManyRequestsException;
import ca.bc.gov.nrs.rept.exception.UnretriableException;
import ca.bc.gov.nrs.rept.exception.UserNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.aot.hint.annotation.RegisterReflectionForBinding;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

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
  public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
    return builder.build();
  }
}
