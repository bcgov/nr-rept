package ca.bc.gov.nrs.rept.dto.rept.admin;

import jakarta.validation.constraints.Size;

public record ReptCoUserUpsertRequestDto(
    // External co-users carry the free-text name; internal ones derive from
    // their org unit and leave this null. Frontend mirrors via maxLength=60.
    @Size(max = 60) String name,
    Boolean external,
    Long orgUnitNumber,
    Long revisionCount
) {
}
