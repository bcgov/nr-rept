package ca.bc.gov.nrs.rept.dto;

import lombok.With;

@With
public record CodeNameDto(
    String code,
    String name
) {

}
