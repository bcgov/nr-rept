package ca.bc.gov.nrs.hrs.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

/**
 * Response payload returned after creating a REPT project. Provides the identifiers required by
 * the new UI to mirror the legacy confirmation screen.
 */
public record ReptProjectCreateResultDto(
    Long id,
    Long revisionCount,
    Long projectNumber,
    String filePrefix,
    String fileSuffix,
    String projectName,
    String statusCode,
    String priorityCode,
    String requestingSourceId,
    String requestorUserId,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate requestDate
) {

  public ReptProjectCreateResultDto {
    filePrefix = trim(filePrefix);
    fileSuffix = trim(fileSuffix);
    projectName = trim(projectName);
    statusCode = trim(statusCode);
    priorityCode = trim(priorityCode);
    requestingSourceId = trim(requestingSourceId);
    requestorUserId = trim(requestorUserId);
  }

  @JsonProperty("projectFile")
  public String projectFile() {
    String prefix = blankToNull(filePrefix);
    String suffix = blankToNull(fileSuffix);
    String number = projectNumber == null ? null : padProjectNumber(projectNumber);

    StringBuilder builder = new StringBuilder();
    if (prefix != null) {
      builder.append(prefix);
    }
    if (number != null) {
      if (builder.length() > 0) {
        builder.append('/');
      }
      builder.append(number);
    }
    if (suffix != null) {
      if (builder.length() > 0 && builder.charAt(builder.length() - 1) != '/') {
        builder.append('-');
      }
      builder.append(suffix);
    }
    return builder.length() == 0 ? null : builder.toString();
  }

  private static String padProjectNumber(Long projectNumber) {
    String raw = Long.toString(projectNumber);
    return raw.length() >= 5 ? raw : String.format("%05d", projectNumber);
  }

  private static String blankToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private static String trim(String value) {
    return value == null ? null : value.trim();
  }
}
