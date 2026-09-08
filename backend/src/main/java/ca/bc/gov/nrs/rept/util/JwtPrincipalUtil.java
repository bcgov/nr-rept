package ca.bc.gov.nrs.rept.util;

import lombok.NoArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

/**
 * This is a utility class for handling JWT principals. It provides methods to extract various
 * attributes from a JwtAuthenticationToken object. The class is designed with a private constructor
 * to prevent instantiation.
 *
 * <h3>BC Gov SSO (Keycloak) claims</h3>
 * REPT authenticates through the BC Gov SSO standard realm using the <b>IDIR - MFA</b>
 * integration. The claim names below follow the
 * <a href="https://bcgov.github.io/sso-docs/advanced/identity-mappers#idir---mfa">SSO
 * identity mappers reference</a>:
 *
 * <table border="1">
 *   <caption>What replaced the Cognito {@code custom:idp_*} attributes</caption>
 *   <tr><th>REPT field</th><th>Cognito (was)</th><th>Keycloak (now)</th></tr>
 *   <tr><td>username</td><td>{@code custom:idp_username}</td><td>{@code idir_username}</td></tr>
 *   <tr><td>user GUID</td><td>{@code custom:idp_user_id}</td><td>{@code idir_user_guid}</td></tr>
 *   <tr><td>provider</td><td>{@code custom:idp_name}</td><td>{@code identity_provider}</td></tr>
 *   <tr><td>display name</td><td>{@code custom:idp_display_name}</td><td>{@code display_name}</td></tr>
 * </table>
 *
 * <p>These now arrive on the <b>access token</b> itself. Under Cognito they existed only on the
 * ID token, which is why the backend had to call {@code /oauth2/userInfo} on every request to
 * recover them; that service is gone.
 */
@NoArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class JwtPrincipalUtil {

  private static final String CLAIM_IDIR_USERNAME = "idir_username";
  private static final String CLAIM_IDIR_USER_GUID = "idir_user_guid";
  private static final String CLAIM_IDENTITY_PROVIDER = "identity_provider";
  private static final String CLAIM_PREFERRED_USERNAME = "preferred_username";

  /**
   * The provider name written into audit columns, and the only one REPT issues.
   *
   * <p><b>This is deliberately not the raw claim value.</b> See
   * {@link #getProviderValue(Map)}.
   */
  private static final String PROVIDER_IDIR = "IDIR";

  /**
   * Retrieves the user ID from a pre-built claims map (e.g. the access token's claims).
   */
  public static String getUserId(Map<String, Object> claims) {
    return getUserIdValue(claims);
  }

  /**
   * Retrieves the IDP username from the given JwtAuthenticationToken principal. The IDP username is
   * extracted from the token attributes under the key {@code idir_username}. If the IDP username is
   * blank, the value under the key {@code idir_user_guid} is used. If both values are blank, an
   * empty string is returned.
   *
   * @param principal JwtAuthenticationToken object from which the IDP username is to be extracted.
   * @return The IDP username or an empty string if both values are blank.
   */
  public static String getIdpUsername(JwtAuthenticationToken principal) {
    return getIdpUsernameValue(principal.getTokenAttributes());
  }

  /**
   * Retrieves the value of a specified claim from the claims map. If the claim is not present,
   * returns an empty string.
   *
   * @param claims The map containing the JWT claims.
   * @param claimName The name of the claim to retrieve.
   * @return The value of the specified claim as a String, or an empty string if the claim is not
   *     present.
   */
  private static String getClaimValue(Map<String, Object> claims, String claimName) {
    return claims.getOrDefault(claimName, StringUtils.EMPTY).toString();
  }

  /**
   * The provider name for the audit trail, normalised to {@value #PROVIDER_IDIR}.
   *
   * <p><b>Every IDIR alias collapses to {@code IDIR}, and that is the point of this method.</b>
   * The value is the left-hand side of the {@code PROVIDER\\username} string written to
   * {@code create_user} / {@code update_user} across ten services, and those columns already hold
   * years of {@code IDIR\\jsmith} rows — including data predating this application.
   *
   * <p>The BC Gov SSO standard realm federates IDIR to Azure AD and reports
   * {@code identity_provider} as {@code azureidir}. Passing that through would start writing
   * {@code AZUREIDIR\\jsmith} for the same human being: nothing would error, no test would fail,
   * and the audit trail would simply stop joining up from the day of the cutover. The legacy
   * {@code idir} alias is folded in for the same reason.
   *
   * <p>Falls back to the {@code preferred_username} suffix ({@code <guid>@azureidir}) when the
   * broker claim is absent, since that is documented in the identity-mappers reference and is
   * always present.
   *
   * @param claims The map containing the JWT claims.
   * @return {@value #PROVIDER_IDIR}, or an empty string when the token names no provider REPT
   *     recognises.
   */
  private static String getProviderValue(Map<String, Object> claims) {
    String provider = getClaimValue(claims, CLAIM_IDENTITY_PROVIDER);

    if (StringUtils.isBlank(provider)) {
      // `preferred_username` is `<guid>@azureidir`; take what follows the '@'.
      String preferredUsername = getClaimValue(claims, CLAIM_PREFERRED_USERNAME);
      int at = preferredUsername.indexOf('@');
      provider = at < 0 ? StringUtils.EMPTY : preferredUsername.substring(at + 1);
    }

    return switch (provider.toLowerCase(Locale.ROOT)) {
      case "idir", "azureidir" -> PROVIDER_IDIR;
      default -> StringUtils.EMPTY;
    };
  }

  /**
   * The user GUID for the audit trail, upper-cased.
   *
   * <p><b>The case is normalised for the same reason the provider alias is</b> — see
   * {@link #getProviderValue(Map)}. A GUID is a 128-bit number, so nothing is carried by the
   * case of its hex spelling, but the audit columns are plain strings: {@code IDIR\\0a1b...}
   * and {@code IDIR\\0A1B...} are two different rows for the same human being. The token
   * already carries the GUID in both spellings — {@code idir_user_guid} upper-cased, and the
   * copy embedded in {@code preferred_username} lower-cased — and which spelling a realm emits
   * is CSS mapper configuration rather than anything REPT controls.
   *
   * <p>This value is only reached when {@code idir_username} is absent, which is what happens
   * when an environment's CSS integration has not mapped that claim onto the access token.
   *
   * @param claims The map containing the JWT claims.
   * @return The upper-cased user GUID, or an empty string when the claim is absent.
   */
  private static String getUserGuidValue(Map<String, Object> claims) {
    return getClaimValue(claims, CLAIM_IDIR_USER_GUID).toUpperCase(Locale.ROOT);
  }

  /**
   * Constructs the user ID by combining the provider's name with the user's username or user GUID.
   * The method first attempts to retrieve the user's username from the JWT claims using the key
   * {@code idir_username}. If the username is not present or is blank, it then attempts to retrieve
   * the user's GUID using the key {@code idir_user_guid}, upper-cased. If either value is found,
   * it is combined with the provider's name, separated by a backslash. If neither value is found,
   * an empty string is returned. This method ensures that the user ID is uniquely identified by
   * prefixing it with the provider's name.
   *
   * @param claims The map containing the JWT claims.
   * @return The constructed user ID in the format "IDIR\Username" or "IDIR\USERGUID" (the GUID
   *     branch is upper-cased, see {@link #getUserGuidValue(Map)}), or an empty string if neither
   *     the username nor the GUID is present in the claims.
   */
  private static String getUserIdValue(Map<String, Object> claims) {
    return Stream.of(
            getClaimValue(claims, CLAIM_IDIR_USERNAME),
            getUserGuidValue(claims))
        .map(Object::toString)
        .filter(StringUtils::isNotBlank)
        .map(userId -> getProviderValue(claims) + "\\" + userId)
        .findFirst()
        .orElse(StringUtils.EMPTY);
  }

  private static String getIdpUsernameValue(Map<String, Object> claims) {
    return Stream.of(
            getClaimValue(claims, CLAIM_IDIR_USERNAME),
            getUserGuidValue(claims))
        .map(Object::toString)
        .filter(StringUtils::isNotBlank)
        .findFirst()
        .orElse(StringUtils.EMPTY);
  }
}
