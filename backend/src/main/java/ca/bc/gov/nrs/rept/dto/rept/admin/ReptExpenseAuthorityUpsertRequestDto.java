package ca.bc.gov.nrs.rept.dto.rept.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReptExpenseAuthorityUpsertRequestDto(
    // Mirrors REPT_EXPENSE_AUTHORITY.EXPENSE_AUTHORITY (VARCHAR2(20)).
    // Frontend enforces the same via the form's maxLength.
    @NotBlank @Size(max = 20) String name,
    Boolean active
) {
}
