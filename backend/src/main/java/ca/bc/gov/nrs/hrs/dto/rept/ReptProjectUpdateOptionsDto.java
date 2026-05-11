package ca.bc.gov.nrs.hrs.dto.rept;

import ca.bc.gov.nrs.hrs.dto.CodeNameDto;
import java.util.List;

/**
 * Options available when editing a project, including all dropdowns.
 */
public record ReptProjectUpdateOptionsDto(
    List<CodeNameDto> statuses,
    List<CodeNameDto> priorities,
    List<CodeNameDto> regions,
    List<CodeNameDto> districts,
    List<CodeNameDto> bctsOffices,
    List<CodeNameDto> requestingSources,
    List<CodeNameDto> projectManagers) {}
