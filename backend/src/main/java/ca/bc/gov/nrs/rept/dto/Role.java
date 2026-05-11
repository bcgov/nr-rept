package ca.bc.gov.nrs.rept.dto;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Enum representing all roles in the system, each associated with a {@link RoleType}.
 * Used for authorization checks in conjunction with Spring Security's URL-level access control.
 *
 * <p>The role names must match the AWS Cognito group names exactly:
 * <ul>
 *   <li>{@code REPT_ADMIN} — full CRUD access to all resources</li>
 *   <li>{@code REPT_VIEWER} — read-only access (GET requests only)</li>
 * </ul>
 */
@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum Role {
    /** Full read/write access — maps to Cognito group "REPT_ADMIN". */
    REPT_ADMIN(RoleType.CONCRETE),
    /** Read-only access — maps to Cognito group "REPT_VIEWER". */
    REPT_VIEWER(RoleType.CONCRETE);

    private final RoleType type;

    /** The Spring Security authority string (matches the Cognito group name). */
    public String authority() {
        return name();
    }

    /**
     * Checks if the role is of type CONCRETE.
     *
     * @return true if the role is concrete; false otherwise
     */
    public boolean isConcrete() {
        return type == RoleType.CONCRETE;
    }

    /**
     * Checks if the role is of type ABSTRACT.
     *
     * @return true if the role is abstract; false otherwise
     */
    public boolean isAbstract() {
        return type == RoleType.ABSTRACT;
    }
}
