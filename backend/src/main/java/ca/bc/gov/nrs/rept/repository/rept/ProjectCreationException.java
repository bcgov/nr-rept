package ca.bc.gov.nrs.rept.repository.rept;

/**
 * Exception raised when the REPT project insert stored procedure returns an error. The {@link Reason}
 * flag mirrors the legacy Oracle error classifications (duplicate, check constraint, etc.) so the
 * service layer can translate them into meaningful HTTP responses.
 */
public class ProjectCreationException extends RuntimeException {

  public enum Reason {
    DUPLICATE,
    CHECK_CONSTRAINT,
    DATA_NOT_CURRENT,
    CHILD_RECORDS_EXIST,
    DATABASE_ERROR
  }

  private final Reason reason;

  public ProjectCreationException(Reason reason, String message) {
    super(message);
    this.reason = reason;
  }

  public ProjectCreationException(Reason reason, String message, Throwable cause) {
    super(message, cause);
    this.reason = reason;
  }

  public Reason getReason() {
    return reason;
  }
}
