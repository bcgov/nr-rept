package ca.bc.gov.nrs.hrs.util;

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
 */
@NoArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class JwtPrincipalUtil {
  
  /**
   * Retrieves the user ID from a pre-built claims map (e.g. enriched with userInfo data).
   */
  public static String getUserId(Map<String, Object> claims) {
    return getUserIdValue(claims);
  }

  /**
   * Retrieves the IDP username from the given JwtAuthenticationToken principal. The IDP username is
   * extracted from the token attributes under the key "custom:idp_username". If the IDP username is
   * blank, the value under the key "custom:idp_user_id" is used. If both values are blank, an empty
   * string is returned.
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
   * Retrieves the provider value from the JWT claims. The provider is identified by the key
   * "custom:idp_name" within the claims. If the provider's name starts with "ca.bc.gov.flnr.fam.",
   * it is replaced with "BCSC". Otherwise, the provider's name is returned in uppercase. If the
   * provider is not specified, an empty string is returned.
   *
   * @param claims The map containing the JWT claims.
   * @return The provider's name in uppercase or "BCSC" if it starts with "ca.bc.gov.flnr.fam.", or
   *     an empty string if the provider is not specified.
   */
  private static String getProviderValue(Map<String, Object> claims) {
    String provider = getClaimValue(claims, "custom:idp_name");

    if (StringUtils.isNotBlank(provider)) {
      return provider.startsWith("ca.bc.gov.flnr.fam.")
          ? "BCSC"
          : provider.toUpperCase(Locale.ROOT);
    }
    return StringUtils.EMPTY;
  }

  /**
   * Constructs the user ID by combining the provider's name with the user's username or user ID.
   * The method first attempts to retrieve the user's username from the JWT claims using the key
   * "custom:idp_username". If the username is not present or is blank, it then attempts to retrieve
   * the user's ID using the key "custom:idp_user_id". If either value is found, it is combined with
   * the provider's name, separated by a backslash. If neither value is found, an empty string is
   * returned. This method ensures that the user ID is uniquely identified by prefixing it with the
   * provider's name.
   *
   * @param claims The map containing the JWT claims.
   * @return The constructed user ID in the format "Provider\Username" or "Provider\UserID", or an
   *     empty string if neither the username nor the user ID is present in the claims.
   */
  private static String getUserIdValue(Map<String, Object> claims) {
    return Stream.of(
            getClaimValue(claims, "custom:idp_username"),
            getClaimValue(claims, "custom:idp_user_id"))
        .map(Object::toString)
        .filter(StringUtils::isNotBlank)
        .map(userId -> getProviderValue(claims) + "\\" + userId)
        .findFirst()
        .orElse(StringUtils.EMPTY);
  }

  private static String getIdpUsernameValue(Map<String, Object> claims) {
    return Stream.of(
            getClaimValue(claims, "custom:idp_username"),
            getClaimValue(claims, "custom:idp_user_id"))
        .map(Object::toString)
        .filter(StringUtils::isNotBlank)
        .findFirst()
        .orElse(StringUtils.EMPTY);
  }
}
