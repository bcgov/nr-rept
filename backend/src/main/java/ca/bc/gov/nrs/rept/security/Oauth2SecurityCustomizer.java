package ca.bc.gov.nrs.rept.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.JWKSourceBuilder;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.util.DefaultResourceRetriever;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.resource.OAuth2ResourceServerConfigurer;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

/**
 * Configures the OAuth 2.0 Resource Server to validate Cognito <strong>access tokens</strong>.
 *
 * <h3>Token-use validation</h3>
 * Cognito JWTs carry a {@code token_use} claim whose value is either {@code "id"} or
 * {@code "access"}. This customizer rejects ID tokens so that only access tokens are
 * accepted by the API — enforcing the correct OAuth 2.0 pattern.
 */
@Component
public class Oauth2SecurityCustomizer implements
    Customizer<OAuth2ResourceServerConfigurer<HttpSecurity>> {

  private static final Logger LOGGER = LoggerFactory.getLogger(Oauth2SecurityCustomizer.class);

  private final String jwkSetUri;
  private final NimbusJwtDecoder jwtDecoder;

  public Oauth2SecurityCustomizer(
      @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri,
      @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri
  ) {
    this.jwkSetUri = jwkSetUri;
    this.jwtDecoder = buildJwtDecoder(jwkSetUri);

    // ── Validate issuer + reject non-access tokens ───────────────────
    this.jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefaultWithIssuer(issuerUri),
        token -> {
          String tokenUse = token.getClaimAsString("token_use");
          if (!"access".equals(tokenUse)) {
            return OAuth2TokenValidatorResult.failure(
                new OAuth2Error(
                    "invalid_token",
                    "Only access tokens are accepted (received token_use="
                        + tokenUse + ")",
                    null
                )
            );
          }
          return OAuth2TokenValidatorResult.success();
        }
    ));
  }

  @Override
  public void customize(
      OAuth2ResourceServerConfigurer<HttpSecurity> customize) {
    LOGGER.info("Configuring OAuth2 resource server with JWK set URI: {}", jwkSetUri);
    customize.jwt(jwt -> jwt.jwtAuthenticationConverter(converter()).decoder(jwtDecoder));
  }

  /**
   * Builds a JWT decoder backed by Nimbus's {@link JWKSourceBuilder}, which provides:
   * <ul>
   *   <li><b>Cached JWKS</b> — fetched once and reused for ~5 min, eliminating per-request
   *       round-trips to Cognito.</li>
   *   <li><b>Refresh-ahead caching</b> — re-fetches the JWKS in the background BEFORE it
   *       expires, so user-facing requests never block on a refresh.</li>
   *   <li><b>Retry on transient failures</b> — automatically retries the JWKS fetch when
   *       the Cognito endpoint returns an error or times out.</li>
   *   <li><b>Explicit HTTP timeouts</b> — connect and read timeouts on the JWKS fetch.</li>
   * </ul>
   * This replaces the default Spring decoder builder, which uses a no-op Spring cache and
   * causes intermittent {@code Connect timed out} 401s whenever Cognito has a brief hiccup.
   */
  private static NimbusJwtDecoder buildJwtDecoder(String jwkSetUri) {
    URL jwkSetUrl;
    try {
      jwkSetUrl = new URI(jwkSetUri).toURL();
    } catch (URISyntaxException | MalformedURLException | IllegalArgumentException e) {
      throw new IllegalStateException("Invalid jwk-set-uri: " + jwkSetUri, e);
    }

    DefaultResourceRetriever retriever = new DefaultResourceRetriever(
        (int) Duration.ofSeconds(10).toMillis(),
        (int) Duration.ofSeconds(15).toMillis(),
        50 * 1024
    );

    JWKSource<SecurityContext> jwkSource = JWKSourceBuilder
        .create(jwkSetUrl, retriever)
        .retrying(true)
        .refreshAheadCache(true)
        .build();

    ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
    processor.setJWSKeySelector(
        new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, jwkSource));
    return new NimbusJwtDecoder(processor);
  }

  private Converter<Jwt, AbstractAuthenticationToken> converter() {
    JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
    grantedAuthoritiesConverter.setAuthoritiesClaimName("cognito:groups");
    grantedAuthoritiesConverter.setAuthorityPrefix("");

    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
    return converter;
  }

}
