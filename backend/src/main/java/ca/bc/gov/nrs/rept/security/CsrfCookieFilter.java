package ca.bc.gov.nrs.rept.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Forces Spring Security 6's lazy CSRF token to be materialised on every request.
 *
 * <p>Spring 6 switched to {@code CsrfTokenRequestAttributeHandler}, which defers token
 * generation until something explicitly reads it. For a SPA whose first interaction is a
 * GET that doesn't read the token, the {@code XSRF-TOKEN} cookie never gets written to the
 * response — so the SPA has no token to send on the next POST/PUT/DELETE and the request
 * is rejected with 403 "Invalid CSRF token".</p>
 *
 * <p>Calling {@link CsrfToken#getToken()} here triggers the cookie write on every request.
 * Registered after {@code BasicAuthenticationFilter} so it runs after the CSRF filter has
 * placed the token in the request attribute.</p>
 */
@Component
public class CsrfCookieFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain
  ) throws ServletException, IOException {
    CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
    if (csrfToken != null) {
      // Render the token — this triggers CookieCsrfTokenRepository to set XSRF-TOKEN.
      csrfToken.getToken();
    }
    filterChain.doFilter(request, response);
  }
}
