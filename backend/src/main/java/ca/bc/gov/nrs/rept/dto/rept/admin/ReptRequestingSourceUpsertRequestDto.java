package ca.bc.gov.nrs.rept.dto.rept.admin;

import jakarta.validation.constraints.Size;

public record ReptRequestingSourceUpsertRequestDto(
    @Size(max = 255) String name,
    Boolean external,
    Long orgUnitNumber,
    Long revisionCount
) {
}
