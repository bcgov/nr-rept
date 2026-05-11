package ca.bc.gov.nrs.rept.service.rept;

import ca.bc.gov.nrs.rept.dto.rept.ReptUserSearchResponseDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptUserSummaryDto;

import io.github.resilience4j.retry.annotation.Retry;
import java.net.URI;
import java.time.Duration;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

/**
 * Searches IDIR users via the identity-lookup API.
 *
 * <p>The service passes the caller's Cognito access token through to the
 * downstream API as a Bearer token. No service-account credentials or
 * Keycloak client are involved.
 *
 * <h3>Configuration</h3>
 * <ul>
 *   <li>{@code ca.bc.gov.nrs.identity-lookup.base-url} — the scheme + host
 *       (e.g. {@code https://identity-lookup.example.gov.bc.ca})</li>
 *       {@code application_id} query parameter required by the API</li>
 *   <li>{@code ca.bc.gov.nrs.identity-lookup.default-page-size} — optional,
 *       defaults to 50</li>
 * </ul>
 */
@Service
public class ReptUserDirectoryService {

  private static final Logger LOG = LoggerFactory.getLogger(ReptUserDirectoryService.class);

  private static final String SEARCH_PATH = "/external/v1/users/identity/idir/search";

  private static final Comparator<ReptUserSummaryDto> USER_COMPARATOR =
          Comparator.comparing(ReptUserSummaryDto::displayName,
                          Comparator.nullsLast(String::compareToIgnoreCase))
                  .thenComparing(ReptUserSummaryDto::userId,
                          Comparator.nullsLast(String::compareToIgnoreCase));

  private final RestClient restClient;
  private final int defaultPageSize;

  public ReptUserDirectoryService(
          @Value("${ca.bc.gov.nrs.identity-lookup.base-url}") String baseUrl,
          @Value("${ca.bc.gov.nrs.identity-lookup.default-page-size:50}") int defaultPageSize,
          @Value("${ca.bc.gov.nrs.identity-lookup.connect-timeout:5s}") Duration connectTimeout,
          @Value("${ca.bc.gov.nrs.identity-lookup.read-timeout:10s}") Duration readTimeout
  ) {
    this.defaultPageSize = defaultPageSize;

    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Math.toIntExact(connectTimeout.toMillis()));
    factory.setReadTimeout(Math.toIntExact(readTimeout.toMillis()));

    this.restClient = RestClient.builder()
            .baseUrl(baseUrl)
            .requestFactory(factory)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .build();
  }

  /**
   * Searches for IDIR users matching the given criteria.
   *
   * @param criteria search fields (at least one of userId, firstName, lastName required)
   * @return paginated search results
   * @throws IllegalArgumentException if no search field is provided
   * @throws IllegalStateException    if no valid bearer token is available
   */
  @Retry(name = "apiRetry")
  public ReptUserSearchResponseDto searchUsers(ReptUserSearchCriteria criteria) {
    if (criteria == null) {
      throw new IllegalArgumentException("Search criteria is required");
    }

    String userId = normalize(criteria.userId());
    String firstName = normalize(criteria.firstName());
    String lastName = normalize(criteria.lastName());

    if (!StringUtils.hasText(userId)
            && !StringUtils.hasText(firstName)
            && !StringUtils.hasText(lastName)) {
      throw new IllegalArgumentException(
              "Provide at least one search field (user ID, first name, or last name)");
    }

    int pageSize = criteria.size() > 0 ? criteria.size() : defaultPageSize;
    String bearerToken = extractBearerToken();

    IdentityLookupResponse response = restClient.get()
            .uri(uriBuilder -> {
              uriBuilder.path(SEARCH_PATH)
                      .queryParam("pageSize", pageSize);
              if (StringUtils.hasText(userId)) {
                uriBuilder.queryParam("userId", userId);
              }
              if (StringUtils.hasText(firstName)) {
                uriBuilder.queryParam("firstName", firstName);
              }
              if (StringUtils.hasText(lastName)) {
                uriBuilder.queryParam("lastName", lastName);
              }
              URI uri = uriBuilder.build();
              LOG.debug("Requesting URL: {}", uri);
              return uri;
            })
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
            .retrieve()
            .body(IdentityLookupResponse.class);

    if (response == null) {
      return new ReptUserSearchResponseDto(List.of(), 0, 0, pageSize);
    }

    List<ReptUserSummaryDto> results = mapItems(response.items());

    LOG.debug("Identity-lookup search [{} {} {}] returned {} results (total {})",
            userId, firstName, lastName, results.size(), response.totalItems());

    return new ReptUserSearchResponseDto(
            results,
            response.totalItems(),
            0,
            response.pageSize()
    );
  }

  // ── Token extraction ──────────────────────────────────────────────

  /**
   * Extracts the raw access token from the current Spring Security context.
   * The token was already validated by the OAuth2 resource server filter chain
   * before reaching this point.
   */
  private String extractBearerToken() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication instanceof JwtAuthenticationToken jwtAuth) {
      return jwtAuth.getToken().getTokenValue();
    }
    throw new IllegalStateException("No valid JWT bearer token in security context");
  }

  // ── Response mapping ──────────────────────────────────────────────

  private List<ReptUserSummaryDto> mapItems(List<IdentityLookupUser> items) {
    if (items == null || items.isEmpty()) {
      return List.of();
    }
    return items.stream()
            .filter(Objects::nonNull)
            .map(ReptUserDirectoryService::toSummary)
            .filter(Objects::nonNull)
            .sorted(USER_COMPARATOR)
            .toList();
  }

  private static ReptUserSummaryDto toSummary(IdentityLookupUser user) {
    String userId = trimmed(user.userId());
    if (!StringUtils.hasText(userId)) {
      return null;
    }
    String firstName = trimmed(user.firstName());
    String lastName = trimmed(user.lastName());
    String displayName = buildDisplayName(firstName, lastName, userId);

    return new ReptUserSummaryDto(
            userId,
            displayName,
            firstName,
            lastName,
            trimmed(user.email()),
            trimmed(user.guid()),
            null  // idirUserGuid — not provided by identity-lookup API
    );
  }

  private static String buildDisplayName(String firstName, String lastName, String fallback) {
    if (StringUtils.hasText(firstName) && StringUtils.hasText(lastName)) {
      return firstName + " " + lastName;
    }
    if (StringUtils.hasText(firstName)) return firstName;
    if (StringUtils.hasText(lastName)) return lastName;
    return fallback;
  }

  private static String trimmed(String value) {
    return value == null ? null : value.trim();
  }

  private String normalize(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    String trimmedValue = value.trim();
    return trimmedValue.isEmpty() ? null : trimmedValue;
  }

  // ── Identity-lookup API response records ──────────────────────────

  /**
   * Maps the top-level JSON response:
   * <pre>{@code { "totalItems": 5, "pageSize": 50, "items": [...] }}</pre>
   */
  private record IdentityLookupResponse(
          long totalItems,
          int pageSize,
          List<IdentityLookupUser> items
  ) {
    IdentityLookupResponse {
      if (items == null) items = Collections.emptyList();
    }
  }

  /**
   * Maps each item in the {@code items} array:
   * <pre>{@code { "userId", "guid", "firstName", "lastName", "email" }}</pre>
   */
  private record IdentityLookupUser(
          String userId,
          String guid,
          String firstName,
          String lastName,
          String email
  ) {
  }
}
