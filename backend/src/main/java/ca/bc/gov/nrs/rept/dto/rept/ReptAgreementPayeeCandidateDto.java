package ca.bc.gov.nrs.rept.dto.rept;

/**
 * Represents a property/contact association that can be selected as a payee for an agreement
 * payment request. Mirrors the information presented in the legacy UI so the frontend can display
 * both the contact and parcel context for each candidate.
 */
public record ReptAgreementPayeeCandidateDto(
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
    String postalZipCode
) {}
