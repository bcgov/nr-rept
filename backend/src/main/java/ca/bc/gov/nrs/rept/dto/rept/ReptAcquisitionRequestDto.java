package ca.bc.gov.nrs.rept.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Read-only representation of an acquisition request tied to a REPT project. Mirrors the legacy
 * Struts tab but is trimmed for modern consumption while keeping both code values and labels so the
 * UI can render the same content without re-querying code tables.
 */
public record ReptAcquisitionRequestDto(
    Long id,
    Long projectId,
    String acquisitionTypeCode,
    String acquisitionTypeLabel,
    String fsrTypeCode,
    String fsrTypeLabel,
    String roadUseTypeCode,
    String roadUseTypeLabel,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate receivedDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate targetCompletionDate,
    String locationPlan,
    String justification,
    String propertiesDescription,
    BigDecimal timberVolumeAccessed,
    BigDecimal annualVolume,
    BigDecimal availableFunds,
    String responsibilityCentre,
    String fundingCode,
    String fundingLabel,
    String serviceLine,
    String stob,
    String requestorUserId,
    String requestorName,
    Long revisionCount) {

  public ReptAcquisitionRequestDto {
    Objects.requireNonNull(projectId, "projectId is required");
    if (acquisitionTypeLabel != null) {
      acquisitionTypeLabel = acquisitionTypeLabel.trim();
    }
    if (fsrTypeLabel != null) {
      fsrTypeLabel = fsrTypeLabel.trim();
    }
    if (roadUseTypeLabel != null) {
      roadUseTypeLabel = roadUseTypeLabel.trim();
    }
    if (fundingLabel != null) {
      fundingLabel = fundingLabel.trim();
    }
    if (requestorName != null) {
      requestorName = requestorName.trim();
    }
  }
}
