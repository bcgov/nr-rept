package ca.bc.gov.nrs.hrs.dto.rept.report;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

public record ReptReportRequestDto(
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
    @JsonFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
    String agreementType,
    String agreementActive,
    String sortColumn,
    String region,
    String district,
    String bctsOffice,
    Boolean agreementExists,
    String projectStatus,
    ReptReportFormat format,
    Long paymentId
) {}
