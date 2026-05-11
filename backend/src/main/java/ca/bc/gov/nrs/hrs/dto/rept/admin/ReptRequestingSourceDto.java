package ca.bc.gov.nrs.hrs.dto.rept.admin;

public record ReptRequestingSourceDto(
    Long id,
    String name,
    boolean external,
    ReptOrgUnitDto orgUnit,
    Long revisionCount
) {
}
