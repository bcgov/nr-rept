package ca.bc.gov.nrs.hrs.dto.rept;

import ca.bc.gov.nrs.hrs.dto.CodeNameDto;
import java.util.List;

/**
 * Aggregated code-list payload required to render the "new project" form in the modern UI.
 */
public record ReptProjectCreateOptionsDto(
    List<CodeNameDto> filePrefixes,
    List<CodeNameDto> statuses,
    List<CodeNameDto> regions,
    List<CodeNameDto> districts,
    List<CodeNameDto> bctsOffices,
    List<CodeNameDto> requestingSources,
    List<CodeNameDto> priorities
) {

  public ReptProjectCreateOptionsDto {
    filePrefixes = copyOrEmpty(filePrefixes);
    statuses = copyOrEmpty(statuses);
    regions = copyOrEmpty(regions);
    districts = copyOrEmpty(districts);
    bctsOffices = copyOrEmpty(bctsOffices);
    requestingSources = copyOrEmpty(requestingSources);
    priorities = copyOrEmpty(priorities);
  }

  private static List<CodeNameDto> copyOrEmpty(List<CodeNameDto> source) {
    return source == null ? List.of() : List.copyOf(source);
  }
}
