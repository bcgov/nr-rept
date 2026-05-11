package ca.bc.gov.nrs.rept.dto.rept;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Summary/detail view of a project agreement. Mirrors the legacy Agreements tab by keeping both
 * acquisition and disposition code values plus convenience labels for rendering.
 */
public record ReptAgreementDto(
    Long id,
    Long projectId,
    String agreementType,
    String agreementCode,
    String agreementLabel,
    String acquisitionAgreementCode,
    String acquisitionAgreementLabel,
    String dispositionAgreementCode,
    String dispositionAgreementLabel,
    Boolean active,
    String paymentTerms,
    Long agreementTerm,
    LocalDate expiryDate,
    LocalDate bringForwardDate,
    LocalDate anniversaryDate,
    LocalDate renegotiationDate,
    String lessorsFile,
    String commitmentDescription,
    Long coUserId,
    String coUserLabel,
    Long revisionCount) {

  public ReptAgreementDto {
    Objects.requireNonNull(id, "id is required");
    Objects.requireNonNull(projectId, "projectId is required");
    if (agreementType != null) {
      agreementType = agreementType.trim();
    }
    if (agreementCode != null) {
      agreementCode = agreementCode.trim();
    }
    if (agreementLabel != null) {
      agreementLabel = agreementLabel.trim();
    }
    if (acquisitionAgreementLabel != null) {
      acquisitionAgreementLabel = acquisitionAgreementLabel.trim();
    }
    if (dispositionAgreementLabel != null) {
      dispositionAgreementLabel = dispositionAgreementLabel.trim();
    }
    if (paymentTerms != null) {
      paymentTerms = paymentTerms.trim();
    }
    if (lessorsFile != null) {
      lessorsFile = lessorsFile.trim();
    }
    if (commitmentDescription != null) {
      commitmentDescription = commitmentDescription.trim();
    }
    if (coUserLabel != null) {
      coUserLabel = coUserLabel.trim();
    }
  }
}
