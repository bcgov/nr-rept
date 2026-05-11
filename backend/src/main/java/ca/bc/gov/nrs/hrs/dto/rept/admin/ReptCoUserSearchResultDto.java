package ca.bc.gov.nrs.hrs.dto.rept.admin;

public record ReptCoUserSearchResultDto(
    Long id,
    Long revisionCount,
    String name,
    boolean external,
    boolean existing,
    ReptOrgUnitDto orgUnit
) {
}
