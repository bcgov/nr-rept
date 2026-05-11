package ca.bc.gov.nrs.hrs.dto.rept.admin;

public record ReptContactAdminDto(
    Long id,
    Long revisionCount,
    String displayName,
    String firstName,
    String lastName,
    String companyName,
    String address,
    String city,
    String provinceState,
    String country,
    String postalZipCode,
    String email,
    String phone,
    String fax
) {
}
