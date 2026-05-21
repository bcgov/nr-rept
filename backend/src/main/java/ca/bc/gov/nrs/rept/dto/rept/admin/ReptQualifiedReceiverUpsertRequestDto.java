package ca.bc.gov.nrs.rept.dto.rept.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload used to create or update a qualified receiver entry.
 */
public record ReptQualifiedReceiverUpsertRequestDto(
    // Mirrors REPT_QUALIFIED_RECEIVER.QUALIFIED_RECEIVER (VARCHAR2(20)).
    // Frontend enforces the same via the form's maxLength.
    @NotBlank(message = "sourceName is required") @Size(max = 20) String sourceName,
    Boolean active) {
}
