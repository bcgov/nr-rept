package ca.bc.gov.nrs.rept.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Request payload for updating an existing REPT project. All editable fields are included here.
 * The revision count is required for optimistic locking.
 */
public record ReptProjectUpdateRequestDto(
    @NotNull @Positive Long revisionCount,
    @NotBlank @Size(max = 50) String projectName,
    @NotBlank String statusCode,
    String priorityCode,
    Long regionNumber,
    Long districtNumber,
    Long bctsOfficeNumber,
    @NotNull @JsonFormat(pattern = "yyyy-MM-dd") LocalDate requestDate,
    @Size(max = 32) String requestorUserId,
    String requestingSourceId,
    @Size(max = 50) String projectManagerName,
    String projectManagerUserId,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate projectManagerAssignedDate,
    @Size(max = 4000) String projectHistory,
    @Size(max = 4000) String relatedFiles,
    @Size(max = 4000) String relatedRegistrations,
    @Size(max = 4000) String projectComment) {

  public ReptProjectUpdateRequestDto {
    if (projectName != null) {
      projectName = projectName.trim();
    }
    if (statusCode != null) {
      statusCode = statusCode.trim();
    }
    if (priorityCode != null) {
      priorityCode = priorityCode.trim();
    }
    if (requestorUserId != null) {
      requestorUserId = requestorUserId.trim();
    }
    if (projectManagerName != null) {
      projectManagerName = projectManagerName.trim();
    }
    if (projectManagerUserId != null) {
      projectManagerUserId = projectManagerUserId.trim();
    }
  }
}
