package ca.bc.gov.nrs.hrs.dto.rept.admin;

/** Lightweight expense authority representation returned to admin clients. */
public record ReptExpenseAuthorityDto(Long id, String name, boolean active) {
}
