package ca.bc.gov.nrs.rept.dto.rept.admin;

/**
 * Query parameters accepted by the qualified receiver search endpoint.
 */
public record ReptQualifiedReceiverSearchCriteria(String name, Boolean active) {
}
