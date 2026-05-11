package ca.bc.gov.nrs.hrs.dto.rept.admin;

/** Shared representation of an organizational unit reference exposed via the REPT admin APIs. */
public record ReptOrgUnitDto(Long number, String code, String name) {
}
