package ca.bc.gov.nrs.rept.dto.rept.admin;

public record ReptRequestingSourceSearchResultDto(
    Long id,
    Long revisionCount,
    String name,
    boolean external,
    boolean existing,
    ReptOrgUnitDto orgUnit
) {
}
