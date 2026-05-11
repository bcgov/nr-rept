package ca.bc.gov.nrs.hrs.dto.rept.admin;

/**
 * Simple representation of a REPT qualified receiver entry exposed via the admin API.
 */
public record ReptQualifiedReceiverDto(Long id, String name, boolean active) {
}
