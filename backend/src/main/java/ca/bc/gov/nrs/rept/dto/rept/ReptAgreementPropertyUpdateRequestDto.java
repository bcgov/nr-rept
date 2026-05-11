package ca.bc.gov.nrs.rept.dto.rept;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

/**
 * Payload used for replacing the set of properties linked to an agreement. The client sends the
 * full list of property identifiers that should remain linked; the service determines which ones
 * need to be created or removed.
 */
public record ReptAgreementPropertyUpdateRequestDto(
    @NotNull List<@NotNull @Positive Long> propertyIds) {}
