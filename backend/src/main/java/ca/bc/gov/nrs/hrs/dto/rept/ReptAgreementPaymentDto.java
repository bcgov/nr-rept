package ca.bc.gov.nrs.hrs.dto.rept;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Represents a REPT agreement payment along with CAS coding and linked payees. Values mirror the
 * legacy payments pane so the frontend can display the most recent payment history per agreement.
 */
public record ReptAgreementPaymentDto(
    Long id,
    Long agreementId,
    Boolean rescinded,
    LocalDate requestDate,
    BigDecimal amount,
    BigDecimal gstAmount,
    BigDecimal totalAmount,
    String paymentTermTypeCode,
    String paymentTermTypeLabel,
    String paymentTypeCode,
    String paymentTypeLabel,
    String processingInstructions,
    String casClient,
    String casResponsibilityCentre,
    String casServiceLine,
    String casStob,
    String casProjectNumber,
    Long taxRateId,
    BigDecimal taxRatePercent,
    String expenseAuthorityCode,
    String expenseAuthorityLabel,
    String qualifiedReceiverCode,
    String qualifiedReceiverLabel,
    Long revisionCount,
    List<ReptAgreementPayeeDto> payees) {}
