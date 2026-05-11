package ca.bc.gov.nrs.hrs.security;

import ca.bc.gov.nrs.hrs.dto.Role;
import org.springframework.stereotype.Component;


/**
 * Exposes role constants as Spring beans for use in SpEL expressions and security configuration.
 *
 * <p>The string constants {@link #ADMIN_AUTHORITY} and {@link #VIEWER_AUTHORITY} match
 * the Cognito group names and are used in {@code ApiAuthorizationCustomizer} for
 * URL-level access control via {@code hasAuthority()} / {@code hasAnyAuthority()}.
 */
@Component("roles")
public class RoleConstants {

    /** Cognito group / Spring authority for full read-write access. */
    public static final String ADMIN_AUTHORITY = "REPT_ADMIN";

    /** Cognito group / Spring authority for read-only access. */
    public static final String VIEWER_AUTHORITY = "REPT_VIEWER";

    public final Role REPT_ADMIN = Role.REPT_ADMIN;
    public final Role REPT_VIEWER = Role.REPT_VIEWER;
}
