package ca.bc.gov.nrs.rept.configuration;

import java.time.Duration;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;
import org.springframework.stereotype.Component;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Component
@ConfigurationProperties("ca.bc.gov.nrs")
public class HrsConfiguration {

  @NestedConfigurationProperty
  private FrontEndConfiguration frontend;
  @NestedConfigurationProperty
  private ReportingConfiguration reporting;

  /**
   * The Front end configuration.
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class FrontEndConfiguration {

    private String url;
    @NestedConfigurationProperty
    private FrontEndCorsConfiguration cors;

  }

  /**
   * The Front end cors configuration.
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class FrontEndCorsConfiguration {

    private List<String> headers;
    private List<String> methods;
    private Duration age;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ReportingConfiguration {

    @NestedConfigurationProperty
    private JasperConfiguration jasper;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class JasperConfiguration {

    private String baseUrl;
    private String username;
    private String password;
    @Builder.Default
    private Duration connectTimeout = Duration.ofSeconds(10);
    @Builder.Default
    private Duration readTimeout = Duration.ofSeconds(60);
  }

}
