package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyCreateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyDetailDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyExpropriationDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyExpropriationUpsertRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyMilestoneDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyMilestoneUpdateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyRegistrationDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyRegistrationUpsertRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertySummaryDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyUpdateRequestDto;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyExpropriationRepository.ExpropriationResult;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRegistrationRepository.RegistrationResult;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository.PropertyInsertResult;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository.PropertyUpdateResult;
import ca.bc.gov.nrs.rept.service.rept.ReptPropertyService;
import ca.bc.gov.nrs.rept.util.JwtPrincipalUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rept/projects/{projectId}/properties")
@Validated
public class ReptPropertyController {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptPropertyController.class);

  private final ObjectProvider<ReptPropertyService> serviceProvider;

  public ReptPropertyController(ObjectProvider<ReptPropertyService> serviceProvider) {
    this.serviceProvider = serviceProvider;
  }

  @GetMapping
  public ResponseEntity<List<ReptPropertySummaryDto>> listProperties(
      @PathVariable("projectId") @Positive Long projectId) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    List<ReptPropertySummaryDto> summaries = service.listProperties(projectId);
    return ResponseEntity.ok(summaries);
  }

  @GetMapping("/options")
  public ResponseEntity<ReptPropertyOptionsDto> getPropertyOptions(
      @PathVariable("projectId") @Positive Long projectId) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      ReptPropertyOptionsDto options = service.getPropertyOptions();
      return ResponseEntity.ok(options);
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT property options lookup failed for project {}: {}",
          projectId,
          ex.getMessage());
      return ResponseEntity.internalServerError().build();
    }
  }

  @PostMapping
  public ResponseEntity<PropertyInsertResult> createProperty(
      @PathVariable("projectId") @Positive Long projectId,
      @Valid @RequestBody ReptPropertyCreateRequestDto request,
      JwtAuthenticationToken principal) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    if (!projectId.equals(request.projectId())) {
      return ResponseEntity.badRequest().build();
    }

    try {
      String userId = extractUserId(principal);
      PropertyInsertResult result = service.createProperty(request, userId);
      return ResponseEntity.ok(result);
    } catch (Exception ex) {
      LOGGER.error(
          "REPT property create failed for project {}: {}",
          projectId,
          ex.getMessage(),
          ex);
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/{propertyId}")
  public ResponseEntity<ReptPropertyDetailDto> getProperty(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      Optional<ReptPropertyDetailDto> detail = service.findPropertyDetail(projectId, propertyId);
      return detail.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT property detail lookup failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @PutMapping("/{propertyId}")
  public ResponseEntity<PropertyUpdateResult> updateProperty(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId,
      @Valid @RequestBody ReptPropertyUpdateRequestDto request,
      JwtAuthenticationToken principal) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      String userId = extractUserId(principal);
      PropertyUpdateResult result = service.updatePropertyDetails(projectId, propertyId, request, userId);
      return ResponseEntity.ok(result);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn(
          "REPT property update validation failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.badRequest().build();
    } catch (Exception ex) {
      LOGGER.error(
          "REPT property update failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage(),
          ex);
      return ResponseEntity.internalServerError().build();
    }
  }

  @DeleteMapping("/{propertyId}")
  public ResponseEntity<Void> deleteProperty(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId,
      @RequestParam("revisionCount") @Positive Long revisionCount) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      service.deleteProperty(projectId, propertyId, revisionCount);
      return ResponseEntity.noContent().build();
    } catch (IllegalArgumentException ex) {
      LOGGER.warn(
          "REPT property delete validation failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.badRequest().build();
    } catch (Exception ex) {
      LOGGER.error(
          "REPT property delete failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage(),
          ex);
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/{propertyId}/milestones")
  public ResponseEntity<ReptPropertyMilestoneDto> getPropertyMilestones(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      Optional<ReptPropertyMilestoneDto> milestones =
          service.findPropertyMilestones(projectId, propertyId);
      return milestones.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT property milestone lookup failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @PutMapping("/{propertyId}/milestones")
  public ResponseEntity<PropertyUpdateResult> updatePropertyMilestones(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId,
      @Valid @RequestBody ReptPropertyMilestoneUpdateRequestDto request,
      JwtAuthenticationToken principal) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      String userId = extractUserId(principal);
      PropertyUpdateResult result = service.updatePropertyMilestones(projectId, propertyId, request, userId);
      return ResponseEntity.ok(result);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn(
          "REPT property milestones update validation failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.badRequest().build();
    } catch (Exception ex) {
      LOGGER.error(
          "REPT property milestones update failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage(),
          ex);
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/{propertyId}/registration")
  public ResponseEntity<ReptPropertyRegistrationDto> getPropertyRegistration(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      Optional<ReptPropertyRegistrationDto> registration =
          service.findPropertyRegistration(projectId, propertyId);
      return registration.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT property registration lookup failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @PutMapping("/{propertyId}/registration")
  public ResponseEntity<RegistrationResult> updatePropertyRegistration(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId,
      @Valid @RequestBody ReptPropertyRegistrationUpsertRequestDto request,
      JwtAuthenticationToken principal) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      String userId = extractUserId(principal);
      RegistrationResult result = service.updatePropertyRegistration(projectId, propertyId, request, userId);
      return ResponseEntity.ok(result);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn(
          "REPT property registration update validation failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.badRequest().build();
    } catch (Exception ex) {
      LOGGER.error(
          "REPT property registration update failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage(),
          ex);
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/{propertyId}/expropriation")
  public ResponseEntity<ReptPropertyExpropriationDto> getPropertyExpropriation(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      Optional<ReptPropertyExpropriationDto> expropriation =
          service.findPropertyExpropriation(projectId, propertyId);
      return expropriation
          .map(ResponseEntity::ok)
          .orElseGet(() -> ResponseEntity.notFound().build());
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT property expropriation lookup failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @PutMapping("/{propertyId}/expropriation")
  public ResponseEntity<ExpropriationResult> updatePropertyExpropriation(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("propertyId") @Positive Long propertyId,
      @Valid @RequestBody ReptPropertyExpropriationUpsertRequestDto request,
      JwtAuthenticationToken principal) {
    ReptPropertyService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT property service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      String userId = extractUserId(principal);
      ExpropriationResult result = service.updatePropertyExpropriation(projectId, propertyId, request, userId);
      return ResponseEntity.ok(result);
    } catch (IllegalArgumentException ex) {
      LOGGER.warn(
          "REPT property expropriation update validation failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage());
      return ResponseEntity.badRequest().build();
    } catch (Exception ex) {
      LOGGER.error(
          "REPT property expropriation update failed for project {} property {}: {}",
          projectId,
          propertyId,
          ex.getMessage(),
          ex);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Extracts the IDP username from the JWT authentication token.
   * Returns just the username (e.g., "JASGREWA") to fit within database column constraints.
   * Falls back to "SYSTEM" if no principal is available.
   */
  private String extractUserId(JwtAuthenticationToken principal) {
    if (principal == null) {
      return "SYSTEM";
    }
    String idpUsername = JwtPrincipalUtil.getIdpUsername(principal);
    return idpUsername.isBlank() ? "SYSTEM" : idpUsername;
  }
}
