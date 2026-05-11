package ca.bc.gov.nrs.rept.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

/**
 * Snapshot of expropriation-centric milestone dates for a property.
 */
public record ReptPropertyExpropriationDto(
    Long propertyId,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate executiveApprovalDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate consensualServiceDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate noticeAdvancePaymentDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate vestingDate,
    Long revisionCount) {}
