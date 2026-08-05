package ca.bc.gov.nrs.rept.service.rept;

import ca.bc.gov.nrs.rept.client.UserLookupClient;
import ca.bc.gov.nrs.rept.client.UserLookupClient.IdirUser;
import ca.bc.gov.nrs.rept.dto.rept.ReptUserSearchResponseDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptUserSummaryDto;

import io.github.resilience4j.retry.annotation.Retry;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Searches IDIR users via <b>nr-user-lookup-api</b> (see
 * {@link UserLookupClient}), the shared BC Gov identity directory. This
 * replaces the FAM identity-lookup integration REPT used previously — the app
 * no longer calls FAM for user lookups. FAM/Cognito remains the
 * <i>authentication</i> provider, just not the directory.
 *
 * <p>Authentication is handled entirely by {@link UserLookupClient} via a
 * Keycloak {@code client_credentials} service-account token; the caller's
 * Cognito JWT is no longer forwarded downstream.
 *
 * <h3>Configuration</h3>
 * <ul>
 *   <li>{@code ca.bc.gov.nrs.user-lookup.*} — see {@link UserLookupClient}</li>
 *   <li>{@code ca.bc.gov.nrs.user-directory.default-page-size} — optional,
 *       defaults to 50 when the caller doesn't specify a size</li>
 * </ul>
 */
@Service
public class ReptUserDirectoryService {

  private static final Logger LOG = LoggerFactory.getLogger(ReptUserDirectoryService.class);

  private static final Comparator<ReptUserSummaryDto> USER_COMPARATOR =
          Comparator.comparing(ReptUserSummaryDto::displayName,
                          Comparator.nullsLast(String::compareToIgnoreCase))
                  .thenComparing(ReptUserSummaryDto::userId,
                          Comparator.nullsLast(String::compareToIgnoreCase));

  private final UserLookupClient client;
  private final int defaultPageSize;

  public ReptUserDirectoryService(
          UserLookupClient client,
          @Value("${ca.bc.gov.nrs.user-directory.default-page-size:50}") int defaultPageSize
  ) {
    this.client = client;
    this.defaultPageSize = defaultPageSize;
  }

  /**
   * Searches for IDIR users matching the given criteria.
   *
   * @param criteria search fields (at least one of userId, firstName, lastName required)
   * @return paginated search results
   * @throws IllegalArgumentException if no search field is provided
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

    List<ReptUserSummaryDto> results =
            mapItems(client.searchIdir(userId, firstName, lastName, pageSize));

    long total = results.size();
    if (results.size() > pageSize) {
      results = results.subList(0, pageSize);
    }

    LOG.debug("user-lookup search [{} {} {}] returned {} of {} results",
            userId, firstName, lastName, results.size(), total);

    return new ReptUserSearchResponseDto(results, total, 0, pageSize);
  }

  /**
   * Best-effort exact lookup by IDIR username, backed by the lookup API's
   * {@code idir-account-detail} endpoint. Returns {@link Optional#empty()}
   * when the user can't be resolved (not found, lookup API unconfigured, or an
   * upstream error) so callers can fall back to showing the raw id.
   *
   * <p>nr-user-lookup-api keys on the bare IDIR name, so an {@code IDIR\}
   * prefix is stripped before the call.
   */
  public Optional<ReptUserSummaryDto> findByUserId(String userId) {
    if (!StringUtils.hasText(userId)) {
      return Optional.empty();
    }
    String bare = userId.contains("\\") ? userId.substring(userId.indexOf('\\') + 1) : userId;
    try {
      return client.getIdirDetail(bare)
              .map(ReptUserDirectoryService::toSummary)
              .filter(Objects::nonNull);
    } catch (RuntimeException ex) {
      LOG.debug("user-lookup miss for userId={} ({})", userId, ex.getMessage());
      return Optional.empty();
    }
  }

  // ── Response mapping ──────────────────────────────────────────────

  private List<ReptUserSummaryDto> mapItems(List<IdirUser> items) {
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

  private static ReptUserSummaryDto toSummary(IdirUser user) {
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
            null  // idirUserGuid — not provided by nr-user-lookup-api
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
}
