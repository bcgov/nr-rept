package ca.bc.gov.nrs.hrs.dto;

import lombok.With;

/**
 * The type Code description dto.
 */
@With
public record CodeDescriptionDto(
    String code,
    String description
) {

}
