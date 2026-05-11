package ca.bc.gov.nrs.hrs.security;

import ca.bc.gov.nrs.hrs.util.SecurityEnvironmentUtil;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.XXssConfig;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.stereotype.Component;

/**
 * HTTP security headers configuration.
 *
 * <h3>Content-Security-Policy highlights</h3>
 * <ul>
 *   <li>{@code script-src 'self'} — {@code 'unsafe-inline'} has been removed.
 *       The inline snippet that was in {@code index.html} has been moved to
 *       the external {@code config.js} file.</li>
 *   <li>{@code form-action 'self'} — prevents XSS payloads from exfiltrating
 *       data via rogue {@code <form>} submissions to attacker-controlled
 *       hosts.</li>
 *   <li>{@code connect-src} explicitly lists the Cognito domain so that
 *       Amplify token refresh and userInfo calls are permitted.</li>
 * </ul>
 *
 * <h3>HSTS</h3>
 * {@code max-age} is set to <strong>1 year</strong> with {@code includeSubDomains}.
 */
@RequiredArgsConstructor
@Component
public class HeadersSecurityCustomizer implements Customizer<HeadersConfigurer<HttpSecurity>> {

  @Value("${ca.bc.gov.nrs.self-uri}")
  String selfUri;

  private static final List<String> PERMISSIONS = List.of(
      "geolocation",
      "microphone",
      "camera",
      "speaker",
      "usb",
      "bluetooth",
      "payment",
      "interest-cohort"
  );

  /**
   * The environment of the application, which is injected from the application properties. The
   * default value is "PROD".
   */
  @Value("${ca.bc.gov.nrs.environment:PROD}")
  String environment;

  @Override
  public void customize(HeadersConfigurer<HttpSecurity> headerSpec) {
    String policyDirectives;

    if (SecurityEnvironmentUtil.isLocalEnvironment(environment)) {
      // ── Local / development CSP ──────────────────────────────────
      policyDirectives = String.join("; ",
          "default-src 'self'",
          "connect-src 'self' " + selfUri
              + " ws://localhost:* http://localhost:*",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self' data:",
          "object-src 'none'",
          "base-uri 'none'",
          "form-action 'self'",
          "frame-ancestors 'none'"
      );
    } else {
      // ── Production / deployed CSP ────────────────────────────────
      policyDirectives = String.join("; ",
          "default-src 'self'",
          "connect-src 'self' " + selfUri
              + " https://cognito-idp.ca-central-1.amazonaws.com"
              + " https://lza-prod-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self' data:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'"
      );
    }

    headerSpec
        // Clickjacking protection
        .frameOptions(FrameOptionsConfig::deny)

        // Content Security Policy
        .contentSecurityPolicy(csp -> csp.policyDirectives(policyDirectives))

        // HSTS — 1 year, includeSubDomains
        .httpStrictTransportSecurity(hsts ->
            hsts.maxAgeInSeconds(Duration.ofDays(365).getSeconds())
                .includeSubDomains(true))

        // Disable X-XSS-Protection (legacy; can introduce XSS in audit mode)
        .xssProtection(XXssConfig::disable)

        // X-Content-Type-Options: nosniff
        .contentTypeOptions(Customizer.withDefaults())

        // Referrer-Policy
        .referrerPolicy(ref ->
            ref.policy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))

        // Permissions-Policy — deny all sensitive APIs
        .permissionsPolicyHeader(pp ->
            pp.policy(
                PERMISSIONS.stream()
                    .map(p -> String.format("%s=()", p))
                    .collect(Collectors.joining(", "))
            )
        );
  }
}