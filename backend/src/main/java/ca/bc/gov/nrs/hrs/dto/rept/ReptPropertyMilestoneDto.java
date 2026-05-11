package ca.bc.gov.nrs.hrs.dto.rept;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

/**
 * Timeline of acquisition activities for a project property. Dates are optional and reflect the
 * legacy milestone fields while the comments match the text areas from the Struts form.
 */
public record ReptPropertyMilestoneDto(
    @Positive Long revisionCount,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate ownerContactDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate internalAppraisalDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate roadValueRequestedDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate roadValueReceivedDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate fundingRequestedDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate fundingApprovedDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate surveyRequestedDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate surveyReceivedDate,
    String assessmentComment,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate feeAppraisalRequestedDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate feeAppraisalReceivedDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate offerDate,
    String negotiationComment,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate offerAcceptedDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate completionDate,
    String acquisitionComment,
    Boolean expropriationRecommended) {}
