package ca.bc.gov.nrs.hrs.dto;

import lombok.With;

@With
public record CodeNameDto(
    String code,
    String name
) {

}
