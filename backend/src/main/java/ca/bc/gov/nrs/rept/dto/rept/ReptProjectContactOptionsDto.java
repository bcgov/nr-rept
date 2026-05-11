package ca.bc.gov.nrs.rept.dto.rept;

import ca.bc.gov.nrs.rept.dto.CodeNameDto;
import java.util.List;

/**
 * Options available for project contacts, including contact types.
 */
public record ReptProjectContactOptionsDto(
    List<CodeNameDto> contactTypes) {}
