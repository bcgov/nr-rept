package ca.bc.gov.nrs.rept.security;

import ca.bc.gov.nrs.rept.exception.UserNotFoundException;
import ca.bc.gov.nrs.rept.util.JwtPrincipalUtil;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Spring bean exposing authorization helpers for the currently authenticated user.
 *
 * <p>Registered as {@code @auth} for programmatic use in services and security configuration.
 *
 * <h3>Identity comes off the token now</h3>
 * Under Cognito the frontend sent an access token that carried {@code cognito:groups} but none
 * of the {@code custom:idp_*} profile claims, so this helper called the Cognito
 * {@code /oauth2/userInfo} endpoint on every request (behind a five-minute cache) and merged
 * the result into a synthetic claims map.
 *
 * <p>BC Gov SSO maps the profile claims onto the access token directly, so the whole
 * enrichment step — and the external HTTP call it made from the request path — is gone. The
 * claims are read straight off the JWT.
 */
@Component("auth")
public class LoggedUserHelper {

  // ─── Identity helpers ──────────────────────────────────────────────

  /**
   * Get the ID from the logged user (e.g. {@code IDIR\jsmith}).
   *
   * <p>Reads {@code idir_username} and {@code identity_provider} from the access token. The
   * provider is normalised to {@code IDIR} rather than passed through as {@code azureidir} —
   * see {@link JwtPrincipalUtil} for why that matters to the audit columns this value is
   * written to.
   */
  public String getLoggedUserId() {
    return JwtPrincipalUtil.getUserId(getPrincipal().getClaims());
  }

  // ─── Role / authority helpers (from client_roles on the access token) ──

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

    if (authentication != null
        && authentication.isAuthenticated()
        && authentication.getPrincipal() instanceof Jwt jwtPrincipal) {
      return jwtPrincipal;
    }
    throw new UserNotFoundException();
  }

}
