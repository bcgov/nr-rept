package ca.bc.gov.nrs.rept.dto.rept.admin;

public record ReptCoUserDto(
    Long id,
    String name,
    boolean external,
    ReptOrgUnitDto orgUnit,
    Long revisionCount
) {
}
