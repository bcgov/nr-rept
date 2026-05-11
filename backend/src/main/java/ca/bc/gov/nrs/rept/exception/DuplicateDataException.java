package ca.bc.gov.nrs.rept.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Exception thrown when attempting to create or update data that would violate
 * a unique constraint. This exception is caught and converted to a user-friendly
 * error message by the service layer.
 */
public class DuplicateDataException extends ResponseStatusException {

  private static final String MESSAGE = "This record already exists and cannot be duplicated";

  public DuplicateDataException() {
    super(HttpStatus.CONFLICT, MESSAGE);
  }

  public DuplicateDataException(String message) {
    super(HttpStatus.CONFLICT, message != null ? message : MESSAGE);
  }

  public DuplicateDataException(String message, Throwable cause) {
    super(HttpStatus.CONFLICT, message != null ? message : MESSAGE, cause);
  }
}
