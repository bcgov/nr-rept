package ca.bc.gov.nrs.rept.dto.rept;

import java.util.Objects;

/**
 * Lightweight projection for project search results. Mirrors the legacy REPT search response by
 * exposing identifier, file components, status, and organizational information required by the UI.
 */
public record ReptProjectSearchResultDto(
    Long id,
    String filePrefix,
    Long projectNumber,
    String fileSuffix,
    String projectName,
    Long regionNumber,
    String regionLabel,
    Long districtNumber,
    String districtLabel,
    String statusCode,
    String statusLabel) {

  public ReptProjectSearchResultDto {
    Objects.requireNonNull(id, "id is required");
    filePrefix = trim(filePrefix);
    fileSuffix = trim(fileSuffix);
    projectName = trim(projectName);
    statusCode = trim(statusCode);
    statusLabel = trim(statusLabel);
    regionLabel = trim(regionLabel);
    districtLabel = trim(districtLabel);
  }

  private static String trim(String value) {
    return value == null ? null : value.trim();
  }
}
