package ca.bc.gov.nrs.hrs.dto.rept;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * Request payload for updating an existing project property's details.
 * Includes revision count for optimistic locking.
 * Field size constraints match Oracle database column definitions.
 */
public record ReptPropertyUpdateRequestDto(
    @NotNull @Positive Long revisionCount,
    @Size(max = 25) String titleNumber,
    @Size(max = 25) String parcelIdentifier,
    @Size(max = 4000) String legalDescription,
    @Size(max = 100) String parcelAddress,
    @NotBlank @Size(max = 50) String city,
    BigDecimal parcelArea,
    BigDecimal projectArea,
    BigDecimal assessedValue,
    @Size(max = 3) String acquisitionCode,
    @Size(max = 3) String landTitleOfficeCode,
    @Size(max = 3) String electoralDistrictCode,
    Long orgUnitNumber,
    Boolean expropriationRecommended) {}
