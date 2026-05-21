package ca.bc.gov.nrs.rept.dto.rept.admin;

import jakarta.validation.constraints.Size;

public record ReptRequestingSourceUpsertRequestDto(
    // External requesting sources carry the free-text name. Frontend mirrors
    // via maxLength=500.
    @Size(max = 500) String name,
    Boolean external,
    Long orgUnitNumber,
    Long revisionCount
) {
}
