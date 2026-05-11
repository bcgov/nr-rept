package ca.bc.gov.nrs.rept.dto.rept;

/**
 * Contact/property pairing used to show which parties receive payment for an agreement. Includes
 * both contact coordinates and the related parcel identifiers from the property contact record.
 */
public record ReptAgreementPayeeDto(
    Long id,
    Long paymentId,
    Long propertyContactId,
    Long propertyId,
    String parcelIdentifier,
    String titleNumber,
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
    String postalZipCode) {}
