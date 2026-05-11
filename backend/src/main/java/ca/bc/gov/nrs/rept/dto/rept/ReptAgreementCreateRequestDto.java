package ca.bc.gov.nrs.rept.dto.rept;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Payload used when creating a new agreement on a project. Mirrors the fields available in the
 * legacy REPT "New Agreement" pane. No revision count is required because the record does not yet
 * exist.
 */
public record ReptAgreementCreateRequestDto(
    @NotNull AgreementType agreementType,
    @NotNull String agreementCode,
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
