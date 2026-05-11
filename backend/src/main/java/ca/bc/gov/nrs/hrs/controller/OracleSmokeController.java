package ca.bc.gov.nrs.hrs.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Small smoke endpoint that verifies Oracle connectivity by executing a lightweight query.
 * Active only when the `oracle` profile is enabled.
 */
@RestController
@RequestMapping("/internal/oracle")
@Profile("oracle")
public class OracleSmokeController {

  private final JdbcTemplate jdbcTemplate;

  public OracleSmokeController(@Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @GetMapping("/health")
  public ResponseEntity<Map<String, Object>> health() {
    try {
      Integer result = jdbcTemplate.queryForObject("SELECT 1 FROM DUAL", Integer.class);
      return ResponseEntity.ok(Map.of("status", "UP", "database", "ORACLE", "result", result));
    } catch (Exception e) {
      return ResponseEntity.status(503).body(Map.of("status", "DOWN", "error", e.getMessage()));
    }
  }

}
