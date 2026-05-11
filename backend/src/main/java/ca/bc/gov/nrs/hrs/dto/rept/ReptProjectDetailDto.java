package ca.bc.gov.nrs.hrs.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Representation of the legacy REPT project detail payload. Includes both the raw codes used by
 * the Oracle packages and friendly labels sourced from the same code-list procedures so the modern
 * UI can render a read-only view that mirrors the Struts application.
 */
public record ReptProjectDetailDto(
    Long id,
    String filePrefix,
    Long projectNumber,
    String fileSuffix,
    String projectName,
    String statusCode,
    String statusLabel,
    String priorityCode,
    String priorityLabel,
    Long regionNumber,
    String regionLabel,
    Long districtNumber,
    String districtLabel,
    Long bctsOfficeNumber,
    String bctsOfficeLabel,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate requestDate,
    String requestingSourceId,
    String requestingSourceLabel,
    String requestorUserId,
    String projectManagerUserId,
    String projectManagerName,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate projectManagerAssignedDate,
    String projectHistory,
    String relatedFiles,
    String relatedRegistrations,
    String projectComment,
    Long revisionCount) {

  public ReptProjectDetailDto {
    Objects.requireNonNull(id, "id is required");
    if (filePrefix != null) {
      filePrefix = filePrefix.trim();
    }
    if (fileSuffix != null) {
      fileSuffix = fileSuffix.trim();
    }
    if (projectName != null) {
      projectName = projectName.trim();
    }
    if (statusLabel != null) {
      statusLabel = statusLabel.trim();
    }
    if (priorityLabel != null) {
      priorityLabel = priorityLabel.trim();
    }
    if (regionLabel != null) {
      regionLabel = regionLabel.trim();
    }
    if (districtLabel != null) {
      districtLabel = districtLabel.trim();
    }
    if (bctsOfficeLabel != null) {
      bctsOfficeLabel = bctsOfficeLabel.trim();
    }
    if (requestingSourceLabel != null) {
      requestingSourceLabel = requestingSourceLabel.trim();
    }
    if (projectManagerName != null) {
      projectManagerName = projectManagerName.trim();
    }
  }

  @JsonProperty("projectFile")
  public String projectFile() {
    StringBuilder builder = new StringBuilder();
    if (filePrefix != null && !filePrefix.isBlank()) {
      builder.append(filePrefix).append('/');
    }
    if (projectNumber != null) {
      builder.append(projectNumber);
    }
    if (fileSuffix != null && !fileSuffix.isBlank()) {
      builder.append('-').append(fileSuffix);
    }
    return builder.length() == 0 ? null : builder.toString();
  }
}
