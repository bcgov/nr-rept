package ca.bc.gov.nrs.hrs.dto.rept;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReptUserSummaryDto(
    String userId,
    String displayName,
    String firstName,
    String lastName,
    String email,
    String idirGuid,
    String idirUserGuid
) {
}
