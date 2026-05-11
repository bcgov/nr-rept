package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.ReptRecentProjectDto;
import ca.bc.gov.nrs.rept.service.rept.ReptWelcomeService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lightweight controller that exposes a small endpoint to return the same
 * "recently accessed projects" data used by the legacy REPT welcome page.
 *
 * Implementation note: the legacy app calls the stored procedure
 * REPT_PROJECT_FIND_RECENT. To avoid depending on a compiled Oracle driver
 * at build time here we issue an equivalent SELECT that returns the same
 * identifying columns used in the UI.
 */
@RestController
@RequestMapping("/api/rept")
@Validated
public class ReptWelcomeController {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptWelcomeController.class);

  // No mock/fallback data: per user request we will not return fabricated data.

  private final ObjectProvider<ReptWelcomeService> welcomeServiceProvider;

  public ReptWelcomeController(ObjectProvider<ReptWelcomeService> welcomeServiceProvider) {
    this.welcomeServiceProvider = welcomeServiceProvider;
  }

  @GetMapping("/welcome/recent")
  public ResponseEntity<List<ReptRecentProjectDto>> recent(
      @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
    ReptWelcomeService welcomeService = welcomeServiceProvider.getIfAvailable();
    if (welcomeService != null) {
      try {
        List<ReptRecentProjectDto> data = welcomeService.findRecentProjects(size);
        if (data == null || data.isEmpty()) {
          return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(data);
      } catch (Exception ex) {
        LOGGER.warn("REPT welcome service failed (likely missing DB schema): {}", ex.getMessage());
        // Do not return mock data. Surface absence as 'no content' so the UI can show an empty state.
        return ResponseEntity.noContent().build();
      }
    }

    LOGGER.warn("REPT welcome service unavailable – no data will be returned for local profile");
    return ResponseEntity.noContent().build();
  }
}
