package ca.bc.gov.nrs.hrs.dto.rept;

import ca.bc.gov.nrs.hrs.dto.CodeNameDto;
import java.util.List;

public record ReptProjectSearchOptionsDto(
    List<CodeNameDto> regions,
    List<CodeNameDto> districts,
    List<CodeNameDto> statuses,
    List<CodeNameDto> projectManagers,
    List<CodeNameDto> filePrefixes) {}
