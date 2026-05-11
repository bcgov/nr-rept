package ca.bc.gov.nrs.hrs.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Projection that mirrors the legacy REPT welcome screen payload. The legacy Struts application
 * displayed recently accessed projects using the same set of columns.
 */
public record ReptRecentProjectDto(
    Long id,
    String filePrefix,
    Long projectNumber,
    String fileSuffix,
    String projectName,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime requestDate) {

  public ReptRecentProjectDto {
    Objects.requireNonNull(id, "id is required");
    // other columns can be nullable but we trim whitespace for consistency
    if (filePrefix != null) {
      filePrefix = filePrefix.trim();
    }
    if (fileSuffix != null) {
      fileSuffix = fileSuffix.trim();
    }
    if (projectName != null) {
      projectName = projectName.trim();
    }
  }

  @JsonProperty("fileNumber")
  public String fileNumber() {
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
