package ca.bc.gov.nrs.hrs.dto.rept;

import java.util.Objects;

/**
 * Association wrapper used by the contacts tab to relate a contact to a project or to an
 * individual property within that project. Property metadata is optional and only populated for
 * property-level associations.
 */
public record ReptContactAssociationDto(
    Long associationId,
    String associationType,
    Long propertyId,
    String propertyParcelIdentifier,
    String propertyTitleNumber,
    ReptContactDto contact) {

  public ReptContactAssociationDto {
    Objects.requireNonNull(associationId, "associationId is required");
    Objects.requireNonNull(associationType, "associationType is required");
    Objects.requireNonNull(contact, "contact is required");

    associationType = associationType.trim();
    if (propertyParcelIdentifier != null) {
      propertyParcelIdentifier = propertyParcelIdentifier.trim();
    }
    if (propertyTitleNumber != null) {
      propertyTitleNumber = propertyTitleNumber.trim();
    }
  }
}
