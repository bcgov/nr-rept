package ca.bc.gov.nrs.rept.dto.rept.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record ReptContactUpsertRequestDto(
    Long revisionCount,
    @Size(max = 255) String firstName,
    @Size(max = 255) String lastName,
    @Size(max = 255) String companyName,
    @Size(max = 255) String address,
    @Size(max = 100) String city,
    @Size(max = 100) String provinceState,
    @Size(max = 100) String country,
    @Size(max = 20) String postalZipCode,
    @Email @Size(max = 255) String email,
    @Size(max = 30) String phone,
    @Size(max = 30) String fax
) {
}
