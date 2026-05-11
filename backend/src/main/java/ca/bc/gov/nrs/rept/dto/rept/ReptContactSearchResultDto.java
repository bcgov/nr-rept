package ca.bc.gov.nrs.rept.dto.rept;

/**
 * Simple contact summary for search results when adding contacts to a project.
 */
public record ReptContactSearchResultDto(
    Long id,
    String displayName,
    String firstName,
    String lastName,
    String companyName,
    String city,
    String phone,
    String email) {}
