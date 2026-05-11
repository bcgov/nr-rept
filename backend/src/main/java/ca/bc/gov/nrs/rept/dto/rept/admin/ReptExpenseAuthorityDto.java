package ca.bc.gov.nrs.rept.dto.rept.admin;

/** Lightweight expense authority representation returned to admin clients. */
public record ReptExpenseAuthorityDto(Long id, String name, boolean active) {
}
