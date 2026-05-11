package ca.bc.gov.nrs.hrs.dto.rept;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

/**
 * Payload used when updating an agreement's header information (details tab). Mirrors the
 * editable fields that existed in the legacy REPT Agreements pane while enforcing optimistic
 * locking via the revision count supplied by the client.
 */
public record ReptAgreementUpdateRequestDto(
    @NotNull @Positive Long revisionCount,
    @NotNull AgreementType agreementType,
    @NotBlank String agreementCode,
    @NotNull Boolean active,
    String paymentTerms,
    Long agreementTerm,
    LocalDate expiryDate,
    LocalDate bringForwardDate,
    LocalDate anniversaryDate,
    LocalDate renegotiationDate,
    String lessorsFile,
    String commitmentDescription,
    Long coUserId) {

  public enum AgreementType {
    ACQUISITION,
    DISPOSITION
  }
}
