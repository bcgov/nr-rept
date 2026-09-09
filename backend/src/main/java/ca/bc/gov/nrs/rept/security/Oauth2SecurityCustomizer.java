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
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.resource.OAuth2ResourceServerConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

/**
 * Configures the OAuth 2.0 Resource Server to validate BC Gov SSO (Keycloak)
 * <strong>access tokens</strong>.
 *
 * <h3>Why there is no {@code token_use} check any more</h3>
 * This customizer used to reject any token whose {@code token_use} claim was not
 * {@code "access"} — a Cognito-specific claim that distinguished ID tokens from access
 * tokens. <b>Keycloak does not emit {@code token_use} at all</b>, so that validator would
 * fail every single request. It is replaced by the {@code azp} check below, which covers the
 * adjacent and more useful case.
 *
 * <h3>Why {@code azp} is checked</h3>
 * The BC Gov SSO standard realm is shared by many applications. Their clients all issue
 * tokens signed by the same issuer and verifiable against the same JWKS, so
 * <b>signature and issuer validation alone do not establish that a token was meant for
 * REPT</b> — only that the realm minted it.
 *
 * <p>In practice {@code client_roles} already limits the damage, because a token issued to
 * another client carries that client's roles and would not hold {@code REPT_ADMIN}. But that
 * is a property of how CSS happens to populate the claim rather than a control this service
 * enforces, and it is exactly the sort of implicit guarantee that stops holding the moment
 * somebody adds a role mapper. One comparison closes it.
 *
 * <p>The expected client id is configuration, not a constant: it differs per environment, and
 * a deployment pointed at the wrong realm should fail loudly rather than accept whatever that
 * realm signs.
 */
@Component
public class Oauth2SecurityCustomizer implements
    Customizer<OAuth2ResourceServerConfigurer<HttpSecurity>> {

  private static final Logger LOGGER = LoggerFactory.getLogger(Oauth2SecurityCustomizer.class);

  /** Roles CSS attaches to a token for the client it was issued to. */
  private static final String CLAIM_CLIENT_ROLES = "client_roles";

  /** Where stock Keycloak puts the same information. */
  private static final String CLAIM_RESOURCE_ACCESS = "resource_access";

  private static final String CLAIM_AZP = "azp";

  /**
   * FAM's own bookkeeping roles, which reach the token like any other role.
   *
   * <p>Per-grant expiry dates are recorded in CSS as roles assigned to the person, shaped
   * {@code FAM:EXPIRES:2026-09-30:REPT_ADMIN} — a role is a name and nothing else, so it is
   * the only way CSS can record something about one grant. They are harmless to exact-match
   * authorisation but would otherwise show up as granted authorities anywhere REPT enumerates
   * them.
   */
  private static final String FAM_SIDECAR_PREFIX = "FAM:";

  private final String jwkSetUri;
  private final String expectedClientId;
  private final NimbusJwtDecoder jwtDecoder;

  public Oauth2SecurityCustomizer(
      @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri,
      @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri,
      @Value("${ca.bc.gov.nrs.keycloak.client-id}") String expectedClientId
  ) {
    this.jwkSetUri = jwkSetUri;
    this.expectedClientId = expectedClientId;
    this.jwtDecoder = buildJwtDecoder(jwkSetUri);

    // ── Validate issuer + the client the token was issued to ─────────
    this.jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefaultWithIssuer(issuerUri),
        this::validateAuthorizedParty
    ));
  }

  /**
   * Refuses a token minted by our realm for somebody else's client.
   *
   * <p>The failure message names neither the expected nor the received client id: the caller
   * holds a valid token for some client and does not need to be told which one this API wants.
   * The mismatch is logged instead, where an operator can see it.
   */
  private OAuth2TokenValidatorResult validateAuthorizedParty(Jwt token) {
    String azp = token.getClaimAsString(CLAIM_AZP);
    if (expectedClientId.equals(azp)) {
      return OAuth2TokenValidatorResult.success();
    }
    LOGGER.warn("Rejected a token issued to client '{}'; this API accepts only '{}'.",
        azp, expectedClientId);
    return OAuth2TokenValidatorResult.failure(
        new OAuth2Error(
            "invalid_token",
            "This token was not issued to this application.",
            null
        )
    );
  }

  @Override
  public void customize(
      OAuth2ResourceServerConfigurer<HttpSecurity> customize) {
    LOGGER.info("Configuring OAuth2 resource server with JWK set URI: {} (client: {})",
        jwkSetUri, expectedClientId);
    customize.jwt(jwt -> jwt.jwtAuthenticationConverter(converter()).decoder(jwtDecoder));
  }

  /**
   * Builds a JWT decoder backed by Nimbus's {@link JWKSourceBuilder}, which provides:
   * <ul>
   *   <li><b>Cached JWKS</b> — fetched once and reused for ~5 min, eliminating per-request
   *       round-trips to the realm.</li>
   *   <li><b>Refresh-ahead caching</b> — re-fetches the JWKS in the background BEFORE it
   *       expires, so user-facing requests never block on a refresh.</li>
   *   <li><b>Retry on transient failures</b> — automatically retries the JWKS fetch when
   *       the endpoint returns an error or times out.</li>
   *   <li><b>Explicit HTTP timeouts</b> — connect and read timeouts on the JWKS fetch.</li>
   * </ul>
   * This replaces the default Spring decoder builder, which uses a no-op Spring cache and
   * causes intermittent {@code Connect timed out} 401s whenever the IdP has a brief hiccup.
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
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(Oauth2SecurityCustomizer::extractAuthorities);
    return converter;
  }

  /**
   * Reads the caller's roles for the client this token was issued to.
   *
   * <p>Under CSS these arrive as {@code client_roles}. Falls back to
   * {@code resource_access.<azp>.roles}, which is where stock Keycloak puts them — which one
   * appears depends on the realm's mappers, so both are read rather than assuming.
   *
   * <p>Authorities are used with no prefix: {@code REPT_ADMIN} and {@code REPT_VIEWER} are
   * matched verbatim by {@link ApiAuthorizationCustomizer}, and the role codes in CSS are
   * spelled exactly the same as the Cognito groups they replace.
   */
  private static Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
    List<String> roles = jwt.getClaimAsStringList(CLAIM_CLIENT_ROLES);

    if (roles == null || roles.isEmpty()) {
      roles = rolesFromResourceAccess(jwt);
    }

    return roles.stream()
        .filter(role -> !role.startsWith(FAM_SIDECAR_PREFIX))
        .map(role -> (GrantedAuthority) new SimpleGrantedAuthority(role))
        .toList();
  }

  /** {@code resource_access.<azp>.roles}, or an empty list when it is absent or malformed. */
  private static List<String> rolesFromResourceAccess(Jwt jwt) {
    Object resourceAccess = jwt.getClaim(CLAIM_RESOURCE_ACCESS);
    String clientId = jwt.getClaimAsString(CLAIM_AZP);

    if (!(resourceAccess instanceof Map<?, ?> byClient) || clientId == null) {
      return List.of();
    }

    if (byClient.get(clientId) instanceof Map<?, ?> entry
        && entry.get("roles") instanceof List<?> roles) {
      return roles.stream()
          .filter(String.class::isInstance)
          .map(String.class::cast)
          .toList();
    }
    return List.of();
  }

}
