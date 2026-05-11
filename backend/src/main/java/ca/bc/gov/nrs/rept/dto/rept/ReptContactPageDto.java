package ca.bc.gov.nrs.rept.dto.rept;

import java.util.List;

/**
 * Simple container that mirrors the legacy paging contract for project contacts. Paging is performed
 * client-side in the modern UI, but the DTO retains the shape so the frontend can track row counts
 * without additional computation.
 */
public record ReptContactPageDto(List<ReptContactAssociationDto> results, int total) {

  public ReptContactPageDto {
    if (results == null) {
      results = List.of();
    } else {
      results = List.copyOf(results);
    }
    total = results.size();
  }
}
