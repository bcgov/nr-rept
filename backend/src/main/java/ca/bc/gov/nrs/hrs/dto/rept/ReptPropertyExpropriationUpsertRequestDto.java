package ca.bc.gov.nrs.hrs.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

/**
 * Request payload for creating or updating property expropriation details.
 * Corresponds to the Expropriation tab in the legacy property form.
 */
public record ReptPropertyExpropriationUpsertRequestDto(
    Long revisionCount,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate executiveApprovalDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate consensualServiceDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate noticeAdvancePaymentDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate vestingDate) {}
