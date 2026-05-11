package ca.bc.gov.nrs.rept.security;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * URL-level authorization rules — the single source of truth for all backend access control.
 *
 * <h3>Rule ordering (Spring Security evaluates top-to-bottom, first match wins)</h3>
 * <ol>
 *   <li>Specific API rules are declared first so they are never shadowed by broader
 *       {@code permitAll()} patterns below.</li>
 *   <li>Static-asset and infrastructure {@code permitAll()} rules are last so they
 *       cannot accidentally expose an API path.</li>
 * </ol>
 *
 * <h3>Role matrix</h3>
 * <ul>
 *   <li><strong>REPT_ADMIN</strong> — full CRUD on every {@code /api/**} endpoint</li>
 *   <li><strong>REPT_VIEWER</strong> — {@code GET /api/**} + {@code POST /api/reports/**}
 *       (report generation); all other write methods are rejected with 403</li>
 *   <li><strong>No recognized role</strong> — rejected (403) for any {@code /api/**} endpoint</li>
 * </ul>
 *
 * <p>Admin endpoints ({@code /api/rept/admin/**}) require {@code REPT_ADMIN} for
 * <em>all</em> HTTP methods, including {@code GET}.
 */
@Component
public class ApiAuthorizationCustomizer implements
    Customizer<
        AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry
        > {

  @Override
  public void customize(
      AuthorizeHttpRequestsConfigurer<HttpSecurity>
          .AuthorizationManagerRequestMatcherRegistry authorize
  ) {

    // ── API rules (must come first — never shadowed by permitAll below) ─

    // Admin endpoints — REPT_ADMIN only for ALL HTTP methods (including GET)
    authorize
        .requestMatchers("/api/rept/admin/**")
        .hasAuthority(RoleConstants.ADMIN_AUTHORITY);

    // Report generation — both roles can trigger a POST report
    // Must appear BEFORE the generic POST /api/** admin-only rule
    authorize
        .requestMatchers(HttpMethod.POST, "/api/reports/**")
        .hasAnyAuthority(RoleConstants.ADMIN_AUTHORITY, RoleConstants.VIEWER_AUTHORITY);

    // Write operations — REPT_ADMIN only
    authorize
        .requestMatchers(HttpMethod.POST, "/api/**")
        .hasAuthority(RoleConstants.ADMIN_AUTHORITY);

    authorize
        .requestMatchers(HttpMethod.PUT, "/api/**")
        .hasAuthority(RoleConstants.ADMIN_AUTHORITY);

    authorize
        .requestMatchers(HttpMethod.DELETE, "/api/**")
        .hasAuthority(RoleConstants.ADMIN_AUTHORITY);

    // Read operations — any recognized role
    authorize
        .requestMatchers(HttpMethod.GET, "/api/**")
        .hasAnyAuthority(RoleConstants.ADMIN_AUTHORITY, RoleConstants.VIEWER_AUTHORITY);

    // ── Infrastructure / public routes (declared last) ──────────────

    // CORS pre-flight — must be permitted so browsers can negotiate auth headers
    authorize
        .requestMatchers(HttpMethod.OPTIONS, "/**")
        .permitAll();

    // Static assets served by the SPA
    authorize
        .requestMatchers(
            HttpMethod.GET,
            "/",
            "/index.html",
            "/manifest.json",
            "/robots.txt",
            "/favicon.ico",
            "/sw.js",
            "/*.js",
            "/*.css",
            "/*.png",
            "/*.svg",
            "/*.ico",
            "/*.woff2",
            "/assets/**",
            "/icons/**",
            "/screenshots/**"
        )
        .permitAll();

    // Actuator health / info probes
    authorize
        .requestMatchers(HttpMethod.GET, "/actuator/**")
        .permitAll();

    authorize
        .requestMatchers("/error")
        .permitAll();

    // SPA fallback — allows the browser to receive index.html for any
    // client-side route (e.g. /pub/rept/dashboard after Cognito redirect).
    // API paths are already matched and enforced above, so this cannot
    // expose any protected /api/** endpoint.
    authorize
        .requestMatchers(HttpMethod.GET, "/**")
        .permitAll();

    // ── Deny everything else ────────────────────────────────────────
    authorize
        .anyRequest().denyAll();
  }
}
