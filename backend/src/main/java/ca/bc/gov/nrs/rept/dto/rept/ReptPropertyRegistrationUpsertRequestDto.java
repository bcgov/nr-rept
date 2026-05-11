package ca.bc.gov.nrs.rept.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

/**
 * Request payload for creating or updating property registration details.
 * Corresponds to the Registration tab in the legacy property form.
 */
public record ReptPropertyRegistrationUpsertRequestDto(
    Long revisionCount,
    String ltoPlanNumber,
    String ltoDocumentNumber,
    String surveyTubeNumber,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate registrationDate) {}
