package ca.bc.gov.nrs.hrs.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.TOO_MANY_REQUESTS)
public class TooManyRequestsException extends RetriableException {

  public TooManyRequestsException(String entity, String retryAfter) {
    super(
        HttpStatus.TOO_MANY_REQUESTS,
        String.format("%s had too many requests, retry after %s",
            entity, retryAfter
        )
    );
  }
}
