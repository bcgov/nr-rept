package ca.bc.gov.nrs.hrs.controller;

import ca.bc.gov.nrs.hrs.dto.rept.ReptContactPageDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptContactSearchResultDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectContactAddDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectContactOptionsDto;
import ca.bc.gov.nrs.hrs.repository.rept.ProjectCreationException;
import ca.bc.gov.nrs.hrs.service.rept.ReptContactService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rept/projects/{projectId}/contacts")
@Validated
public class ReptContactController {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptContactController.class);

  private final ObjectProvider<ReptContactService> serviceProvider;

  public ReptContactController(ObjectProvider<ReptContactService> serviceProvider) {
    this.serviceProvider = serviceProvider;
  }

  @GetMapping
  public ResponseEntity<ReptContactPageDto> listProjectContacts(
      @PathVariable("projectId") @Positive Long projectId) {
    ReptContactService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT contact service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      ReptContactPageDto page = service.findProjectContacts(projectId);
      return ResponseEntity.ok(page);
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT project contact lookup failed for project {}: {}",
          projectId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/options")
  public ResponseEntity<ReptProjectContactOptionsDto> getContactOptions(
      @PathVariable("projectId") @Positive Long projectId) {
    ReptContactService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT contact service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    ReptProjectContactOptionsDto options = service.loadProjectContactOptions();
    return ResponseEntity.ok(options);
  }

  @GetMapping("/search")
  public ResponseEntity<?> searchContacts(
      @PathVariable("projectId") @Positive Long projectId,
      @RequestParam(value = "firstName", required = false) String firstName,
      @RequestParam(value = "lastName", required = false) String lastName,
      @RequestParam(value = "companyName", required = false) String companyName) {
    ReptContactService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT contact service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    List<ReptContactSearchResultDto> results = service.searchContacts(firstName, lastName, companyName);
    
    // Wrap results in a response object matching frontend expectations
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("contacts", results);
    response.put("totalCount", results.size());
    response.put("page", 0);
    response.put("pageSize", 20);
    
    return ResponseEntity.ok(response);
  }

  @PostMapping
  public ResponseEntity<?> addProjectContact(
      @PathVariable("projectId") @Positive Long projectId,
      @Valid @RequestBody ReptProjectContactAddDto request) {
    ReptContactService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT contact service unavailable – unable to add contact");
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
      problem.setTitle("Service unavailable");
      problem.setDetail("Contact service is temporarily unavailable.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }

    try {
      ReptContactPageDto result = service.addProjectContact(projectId, request.contactId(), request.contactTypeCode());
      return ResponseEntity.status(HttpStatus.CREATED).body(result);
    } catch (ProjectCreationException ex) {
      LOGGER.warn("Add project contact failed: {}", ex.getMessage());
      return handleException(ex);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn("Invalid add contact request: {}", ex.getMessage());
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
      problem.setTitle("Invalid request");
      problem.setDetail(ex.getMessage());
      return ResponseEntity.badRequest().body(problem);
    } catch (Exception ex) {
      LOGGER.error("Unexpected error while adding project contact", ex);
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      problem.setTitle("Unable to add contact");
      problem.setDetail("An unexpected error occurred while adding the contact.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }
  }

  @DeleteMapping("/{associationId}")
  public ResponseEntity<?> removeProjectContact(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("associationId") @Positive Long associationId) {
    ReptContactService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT contact service unavailable – unable to remove contact");
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
      problem.setTitle("Service unavailable");
      problem.setDetail("Contact service is temporarily unavailable.");
      return ResponseEntity.status(problem.getStatus()).body(problem);
    }

    try {
      ReptContactPageDto result = service.removeProjectContact(projectId, associationId);
      return ResponseEntity.ok(result);
    } catch (ProjectCreationException ex) {
      LOGGER.warn("Remove project contact failed: {}", ex.getMessage());
      return handleException(ex);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn("Invalid remove contact request: {}", ex.getMessage());
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
      problem.setTitle("Invalid request");
      problem.setDetail(ex.getMessage());
      return ResponseEntity.badRequest().body(problem);
    } catch (Exception ex) {
      LOGGER.error("Unexpected error while removing project contact", ex);
      ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      problem.setTitle("Unable to remove contact");
      problem.setDetail("An unexpected error occurred while removing the contact.");
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
