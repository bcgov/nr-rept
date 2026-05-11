package ca.bc.gov.nrs.rept.dto.rept;

import java.math.BigDecimal;

/** Describes the GST/tax rate that is currently effective for payment creation. */
public record ReptAgreementPaymentTaxRateDto(
    Long id,
    BigDecimal percent
) {}
