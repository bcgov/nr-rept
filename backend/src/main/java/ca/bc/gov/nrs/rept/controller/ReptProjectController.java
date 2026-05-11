package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.ReptProjectCreateOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectCreateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectCreateResultDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectDetailDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectUpdateOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectUpdateRequestDto;
import ca.bc.gov.nrs.rept.service.rept.ReptProjectService;
import ca.bc.gov.nrs.rept.repository.rept.ProjectCreationException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.net.URI;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rept")
@Validated
public class ReptProjectController {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptProjectController.class);

  private final ObjectProvider<ReptProjectService> projectServiceProvider;

  public ReptProjectController(ObjectProvider<ReptProjectService> projectServiceProvider) {
    this.projectServiceProvider = projectServiceProvider;
  }

  @GetMapping("/projects/{projectId}")
  public ResponseEntity<ReptProjectDetailDto> detail(@PathVariable("projectId") @Positive Long projectId) {
    ReptProjectService service = projectServiceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT project detail service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      Optional<ReptProjectDetailDto> result = service.findProject(projectId);
      return result.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    } catch (Exception ex) {
      LOGGER.warn("REPT project detail lookup failed for id {}: {}", projectId, ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/projects/create/options")
  public ResponseEntity<ReptProjectCreateOptionsDto> createOptions() {
    ReptProjectService service = projectServiceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT project service unavailable – returning empty create options");
      return ResponseEntity.noContent().build();
    }

    ReptProjectCreateOptionsDto options = service.loadCreateOptions();
    return ResponseEntity.ok(options);
  }

  @GetMapping("/projects/{projectId}/edit/options")
  public ResponseEntity<ReptProjectUpdateOptionsDto> updateOptions(
      @PathVariable("projectId") @Positive Long projectId) {
    ReptProjectService service = projectServiceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT project service unavailable – returning empty update options");
      return ResponseEntity.noContent().build();
    }

    ReptProjectUpdateOptionsDto options = service.loadUpdateOptions();
    return ResponseEntity.ok(options);
  }

  @PutMapping("/projects/{projectId}")
  public ResponseEntity<?> update(
      @PathVariable("projectId") @Positive Long projectId,
      @Valid @RequestBody ReptProjectUpdateRequestDto request) {
    ReptProjectService service = projectServiceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT project service unavailable – unable to update project");
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
      problem.setTitle("Service unavailable");
      problem.setDetail("Project update service is temporarily unavailable.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }

    try {
      ReptProjectDetailDto result = service.updateProject(projectId, request);
      return ResponseEntity.ok(result);
    } catch (ProjectCreationException ex) {
      LOGGER.warn("Project file update failed: {}", ex.getMessage());
      return handleProjectCreationException(ex);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn("Invalid project update request: {}", ex.getMessage());
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
      problem.setTitle("Invalid request");
      problem.setDetail(ex.getMessage());
      return ResponseEntity.badRequest().body(problem);
    } catch (Exception ex) {
      LOGGER.error("Unexpected error while updating project file", ex);
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      problem.setTitle("Unable to update project file");
      problem.setDetail("An unexpected error occurred while updating the project file.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }
  }

  @PostMapping("/projects")
  public ResponseEntity<?> create(@Valid @RequestBody ReptProjectCreateRequestDto request) {
    ReptProjectService service = projectServiceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT project service unavailable – unable to create project");
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
      problem.setTitle("Service unavailable");
      problem.setDetail("Project creation service is temporarily unavailable.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }

    try {
      ReptProjectCreateResultDto result = service.createProject(request);
      URI location = result.id() == null
          ? URI.create("/api/rept/projects")
          : URI.create("/api/rept/projects/" + result.id());
      return ResponseEntity.created(location).body(result);
    } catch (ProjectCreationException ex) {
      LOGGER.warn("Project file creation failed: {}", ex.getMessage());
      return handleProjectCreationException(ex);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn("Invalid project creation request: {}", ex.getMessage());
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
      problem.setTitle("Invalid request");
      problem.setDetail(ex.getMessage());
      return ResponseEntity.badRequest().body(problem);
    } catch (Exception ex) {
      LOGGER.error("Unexpected error while creating project file", ex);
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      problem.setTitle("Unable to create project file");
      problem.setDetail("An unexpected error occurred while creating the project file.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }
  }

  private ResponseEntity<ProblemDetail> handleProjectCreationException(ProjectCreationException ex) {
    HttpStatus status = switch (ex.getReason()) {
      case DUPLICATE -> HttpStatus.CONFLICT;
      case CHECK_CONSTRAINT -> HttpStatus.BAD_REQUEST;
      case DATA_NOT_CURRENT -> HttpStatus.CONFLICT;
      case CHILD_RECORDS_EXIST -> HttpStatus.CONFLICT;
      case DATABASE_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
    };

    ProblemDetail problem = ProblemDetail.forStatus(status);
    problem.setTitle("Unable to create project file");
    problem.setDetail(ex.getMessage());
    problem.setProperty("reason", ex.getReason().name());
    return ResponseEntity.status(status).body(problem);
  }
}
