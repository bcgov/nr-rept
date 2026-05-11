package ca.bc.gov.nrs.rept.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Request payload for creating a REPT project file. Mirrors the legacy Struts form fields that
 * ultimately feed the REPT_PROJECT_INS stored procedure. All text inputs are trimmed before
 * persistence to match legacy behaviour.
 */
public record ReptProjectCreateRequestDto(
    @NotBlank String filePrefix,
    @NotBlank String fileSuffix,
    String projectName,
    String regionNumber,
    String districtNumber,
    String bctsOfficeNumber,
    String requestingSourceId,
    String requestorUserId,
    @NotBlank String statusCode,
    @NotNull @JsonFormat(pattern = "yyyy-MM-dd") LocalDate requestDate,
    String projectComment
) {

  public ReptProjectCreateRequestDto {
    filePrefix = trim(filePrefix);
    fileSuffix = trim(fileSuffix);
    projectName = trim(projectName);
    regionNumber = trim(regionNumber);
    districtNumber = trim(districtNumber);
    bctsOfficeNumber = trim(bctsOfficeNumber);
    requestingSourceId = trim(requestingSourceId);
    requestorUserId = trim(requestorUserId);
    statusCode = trim(statusCode);
    projectComment = trim(projectComment);
  }

  private static String trim(String value) {
    return value == null ? null : value.trim();
  }
}
