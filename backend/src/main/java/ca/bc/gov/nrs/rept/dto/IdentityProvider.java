package ca.bc.gov.nrs.rept.dto;

import java.util.Arrays;
import java.util.Optional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

/** Identity providers supported by the application. REPT only uses IDIR. */
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum IdentityProvider {
  IDIR("idir");

  private final String claimName;

  /**
   * Extract the identity provider from a Jwt.
   *
   * @param provider The provider name
   * @return the identity provider, if one is found
   */
  public static Optional<IdentityProvider> fromClaim(String provider) {
    return Arrays.stream(values())
        .filter(enumValue -> enumValue.claimName.equalsIgnoreCase(provider))
        .findFirst();
  }
}
