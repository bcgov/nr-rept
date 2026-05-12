package ca.bc.gov.nrs.rept.dto.rept;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Lightweight parcel snapshot used to populate the property selector. Contains only the data
 * required to render a succinct row while preserving code/label pairs for acquisition status and
 * land title office.
 */
public record ReptPropertySummaryDto(
    Long id,
    String titleNumber,
    String parcelIdentifier,
    String legalDescription,
    String parcelAddress,
    String city,
    String acquisitionCode,
    String acquisitionLabel,
    String landTitleOfficeCode,
    String landTitleOfficeLabel,
    BigDecimal parcelArea,
    BigDecimal projectArea,
    BigDecimal assessedValue,
    Boolean expropriationRecommended,
    Long revisionCount) {

  public ReptPropertySummaryDto {
    Objects.requireNonNull(id, "id is required");
    if (titleNumber != null) {
      titleNumber = titleNumber.trim();
    }
    if (parcelIdentifier != null) {
      parcelIdentifier = parcelIdentifier.trim();
    }
    if (legalDescription != null) {
      legalDescription = legalDescription.trim();
    }
    if (parcelAddress != null) {
      parcelAddress = parcelAddress.trim();
    }
    if (city != null) {
      city = city.trim();
    }
    if (acquisitionLabel != null) {
      acquisitionLabel = acquisitionLabel.trim();
    }
    if (landTitleOfficeLabel != null) {
      landTitleOfficeLabel = landTitleOfficeLabel.trim();
    }
  }
}
