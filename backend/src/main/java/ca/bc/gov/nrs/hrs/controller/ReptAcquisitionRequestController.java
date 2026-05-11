package ca.bc.gov.nrs.hrs.controller;

import ca.bc.gov.nrs.hrs.dto.rept.ReptAcquisitionRequestCreateDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptAcquisitionRequestDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptAcquisitionRequestOptionsDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptAcquisitionRequestUpdateDto;
import ca.bc.gov.nrs.hrs.repository.rept.ProjectCreationException;
import ca.bc.gov.nrs.hrs.service.rept.ReptAcquisitionRequestService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
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
@RequestMapping("/api/rept/projects/{projectId}/acquisition-request")
@Validated
public class ReptAcquisitionRequestController {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ReptAcquisitionRequestController.class);

  private final ObjectProvider<ReptAcquisitionRequestService> serviceProvider;

  public ReptAcquisitionRequestController(
      ObjectProvider<ReptAcquisitionRequestService> serviceProvider) {
    this.serviceProvider = serviceProvider;
  }

  @GetMapping
  public ResponseEntity<ReptAcquisitionRequestDto> getAcquisitionRequest(
      @PathVariable("projectId") @Positive Long projectId) {
    ReptAcquisitionRequestService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT acquisition request service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      Optional<ReptAcquisitionRequestDto> result = service.findByProject(projectId);
      return result.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT acquisition request lookup failed for project {}: {}",
          projectId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/options")
  public ResponseEntity<ReptAcquisitionRequestOptionsDto> getOptions(
      @PathVariable("projectId") @Positive Long projectId) {
    ReptAcquisitionRequestService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT acquisition request service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    ReptAcquisitionRequestOptionsDto options = service.loadOptions();
    return ResponseEntity.ok(options);
  }

  @PostMapping
  public ResponseEntity<?> createAcquisitionRequest(
      @PathVariable("projectId") @Positive Long projectId,
      @Valid @RequestBody ReptAcquisitionRequestCreateDto request) {
    ReptAcquisitionRequestService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT acquisition request service unavailable – unable to create");
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
      problem.setTitle("Service unavailable");
      problem.setDetail("Acquisition request service is temporarily unavailable.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }

    try {
      ReptAcquisitionRequestDto result = service.createAcquisitionRequest(projectId, request);
      return ResponseEntity.status(HttpStatus.CREATED).body(result);
    } catch (ProjectCreationException ex) {
      LOGGER.warn("Acquisition request creation failed: {}", ex.getMessage());
      return handleException(ex);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn("Invalid acquisition request creation: {}", ex.getMessage());
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
      problem.setTitle("Invalid request");
      problem.setDetail(ex.getMessage());
      return ResponseEntity.badRequest().body(problem);
    } catch (Exception ex) {
      LOGGER.error("Unexpected error while creating acquisition request", ex);
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      problem.setTitle("Unable to create acquisition request");
      problem.setDetail("An unexpected error occurred while creating the acquisition request.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }
  }

  @PutMapping
  public ResponseEntity<?> updateAcquisitionRequest(
      @PathVariable("projectId") @Positive Long projectId,
      @Valid @RequestBody ReptAcquisitionRequestUpdateDto request) {
    ReptAcquisitionRequestService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT acquisition request service unavailable – unable to update");
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
      problem.setTitle("Service unavailable");
      problem.setDetail("Acquisition request service is temporarily unavailable.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }

    try {
      ReptAcquisitionRequestDto result = service.updateAcquisitionRequest(projectId, request);
      return ResponseEntity.ok(result);
    } catch (ProjectCreationException ex) {
      LOGGER.warn("Acquisition request update failed: {}", ex.getMessage());
      return handleException(ex);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn("Invalid acquisition request update: {}", ex.getMessage());
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
      problem.setTitle("Invalid request");
      problem.setDetail(ex.getMessage());
      return ResponseEntity.badRequest().body(problem);
    } catch (Exception ex) {
      LOGGER.error("Unexpected error while updating acquisition request", ex);
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      problem.setTitle("Unable to update acquisition request");
      problem.setDetail("An unexpected error occurred while updating the acquisition request.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }
  }

  private ResponseEntity<ProblemDetail> handleException(ProjectCreationException ex) {
    HttpStatus status = switch (ex.getReason()) {
      case DUPLICATE -> HttpStatus.CONFLICT;
      case CHECK_CONSTRAINT -> HttpStatus.BAD_REQUEST;
      case DATA_NOT_CURRENT -> HttpStatus.CONFLICT;
      case CHILD_RECORDS_EXIST -> HttpStatus.CONFLICT;
      case DATABASE_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
    };

    ProblemDetail problem = ProblemDetail.forStatus(status);
    problem.setTitle("Unable to save acquisition request");
    problem.setDetail(ex.getMessage());
    problem.setProperty("reason", ex.getReason().name());
    return ResponseEntity.status(status).body(problem);
  }
}
