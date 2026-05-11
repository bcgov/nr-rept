package ca.bc.gov.nrs.hrs.service.rept;

import java.util.Collections;
import java.util.List;

/**
 * Raised when an agreement command (update, property assignment, payment action, etc.) cannot be
 * completed. The {@link Reason} indicates how the controller should translate the failure into an
 * HTTP status, while {@link #validationErrors} (when provided) mirrors the legacy validation
 * messages so the UI can surface them inline.
 */
public class AgreementCommandException extends RuntimeException {

  public enum Reason {
    NOT_FOUND,
    VALIDATION,
    CONFLICT,
    DATABASE_ERROR
  }

  private final Reason reason;
  private final List<String> validationErrors;

  public AgreementCommandException(Reason reason, String message) {
    super(message);
    this.reason = reason;
    this.validationErrors = List.of();
  }

  public AgreementCommandException(Reason reason, String message, Throwable cause) {
    super(message, cause);
    this.reason = reason;
    this.validationErrors = List.of();
  }

  public AgreementCommandException(Reason reason, String message, List<String> validationErrors) {
    super(message);
    this.reason = reason;
    this.validationErrors = validationErrors == null ? List.of() : List.copyOf(validationErrors);
  }

  public Reason getReason() {
    return reason;
  }

  public List<String> getValidationErrors() {
    return Collections.unmodifiableList(validationErrors);
  }
}
