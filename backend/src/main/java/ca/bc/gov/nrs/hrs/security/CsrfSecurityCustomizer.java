package ca.bc.gov.nrs.hrs.security;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.stereotype.Component;

/**
 * This class holds the configuration for CSRF handling.
 */
@Component
public class CsrfSecurityCustomizer implements Customizer<CsrfConfigurer<HttpSecurity>> {

  @Override
  public void customize(CsrfConfigurer<HttpSecurity> csrfSpec) {
    // Use withHttpOnlyFalse() to allow JavaScript to read the CSRF token cookie
    CookieCsrfTokenRepository tokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
    
    // Use the default request handler for CSRF token processing
    CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
    
    csrfSpec
        .csrfTokenRepository(tokenRepository)
        .csrfTokenRequestHandler(requestHandler);
  }
}
