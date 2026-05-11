package ca.bc.gov.nrs.rept.dto.rept.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReptExpenseAuthorityUpsertRequestDto(
    @NotBlank @Size(max = 255) String name,
    Boolean active
) {
}
