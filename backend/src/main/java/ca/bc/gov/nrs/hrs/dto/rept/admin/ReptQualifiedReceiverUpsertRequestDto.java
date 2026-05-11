package ca.bc.gov.nrs.hrs.dto.rept.admin;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload used to create or update a qualified receiver entry.
 */
public record ReptQualifiedReceiverUpsertRequestDto(
    @NotBlank(message = "sourceName is required") String sourceName,
    Boolean active) {
}
