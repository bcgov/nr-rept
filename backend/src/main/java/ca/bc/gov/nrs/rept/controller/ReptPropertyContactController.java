package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.ReptContactDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyContactAddDto;
import ca.bc.gov.nrs.rept.repository.rept.ProjectCreationException;
import ca.bc.gov.nrs.rept.service.rept.ReptContactService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rept/projects/{projectId}/properties/{propertyId}/contacts")
@Validated
public class ReptPropertyContactController {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ReptPropertyContactController.class);

  private final ObjectProvider<ReptContactService> serviceProvider;

  public ReptPropertyContactController(ObjectProvider<ReptContactService> serviceProvider) {
    this.serviceProvider = serviceProvider;
  }

  @GetMapping
  public ResponseEntity<List<ReptContactDto>> listPropertyContacts(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId) {
    ReptContactService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT contact service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      Optional<List<ReptContactDto>> results = service.findPropertyContacts(projectId, propertyId);
      return results.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT property contact lookup failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @PostMapping
  public ResponseEntity<?> addPropertyContact(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId,
      @Valid @RequestBody ReptPropertyContactAddDto request) {
    ReptContactService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT contact service unavailable – unable to add property contact");
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
      problem.setTitle("Service unavailable");
      problem.setDetail("Contact service is temporarily unavailable.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }

    try {
      Optional<List<ReptContactDto>> result =
          service.addPropertyContact(projectId, propertyId, request.contactId(), request.contactTypeCode());
      return result
          .map(contacts -> ResponseEntity.status(HttpStatus.CREATED).body(contacts))
          .orElseGet(() -> ResponseEntity.notFound().build());
    } catch (ProjectCreationException ex) {
      LOGGER.warn("Add property contact failed: {}", ex.getMessage());
      return handleException(ex);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn("Invalid add property contact request: {}", ex.getMessage());
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
      problem.setTitle("Invalid request");
      problem.setDetail(ex.getMessage());
      return ResponseEntity.badRequest().body(problem);
    } catch (Exception ex) {
      LOGGER.error("Unexpected error while adding property contact", ex);
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      problem.setTitle("Unable to add contact");
      problem.setDetail("An unexpected error occurred while adding the contact to the property.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }
  }

  @DeleteMapping("/{associationId}")
  public ResponseEntity<?> removePropertyContact(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId,
      @PathVariable("associationId") @Positive Long associationId) {
    ReptContactService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT contact service unavailable – unable to remove property contact");
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
      problem.setTitle("Service unavailable");
      problem.setDetail("Contact service is temporarily unavailable.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }

    try {
      Optional<List<ReptContactDto>> result =
          service.removePropertyContact(projectId, propertyId, associationId);
      return result.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    } catch (ProjectCreationException ex) {
      LOGGER.warn("Remove property contact failed: {}", ex.getMessage());
      return handleException(ex);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn("Invalid remove property contact request: {}", ex.getMessage());
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
      problem.setTitle("Invalid request");
      problem.setDetail(ex.getMessage());
      return ResponseEntity.badRequest().body(problem);
    } catch (Exception ex) {
      LOGGER.error("Unexpected error while removing property contact", ex);
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      problem.setTitle("Unable to remove contact");
      problem.setDetail("An unexpected error occurred while removing the contact from the property.");
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
    problem.setTitle("Contact operation failed");
    problem.setDetail(ex.getMessage());
    problem.setProperty("reason", ex.getReason().name());
    return ResponseEntity.status(status).body(problem);
  }
}
