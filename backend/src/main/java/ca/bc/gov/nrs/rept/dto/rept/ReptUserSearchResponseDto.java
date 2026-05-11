package ca.bc.gov.nrs.rept.dto.rept;

import java.util.List;

public record ReptUserSearchResponseDto(
    List<ReptUserSummaryDto> results,
    long total,
    int page,
    int size
) {
}
