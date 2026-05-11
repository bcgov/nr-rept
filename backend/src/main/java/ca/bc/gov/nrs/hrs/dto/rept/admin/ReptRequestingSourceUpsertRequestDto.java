package ca.bc.gov.nrs.hrs.dto.rept.admin;

import jakarta.validation.constraints.Size;

public record ReptRequestingSourceUpsertRequestDto(
    @Size(max = 255) String name,
    Boolean external,
    Long orgUnitNumber,
    Long revisionCount
) {
}
