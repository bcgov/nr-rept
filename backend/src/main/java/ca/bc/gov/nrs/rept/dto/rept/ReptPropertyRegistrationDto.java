package ca.bc.gov.nrs.rept.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

/**
 * Registration details maintained by the legacy acquisition registration sub-tab.
 */
public record ReptPropertyRegistrationDto(
    Long propertyId,
    String ltoPlanNumber,
    String ltoDocumentNumber,
    String surveyTubeNumber,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate registrationDate,
    Long revisionCount) {}
