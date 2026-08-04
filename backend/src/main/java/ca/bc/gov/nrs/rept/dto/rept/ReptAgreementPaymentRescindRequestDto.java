package ca.bc.gov.nrs.rept.dto.rept;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Payload for the rescind/restore toggle on an agreement payment. {@code rescinded} carries the
 * target state rather than a "flip it" signal so a double-submitted request is idempotent.
 *
 * <p>{@code revisionCount} is the value the client last read. It is optional — when omitted the
 * service falls back to the stored revision count and the update becomes last-write-wins.
 */
public record ReptAgreementPaymentRescindRequestDto(
    @NotNull Boolean rescinded,
    @PositiveOrZero Long revisionCount) {}
