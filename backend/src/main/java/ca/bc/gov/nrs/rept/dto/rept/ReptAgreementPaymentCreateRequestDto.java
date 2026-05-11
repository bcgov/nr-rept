package ca.bc.gov.nrs.rept.dto.rept;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Payload for creating a new payment against an agreement. Mirrors the legacy REPT payment form.
 * Required fields based on legacy system:
 * - requestDate: When the payment is requested
 * - amount: Payment amount (must be positive)
 * - propertyContactIds: At least one payee must be selected
 *
 * Optional fields that may be null or empty:
 * - All dropdown selections (paymentTypeCode, paymentTermTypeCode, expenseAuthorityCode, qualifiedReceiverCode)
 * - All CAS fields (casClient, casResponsibilityCentre, casServiceLine, casStob, casProjectNumber)
 * - processingInstructions
 */
public record ReptAgreementPaymentCreateRequestDto(
    @NotNull LocalDate requestDate,
    @NotNull @Positive BigDecimal amount,
    Boolean applyGst,
    String paymentTypeCode,
    String paymentTermTypeCode,
    String expenseAuthorityCode,
    String qualifiedReceiverCode,
    String casClient,
    String casResponsibilityCentre,
    String casServiceLine,
    String casStob,
    String casProjectNumber,
    String processingInstructions,
    @NotEmpty List<@NotNull Long> propertyContactIds) {}
