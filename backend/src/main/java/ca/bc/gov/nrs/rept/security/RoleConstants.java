package ca.bc.gov.nrs.rept.security;

import ca.bc.gov.nrs.rept.dto.Role;
import org.springframework.stereotype.Component;


/**
 * Exposes role constants as Spring beans for use in SpEL expressions and security configuration.
 *
 * <p>The string constants {@link #ADMIN_AUTHORITY} and {@link #VIEWER_AUTHORITY} match
 * the CSS/Keycloak role names and are used in {@code ApiAuthorizationCustomizer} for
 * URL-level access control via {@code hasAuthority()} / {@code hasAnyAuthority()}.
 *
 * <p><b>The codes are unchanged from the Cognito groups they replace.</b> REPT scopes no role
 * by district, region or forest client, so none of FAM's scope-suffix grammar
 * ({@code <CODE>_DISTRICT-DCC}) applies here and the names arrive on the token spelled
 * exactly as written below — which is what keeps exact matching correct.
 */
@Component("roles")
public class RoleConstants {

    /** CSS role / Spring authority for full read-write access. */
    public static final String ADMIN_AUTHORITY = "REPT_ADMIN";

    /** CSS role / Spring authority for read-only access. */
    public static final String VIEWER_AUTHORITY = "REPT_VIEWER";

    public final Role REPT_ADMIN = Role.REPT_ADMIN;
    public final Role REPT_VIEWER = Role.REPT_VIEWER;
}
