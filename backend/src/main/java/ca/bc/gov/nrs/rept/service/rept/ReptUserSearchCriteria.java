package ca.bc.gov.nrs.rept.service.rept;

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
    // A non-positive size means "unspecified" — the controller's default. Left
    // as 0 so ReptUserDirectoryService can substitute its configured
    // default-page-size; clamping it to 1 here would silently cap every
    // size-less search at a single result.
    if (size < 0) {
      size = 0;
    }
  }
}
