package ca.bc.gov.nrs.hrs.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request payload for creating a new acquisition request. Only one acquisition request is allowed
 * per project.
 */
public record ReptAcquisitionRequestCreateDto(
    @NotBlank String acquisitionTypeCode,
    String fsrTypeCode,
    String roadUseTypeCode,
    @NotNull @JsonFormat(pattern = "yyyy-MM-dd") LocalDate receivedDate,
    @NotNull @JsonFormat(pattern = "yyyy-MM-dd") LocalDate targetCompletionDate,
    @Size(max = 4000) String locationPlan,
    @NotBlank @Size(max = 4000) String justification,
    @NotBlank @Size(max = 4000) String propertiesDescription,
    @NotNull @Positive BigDecimal timberVolumeAccessed,
    BigDecimal annualVolume,
    BigDecimal availableFunds,
    @Size(max = 25) String responsibilityCentre,
    String fundingCode,
    @Size(max = 25) String serviceLine,
    @Size(max = 25) String stob,
    @Size(max = 50) String requestorName,
    @Size(max = 32) String requestorUserId) {

  public ReptAcquisitionRequestCreateDto {
    if (acquisitionTypeCode != null) {
      acquisitionTypeCode = acquisitionTypeCode.trim();
    }
    if (fsrTypeCode != null) {
      fsrTypeCode = fsrTypeCode.trim();
    }
    if (roadUseTypeCode != null) {
      roadUseTypeCode = roadUseTypeCode.trim();
    }
    if (justification != null) {
      justification = justification.trim();
    }
    if (propertiesDescription != null) {
      propertiesDescription = propertiesDescription.trim();
    }
    if (responsibilityCentre != null) {
      responsibilityCentre = responsibilityCentre.trim();
    }
    if (fundingCode != null) {
      fundingCode = fundingCode.trim();
    }
    if (serviceLine != null) {
      serviceLine = serviceLine.trim();
    }
    if (stob != null) {
      stob = stob.trim();
    }
  }
}
