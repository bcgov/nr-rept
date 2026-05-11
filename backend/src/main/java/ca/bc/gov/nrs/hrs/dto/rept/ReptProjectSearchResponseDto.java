package ca.bc.gov.nrs.hrs.dto.rept;

import java.util.List;

public record ReptProjectSearchResponseDto(
    List<ReptProjectSearchResultDto> results,
    int total,
    int page,
    int size) {}
