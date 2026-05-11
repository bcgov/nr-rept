package ca.bc.gov.nrs.hrs.service.rept;

public record ReptUserSearchCriteria(
    String userId,
    String firstName,
    String lastName,
    int page,
    int size
) {

  public ReptUserSearchCriteria {
    if (page < 0) {
      page = 0;
    }
    if (size <= 0) {
      size = 1;
    }
  }
}
