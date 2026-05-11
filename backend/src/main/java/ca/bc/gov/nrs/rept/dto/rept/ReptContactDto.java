package ca.bc.gov.nrs.rept.dto.rept;

import java.util.Objects;

/**
 * Contact detail payload that surfaces the association between a project/property and the contact
 * itself. Includes the raw code and resolved label for the contact type along with core contact
 * coordinates used across the modern REPT UI.
 */
public record ReptContactDto(
    Long associationId,
    Long contactId,
    String contactTypeCode,
    String contactTypeLabel,
    String displayName,
    String firstName,
    String lastName,
    String companyName,
    String phone,
    String fax,
    String email,
    String address,
    String city,
    String provinceState,
    String country,
    String postalZipCode) {

  public ReptContactDto {
    Objects.requireNonNull(associationId, "associationId is required");
    Objects.requireNonNull(contactId, "contactId is required");

    if (contactTypeCode != null) {
      contactTypeCode = contactTypeCode.trim();
    }
    if (contactTypeLabel != null) {
      contactTypeLabel = contactTypeLabel.trim();
    }
    if (displayName != null) {
      displayName = displayName.trim();
    }
    if (firstName != null) {
      firstName = firstName.trim();
    }
    if (lastName != null) {
      lastName = lastName.trim();
    }
    if (companyName != null) {
      companyName = companyName.trim();
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
  }
}
