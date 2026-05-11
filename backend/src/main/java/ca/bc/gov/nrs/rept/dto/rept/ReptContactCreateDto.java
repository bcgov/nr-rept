package ca.bc.gov.nrs.rept.dto.rept;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating a new contact in the system.
 * Based on legacy validation: either (firstName AND lastName) OR companyName must be provided.
 */
public record ReptContactCreateDto(
    @Size(max = 50) String firstName,
    @Size(max = 50) String lastName,
    @Size(max = 50) String companyName,
    @NotBlank @Size(max = 100) String address,
    @NotBlank @Size(max = 50) String city,
    @NotBlank @Size(max = 15) String provinceState,
    @NotBlank @Size(max = 25) String country,
    @NotBlank @Size(max = 9) String postalZipCode,
    @Size(max = 12) String phone,
    @Size(max = 12) String fax,
    @Size(max = 50) @Email String email) {

  public ReptContactCreateDto {
    if (firstName != null) {
      firstName = firstName.trim();
    }
    if (lastName != null) {
      lastName = lastName.trim();
    }
    if (companyName != null) {
      companyName = companyName.trim();
    }
    if (address != null) {
      address = address.trim();
    }
    if (city != null) {
      city = city.trim();
    }
    if (provinceState != null) {
      provinceState = provinceState.trim();
    }
    if (country != null) {
      country = country.trim();
    }
    if (postalZipCode != null) {
      postalZipCode = postalZipCode.trim();
    }
    if (phone != null) {
      phone = phone.trim();
    }
    if (fax != null) {
      fax = fax.trim();
    }
    if (email != null) {
      email = email.trim();
    }
  }
}
