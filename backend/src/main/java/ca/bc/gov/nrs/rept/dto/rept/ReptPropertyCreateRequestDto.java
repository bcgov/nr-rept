package ca.bc.gov.nrs.rept.dto.rept;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Request payload for creating a new project property.
 * Maps to the fields in the legacy property details form.
 * Field size constraints match Oracle database column definitions.
 */
public record ReptPropertyCreateRequestDto(
    @NotNull @Positive Long projectId,
    @Size(max = 25) String titleNumber,
    @NotBlank @Size(max = 25) String parcelIdentifier,
    @NotBlank @Size(max = 4000) String legalDescription,
    @Size(max = 100) String parcelAddress,
    @NotBlank @Size(max = 50) String city,
    @NotNull BigDecimal parcelArea,
    @NotNull BigDecimal projectArea,
    BigDecimal assessedValue,
    @NotBlank @Size(max = 3) String acquisitionCode,
    @NotBlank @Size(max = 3) String landTitleOfficeCode,
    @NotBlank @Size(max = 3) String electoralDistrictCode,
    @NotNull Long orgUnitNumber,
    Boolean expropriationRecommended) {}
