package ca.bc.gov.nrs.hrs.extensions;

import com.github.tomakehurst.wiremock.common.Notifier;
import lombok.extern.log4j.Log4j2;

/**
 * A notifier implementation that logs messages using SLF4J.
 */
@Log4j2
public class WiremockLogNotifier implements Notifier {

  /**
   * Logs an informational message.
   *
   * @param message the message to log
   */
  @Override
  public void info(String message) {
    log.info(message);
  }

  /**
   * Logs an error message.
   *
   * @param message the message to log
   */
  @Override
  public void error(String message) {
    log.error(message);
  }

  /**
   * Logs an error message with an associated throwable.
   *
   * @param message the message to log
   * @param t       the throwable to log
   */
  @Override
  public void error(String message, Throwable t) {
    log.error(message, t);
  }
}
