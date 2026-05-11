package ca.bc.gov.nrs.rept.security;

import ca.bc.gov.nrs.rept.exception.UserNotFoundException;
import ca.bc.gov.nrs.rept.util.JwtPrincipalUtil;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Spring bean exposing authorization helpers for the currently authenticated user.
 *
 * <p>Registered as {@code @auth} for programmatic use in services and security configuration.
 *
 * <h3>Access-token migration note</h3>
 * The frontend now sends a Cognito <em>access token</em> (not an ID token).
 * Access tokens contain {@code cognito:groups} and {@code sub} but lack the
 * {@code custom:idp_*} profile claims that the identity helpers below depend on.
 * Those claims are fetched on demand from the Cognito {@code /oauth2/userInfo}
 * endpoint (via {@link CognitoUserInfoService}) and merged into a synthetic
 * claims map so that existing {@link JwtPrincipalUtil} methods continue to work
 * without modification.
 */
@Component("auth")
public class LoggedUserHelper {

  private final CognitoUserInfoService userInfoService;

  public LoggedUserHelper(CognitoUserInfoService userInfoService) {
    this.userInfoService = userInfoService;
  }

  // ─── Identity helpers ──────────────────────────────────────────────
  /**
   * Get the ID from the logged user (e.g. {@code IDIR\jsmith}).
   * Requires the {@code custom:idp_username} and {@code custom:idp_name} claims
   * which are obtained from the Cognito userInfo endpoint.
   */
  public String getLoggedUserId() {
    return JwtPrincipalUtil.getUserId(getEnrichedClaims());
  }
  // ─── Role / authority helpers (these use cognito:groups from the access token) ──

  /**
   * Returns the set of authority strings for the current user (e.g. {@code REPT_ADMIN}).
   */
  public Set<String> getAuthorities() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      return Set.of();
    }
    return authentication.getAuthorities()
        .stream()
        .map(GrantedAuthority::getAuthority)
        .collect(Collectors.toSet());
  }

  /**
   * Returns {@code true} if the user holds the {@code REPT_ADMIN} authority.
   */
  public boolean isAdmin() {
    return getAuthorities().contains(RoleConstants.ADMIN_AUTHORITY);
  }

  // ─── Internal helpers ─────────────────────────────────────────────

  /**
   * Returns the raw {@link Jwt} principal from the security context.
   */
  private Jwt getPrincipal() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    if (authentication.isAuthenticated()
        && authentication.getPrincipal() instanceof Jwt jwtPrincipal) {
      return jwtPrincipal;
    }
    throw new UserNotFoundException();
  }

  /**
   * Builds a merged claims map that contains:
   * <ol>
   *   <li>All claims from the access token (cognito:groups, sub, etc.)</li>
   *   <li>Profile claims from the Cognito userInfo endpoint
   *       (custom:idp_name, custom:idp_username, email, etc.)</li>
   * </ol>
   * UserInfo claims do NOT overwrite access-token claims if there's a collision.
   */
  private Map<String, Object> getEnrichedClaims() {
    Jwt accessToken = getPrincipal();
    Map<String, Object> userInfoClaims = userInfoService.getUserInfo(accessToken);

    // Start with userInfo (lower precedence), overlay with access token claims
    java.util.HashMap<String, Object> merged = new java.util.HashMap<>(userInfoClaims);
    merged.putAll(accessToken.getClaims());
    return merged;
  }

}
