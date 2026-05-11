package ca.bc.gov.nrs.rept.dto.rept.admin;

public record ReptCoUserSearchResultDto(
    Long id,
    Long revisionCount,
    String name,
    boolean external,
    boolean existing,
    ReptOrgUnitDto orgUnit
) {
}
