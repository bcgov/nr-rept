package ca.bc.gov.nrs.hrs.exception;

import org.springframework.http.HttpStatusCode;
import org.springframework.web.server.ResponseStatusException;

public class RequestException extends ResponseStatusException {

  public RequestException(HttpStatusCode status, String value) {
    super(status,String.format("Request failed with status %s: cannot retrieve data with parameter %s", status, value));
  }
}
