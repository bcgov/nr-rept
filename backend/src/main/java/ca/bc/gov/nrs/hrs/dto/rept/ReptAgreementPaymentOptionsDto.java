package ca.bc.gov.nrs.hrs.dto.rept;

import ca.bc.gov.nrs.hrs.dto.CodeNameDto;
import java.util.List;

/**
 * Aggregates the dropdown/selection data required to build the agreement payments form on the
 * frontend, including payee candidates, CAS code lists, and the current GST rate.
 */
public record ReptAgreementPaymentOptionsDto(
    List<ReptAgreementPayeeCandidateDto> payeeCandidates,
    List<CodeNameDto> paymentTypes,
    List<CodeNameDto> paymentTerms,
    List<CodeNameDto> expenseAuthorities,
    List<CodeNameDto> qualifiedReceivers,
    ReptAgreementPaymentTaxRateDto taxRate
) {}
