package ca.bc.gov.nrs.rept.dto.rept.admin;

public record ReptRequestingSourceDto(
    Long id,
    String name,
    boolean external,
    ReptOrgUnitDto orgUnit,
    Long revisionCount
) {
}
