package ca.bc.gov.nrs.hrs.dto.rept;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request payload for adding a contact to a property. The contact must already exist in the system.
 */
public record ReptPropertyContactAddDto(
    @NotNull @Positive Long contactId,
    @NotNull String contactTypeCode) {

  public ReptPropertyContactAddDto {
    if (contactTypeCode != null) {
      contactTypeCode = contactTypeCode.trim();
    }
  }
}
