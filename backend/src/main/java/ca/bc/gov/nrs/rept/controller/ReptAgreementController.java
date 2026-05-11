package ca.bc.gov.nrs.rept.controller;

import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementCreateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPaymentCreateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPaymentDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPaymentOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPropertyDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPropertyUpdateRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementUpdateRequestDto;
import ca.bc.gov.nrs.rept.service.rept.ReptAgreementService;
import ca.bc.gov.nrs.rept.service.rept.AgreementCommandException;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rept/projects/{projectId}/agreements")
@Validated
public class ReptAgreementController {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptAgreementController.class);

  private final ObjectProvider<ReptAgreementService> serviceProvider;

  public ReptAgreementController(ObjectProvider<ReptAgreementService> serviceProvider) {
    this.serviceProvider = serviceProvider;
  }

  @GetMapping("/options")
  public ResponseEntity<ReptAgreementOptionsDto> getAgreementOptions(
      @PathVariable("projectId") @Positive Long projectId) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    ReptAgreementOptionsDto options = service.getCreateOptions();
    return ResponseEntity.ok(options);
  }

  @PostMapping
  public ResponseEntity<?> createAgreement(
      @PathVariable("projectId") @Positive Long projectId,
      @Valid @RequestBody ReptAgreementCreateRequestDto request) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – unable to create agreement");
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    try {
      ReptAgreementDto created = service.createAgreement(projectId, request);
      return ResponseEntity.status(HttpStatus.CREATED).body(created);
    } catch (AgreementCommandException ex) {
      return handleAgreementCommandException(ex);
    }
  }

  @GetMapping
  public ResponseEntity<List<ReptAgreementDto>> listAgreements(
      @PathVariable("projectId") @Positive Long projectId) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    List<ReptAgreementDto> agreements = service.listAgreements(projectId);
    return ResponseEntity.ok(agreements);
  }

  @GetMapping("/{agreementId}")
  public ResponseEntity<ReptAgreementDto> getAgreement(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("agreementId") @Positive Long agreementId) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      Optional<ReptAgreementDto> agreement = service.findAgreement(projectId, agreementId);
      return agreement.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT agreement lookup failed for project {} agreement {}: {}",
          projectId,
          agreementId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/{agreementId}/properties")
  public ResponseEntity<List<ReptAgreementPropertyDto>> listAgreementProperties(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("agreementId") @Positive Long agreementId) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      List<ReptAgreementPropertyDto> properties =
          service.listAgreementProperties(projectId, agreementId);
      return ResponseEntity.ok(properties);
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT agreement properties lookup failed for project {} agreement {}: {}",
          projectId,
          agreementId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @PutMapping("/{agreementId}/properties")
  public ResponseEntity<?> replaceAgreementProperties(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("agreementId") @Positive Long agreementId,
      @Valid @RequestBody ReptAgreementPropertyUpdateRequestDto request) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – unable to update agreement properties");
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    try {
      List<ReptAgreementPropertyDto> properties =
          service.updateAgreementProperties(projectId, agreementId, request);
      return ResponseEntity.ok(properties);
    } catch (AgreementCommandException ex) {
      return handleAgreementCommandException(ex);
    }
  }

  @GetMapping("/{agreementId}/payments")
  public ResponseEntity<List<ReptAgreementPaymentDto>> listAgreementPayments(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("agreementId") @Positive Long agreementId) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      List<ReptAgreementPaymentDto> payments =
          service.listAgreementPayments(projectId, agreementId);
      return ResponseEntity.ok(payments);
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT agreement payments lookup failed for project {} agreement {}: {}",
          projectId,
          agreementId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @PostMapping("/{agreementId}/payments")
  public ResponseEntity<?> createAgreementPayment(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("agreementId") @Positive Long agreementId,
      @Valid @RequestBody ReptAgreementPaymentCreateRequestDto request) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – unable to create payment");
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    try {
      ReptAgreementPaymentDto created =
          service.createAgreementPayment(projectId, agreementId, request);
      return ResponseEntity.status(HttpStatus.CREATED).body(created);
    } catch (AgreementCommandException ex) {
      return handleAgreementCommandException(ex);
    }
  }

  @GetMapping("/{agreementId}/payments/options")
  public ResponseEntity<ReptAgreementPaymentOptionsDto> getAgreementPaymentOptions(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("agreementId") @Positive Long agreementId) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – returning no content");
      return ResponseEntity.noContent().build();
    }

    try {
      Optional<ReptAgreementPaymentOptionsDto> options =
          service.loadAgreementPaymentOptions(projectId, agreementId);
      return options.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    } catch (Exception ex) {
      LOGGER.warn(
          "REPT agreement payment options lookup failed for project {} agreement {}: {}",
          projectId,
          agreementId,
          ex.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  @PutMapping("/{agreementId}")
  public ResponseEntity<?> updateAgreement(
      @PathVariable("projectId") @Positive Long projectId,
      @PathVariable("agreementId") @Positive Long agreementId,
      @Valid @RequestBody ReptAgreementUpdateRequestDto request) {
    ReptAgreementService service = serviceProvider.getIfAvailable();
    if (service == null) {
      LOGGER.warn("REPT agreement service unavailable – unable to update agreement");
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    try {
      ReptAgreementDto updated = service.updateAgreement(projectId, agreementId, request);
      return ResponseEntity.ok(updated);
    } catch (AgreementCommandException ex) {
      return handleAgreementCommandException(ex);
    }
  }

  private ResponseEntity<ProblemDetail> handleAgreementCommandException(AgreementCommandException ex) {
    HttpStatus status = switch (ex.getReason()) {
      case NOT_FOUND -> HttpStatus.NOT_FOUND;
      case VALIDATION -> HttpStatus.BAD_REQUEST;
      case CONFLICT -> HttpStatus.CONFLICT;
      case DATABASE_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
    };

    ProblemDetail problem = ProblemDetail.forStatus(status);
    problem.setTitle(ex.getMessage());
    if (!ex.getValidationErrors().isEmpty()) {
      problem.setProperty("errors", ex.getValidationErrors());
    }
    return ResponseEntity.status(status).body(problem);
  }
}
