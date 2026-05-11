package ca.bc.gov.nrs.hrs.dto.rept;

import java.util.Objects;

/**
 * Minimal property association details for an agreement, including parcel identifiers and labels
 * so the frontend can mirror the legacy Agreements -> Properties sub-tab.
 */
public record ReptAgreementPropertyDto(
    Long associationId,
    Long propertyId,
    String parcelIdentifier,
    String titleNumber,
    String legalDescription,
    String acquisitionCode,
    String acquisitionLabel,
    String landTitleOfficeCode,
    String landTitleOfficeLabel) {

  public ReptAgreementPropertyDto {
    Objects.requireNonNull(associationId, "associationId is required");
    Objects.requireNonNull(propertyId, "propertyId is required");
    if (parcelIdentifier != null) {
      parcelIdentifier = parcelIdentifier.trim();
    }
    if (titleNumber != null) {
      titleNumber = titleNumber.trim();
    }
    if (legalDescription != null) {
      legalDescription = legalDescription.trim();
    }
    if (acquisitionLabel != null) {
      acquisitionLabel = acquisitionLabel.trim();
    }
    if (landTitleOfficeLabel != null) {
      landTitleOfficeLabel = landTitleOfficeLabel.trim();
    }
  }
}
