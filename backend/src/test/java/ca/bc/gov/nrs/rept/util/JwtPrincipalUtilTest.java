package ca.bc.gov.nrs.rept.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

@DisplayName("Unit Test | JwtPrincipalUtil")
class JwtPrincipalUtilTest {

  private static Map<String, Object> idirClaims(String identityProvider) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("idir_username", "JSMITH");
    claims.put("idir_user_guid", "0A1B2C3D4E5F60718293A4B5C6D7E8F9");
    claims.put("preferred_username", "0a1b2c3d4e5f60718293a4b5c6d7e8f9@azureidir");
    if (identityProvider != null) {
      claims.put("identity_provider", identityProvider);
    }
    return claims;
  }

  /** {@code getIdpUsername} takes a principal rather than a claims map, so wrap one. */
  private static JwtAuthenticationToken tokenOf(Map<String, Object> claims) {
    Jwt jwt = Jwt.withTokenValue("token")
        .header("alg", "none")
        .claims(c -> c.putAll(claims))
        .build();
    return new JwtAuthenticationToken(jwt);
  }

  @Nested
  @DisplayName("the audit user id")
  class UserId {

    /**
     * The whole reason {@code getProviderValue} exists. The realm reports
     * {@code azureidir}; the audit columns have always held {@code IDIR}.
     */
    @Test
    void azureidir_isNormalisedToIdir() {
      assertThat(JwtPrincipalUtil.getUserId(idirClaims("azureidir")))
          .isEqualTo("IDIR\\JSMITH");
    }

    @Test
    void legacyIdirAlias_alsoNormalisesToIdir() {
      assertThat(JwtPrincipalUtil.getUserId(idirClaims("idir")))
          .isEqualTo("IDIR\\JSMITH");
    }

    @Test
    void providerIsCaseInsensitive() {
      assertThat(JwtPrincipalUtil.getUserId(idirClaims("AzureIDIR")))
          .isEqualTo("IDIR\\JSMITH");
    }

    /**
     * {@code identity_provider} is added by the broker rather than by a mapper, so it is not
     * in the identity-mappers reference. {@code preferred_username} always is.
     */
    @Test
    void fallsBackToThePreferredUsernameSuffix() {
      Map<String, Object> claims = idirClaims(null);

      assertThat(JwtPrincipalUtil.getUserId(claims)).isEqualTo("IDIR\\JSMITH");
    }

    @Test
    void fallsBackToTheGuidWhenTheUsernameIsAbsent() {
      Map<String, Object> claims = idirClaims("azureidir");
      claims.remove("idir_username");

      assertThat(JwtPrincipalUtil.getUserId(claims))
          .isEqualTo("IDIR\\0A1B2C3D4E5F60718293A4B5C6D7E8F9");
    }

    /**
     * An unrecognised provider yields no prefix rather than an invented one: writing
     * {@code BCEIDBUSINESS\jsmith} into a column that has only ever held {@code IDIR\} rows
     * would be worse than writing a bare name.
     */
    @Test
    void anUnrecognisedProviderContributesNoPrefix() {
      Map<String, Object> claims = idirClaims("bceidbusiness");
      claims.put("preferred_username", "abc@bceidbusiness");

      assertThat(JwtPrincipalUtil.getUserId(claims)).isEqualTo("\\JSMITH");
    }

    @Test
    void isEmptyWhenTheTokenNamesNobody() {
      assertThat(JwtPrincipalUtil.getUserId(Map.of())).isEmpty();
    }

    /**
     * The GUID's case carries no meaning — it is the hex spelling of a 128-bit number — but the
     * audit columns are plain strings, so {@code IDIR\\0a1b...} and {@code IDIR\\0A1B...} would
     * be two rows for one person. Which spelling arrives is realm mapper configuration, not
     * something REPT controls, so it is pinned here.
     */
    @Test
    void aLowercaseGuidIsUpperCased() {
      Map<String, Object> claims = idirClaims("azureidir");
      claims.remove("idir_username");
      claims.put("idir_user_guid", "0a1b2c3d4e5f60718293a4b5c6d7e8f9");

      assertThat(JwtPrincipalUtil.getUserId(claims))
          .isEqualTo("IDIR\\0A1B2C3D4E5F60718293A4B5C6D7E8F9");
    }

    @Test
    void theGuidCaseDoesNotChangeTheAuditString() {
      Map<String, Object> lower = idirClaims("azureidir");
      lower.remove("idir_username");
      lower.put("idir_user_guid", "0a1b2c3d4e5f60718293a4b5c6d7e8f9");

      Map<String, Object> upper = idirClaims("azureidir");
      upper.remove("idir_username");

      assertThat(JwtPrincipalUtil.getUserId(lower))
          .isEqualTo(JwtPrincipalUtil.getUserId(upper));
    }

    /**
     * The username is not touched. Only the GUID branch normalises, because only the GUID is a
     * number whose spelling is arbitrary; a username is a name and is left exactly as issued.
     */
    @Test
    void theUsernameIsLeftAsIssued() {
      Map<String, Object> claims = idirClaims("azureidir");
      claims.put("idir_username", "jsmith");

      assertThat(JwtPrincipalUtil.getUserId(claims)).isEqualTo("IDIR\\jsmith");
    }
  }

  @Nested
  @DisplayName("the idp username")
  class IdpUsername {

    /**
     * {@code ReptPropertyController.extractUserId} writes this bare value, without the
     * {@code IDIR\\} prefix, to fit the database column. It falls back to the GUID on the same
     * terms as the audit user id, so it normalises on the same terms too.
     */
    @Test
    void aLowercaseGuidIsUpperCased() {
      Map<String, Object> claims = idirClaims("azureidir");
      claims.remove("idir_username");
      claims.put("idir_user_guid", "0a1b2c3d4e5f60718293a4b5c6d7e8f9");

      assertThat(JwtPrincipalUtil.getIdpUsername(tokenOf(claims)))
          .isEqualTo("0A1B2C3D4E5F60718293A4B5C6D7E8F9");
    }

    @Test
    void prefersTheUsernameAndLeavesItAsIssued() {
      assertThat(JwtPrincipalUtil.getIdpUsername(tokenOf(idirClaims("azureidir"))))
          .isEqualTo("JSMITH");
    }
  }
}
