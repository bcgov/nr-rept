package ca.bc.gov.nrs.rept.dto.rept;

import ca.bc.gov.nrs.rept.dto.CodeNameDto;
import java.util.List;

/**
 * Options available when creating or editing an acquisition request.
 */
public record ReptAcquisitionRequestOptionsDto(
    List<CodeNameDto> acquisitionTypes,
    List<CodeNameDto> fsrTypes,
    List<CodeNameDto> roadUseTypes,
    List<CodeNameDto> fundingCodes) {}
