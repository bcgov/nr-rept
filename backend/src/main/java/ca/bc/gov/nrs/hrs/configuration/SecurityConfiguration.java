package ca.bc.gov.nrs.hrs.configuration;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import ca.bc.gov.nrs.hrs.security.ApiAuthorizationCustomizer;
import ca.bc.gov.nrs.hrs.security.CsrfSecurityCustomizer;
import ca.bc.gov.nrs.hrs.security.HeadersSecurityCustomizer;
import ca.bc.gov.nrs.hrs.security.Oauth2SecurityCustomizer;

/**
 * Main security configuration. Integrates existing customizers, but allows disabling security
 * for local development via the APP_SECURITY_DISABLED flag. Also provides a CORS configuration
 * that permits the frontend origin.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

  @Value("${APP_SECURITY_DISABLED:false}")
  private boolean securityDisabled;

  @Value("${ca.bc.gov.nrs.frontend.url:http://localhost:3000}")
  private String allowedOrigins;

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http,
      HeadersSecurityCustomizer headersCustomizer,
      CsrfSecurityCustomizer csrfCustomizer,
      ApiAuthorizationCustomizer apiCustomizer,
      Oauth2SecurityCustomizer oauth2Customizer
  ) throws Exception {

    // If security is disabled (for POC/dev), permit all and skip the customizers.
    if (securityDisabled) {
      http
          .cors(Customizer.withDefaults())
          .csrf(AbstractHttpConfigurer::disable)
          .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
      return http.build();
    }

    // Normal behavior: apply custom security wiring and CORS
    http
        .headers(headersCustomizer)
        .csrf(csrfCustomizer)
        .cors(Customizer.withDefaults())
        .authorizeHttpRequests(apiCustomizer)
        .httpBasic(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .oauth2ResourceServer(oauth2Customizer);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    // Parse allowed origins from environment variable (comma-separated)
    List<String> origins = Arrays.asList(allowedOrigins.split(","));
    configuration.setAllowedOrigins(origins);
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource() {
      @Override
      public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
        return configuration;
      }
    };

    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

}
