package ca.bc.gov.nrs.rept.dto.rept;

import java.util.List;

public record ReptProjectSearchResponseDto(
    List<ReptProjectSearchResultDto> results,
    int total,
    int page,
    int size) {}
