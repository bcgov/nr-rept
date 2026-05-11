package ca.bc.gov.nrs.hrs.dto.rept;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Detailed view of a project property encompassing parcel facts, jurisdiction codes, and owning
 * organisational context. Milestone-specific timestamps are delivered via
 * {@link ReptPropertyMilestoneDto}.
 */
public record ReptPropertyDetailDto(
    Long id,
    Long projectId,
    String titleNumber,
    String parcelIdentifier,
    String legalDescription,
    String parcelAddress,
    String city,
    BigDecimal parcelArea,
    BigDecimal projectArea,
    BigDecimal assessedValue,
    String acquisitionCode,
    String acquisitionLabel,
    String landTitleOfficeCode,
    String landTitleOfficeLabel,
    String electoralDistrictCode,
    String electoralDistrictLabel,
    Long orgUnitNumber,
    String orgUnitCode,
    String orgUnitName,
    Boolean expropriationRecommended,
    Long revisionCount) {

  public ReptPropertyDetailDto {
    Objects.requireNonNull(id, "id is required");
    Objects.requireNonNull(projectId, "projectId is required");
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
    if (electoralDistrictLabel != null) {
      electoralDistrictLabel = electoralDistrictLabel.trim();
    }
    if (orgUnitCode != null) {
      orgUnitCode = orgUnitCode.trim();
    }
    if (orgUnitName != null) {
      orgUnitName = orgUnitName.trim();
    }
  }
}
