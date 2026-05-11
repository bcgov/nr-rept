package ca.bc.gov.nrs.rept.security;

import java.time.Duration;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Calls the Cognito {@code /oauth2/userInfo} endpoint to retrieve the
 * {@code custom:idp_*} claims that are present in ID tokens but absent from
 * access tokens.
 *
 * <p>Results are cached in-memory per {@code sub} claim for up to 5 minutes so
 * that the external call is not made on every single API request.
 *
 * <h3>Why this is needed</h3>
 * The application was migrated from sending the Cognito <em>ID token</em> to the
 * backend (an anti-pattern) to sending the <em>access token</em> (the correct
 * OAuth 2.0 pattern). Access tokens carry {@code cognito:groups} for role-based
 * authorization but do <em>not</em> carry the custom profile attributes
 * ({@code custom:idp_name}, {@code custom:idp_username},
 * {@code custom:idp_display_name}, {@code email}, etc.) that several backend
 * services depend on (via {@link ca.bc.gov.nrs.rept.util.JwtPrincipalUtil}).
 *
 * <p>The Cognito userInfo endpoint returns these claims when called with a valid
 * access token, bridging the gap without reverting to the ID-token anti-pattern.
 */
@Service
public class CognitoUserInfoService {

  private static final Logger LOG = LoggerFactory.getLogger(CognitoUserInfoService.class);

  private static final Duration CACHE_TTL = Duration.ofMinutes(5);
  private static final int CACHE_MAX_SIZE = 2000;

  private final String userInfoUri;
  private final RestTemplate restTemplate;

  /**
   * Simple TTL cache: sub → (claims, insertedAtMillis).
   * Using a plain ConcurrentHashMap is sufficient for moderate concurrency;
   * a production system under heavy load could swap this for Caffeine.
   */
  private final ConcurrentHashMap<String, CachedEntry> cache = new ConcurrentHashMap<>();

  public CognitoUserInfoService(
      @Value("${ca.bc.gov.nrs.cognito.userinfo-uri}") String userInfoUri
  ) {
    this.userInfoUri = userInfoUri;
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
    factory.setReadTimeout((int) Duration.ofSeconds(10).toMillis());
    this.restTemplate = new RestTemplate(factory);
    LOG.info("CognitoUserInfoService initialized with URI: {}", userInfoUri);
  }

  /**
   * Returns the full set of user claims (including {@code custom:idp_*},
   * {@code email}, etc.) for the subject identified by the given access token.
   *
   * @param accessToken the raw access-token JWT (used to both identify the
   *                    subject via its {@code sub} claim and to authenticate
   *                    against the userInfo endpoint)
   * @return an unmodifiable map of claim-name → claim-value, or an empty map
   *         if the call fails
   */
  public Map<String, Object> getUserInfo(Jwt accessToken) {
    String sub = accessToken.getSubject();
    if (sub == null || sub.isBlank()) {
      LOG.warn("Access token has no 'sub' claim — cannot resolve user info");
      return Collections.emptyMap();
    }

    // Check cache
    CachedEntry cached = cache.get(sub);
    if (cached != null && !cached.isExpired()) {
      return cached.claims;
    }

    // Call the Cognito userInfo endpoint
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setBearerAuth(accessToken.getTokenValue());
      HttpEntity<Void> entity = new HttpEntity<>(headers);

      ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
          userInfoUri,
          HttpMethod.GET,
          entity,
          new ParameterizedTypeReference<>() {}
      );

      Map<String, Object> claims = response.getBody();
      if (claims == null) {
        claims = Collections.emptyMap();
      }

      // Evict oldest entries if cache is too large (simple size guard)
      if (cache.size() >= CACHE_MAX_SIZE) {
        evictExpired();
      }

      cache.put(sub, new CachedEntry(Collections.unmodifiableMap(claims)));
      return claims;

    } catch (RestClientException e) {
      LOG.error("Failed to call Cognito userInfo endpoint for sub={}: {}", sub, e.getMessage());
      // Return stale cache if available, otherwise empty
      if (cached != null) {
        return cached.claims;
      }
      return Collections.emptyMap();
    }
  }

  /** Removes expired entries from the cache. */
  private void evictExpired() {
    long now = System.currentTimeMillis();
    cache.entrySet().removeIf(entry ->
        (now - entry.getValue().insertedAt) > CACHE_TTL.toMillis()
    );
  }

  private static final class CachedEntry {
    final Map<String, Object> claims;
    final long insertedAt;

    CachedEntry(Map<String, Object> claims) {
      this.claims = claims;
      this.insertedAt = System.currentTimeMillis();
    }

    boolean isExpired() {
      return (System.currentTimeMillis() - insertedAt) > CACHE_TTL.toMillis();
    }
  }
}
