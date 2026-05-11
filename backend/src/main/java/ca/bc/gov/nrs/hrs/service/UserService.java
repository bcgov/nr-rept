package ca.bc.gov.nrs.hrs.service;

import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * UserService no longer persists preferences in the POC template. Keep minimal methods so any
 * callers do not break: preferences are returned as empty and saves are no-ops.
 */
@Service
public class UserService {

  public Map<String, Object> getUserPreferences(String userId) {
    return Map.of();
  }

  public void saveUserPreferences(String userId, Map<String, Object> preferences) {
    // no-op in POC
  }

}
