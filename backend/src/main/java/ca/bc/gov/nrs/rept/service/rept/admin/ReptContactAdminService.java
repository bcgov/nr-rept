package ca.bc.gov.nrs.rept.service.rept.admin;

import ca.bc.gov.nrs.rept.dto.rept.admin.ReptContactAdminDto;
import ca.bc.gov.nrs.rept.dto.rept.admin.ReptContactSearchCriteria;
import ca.bc.gov.nrs.rept.dto.rept.admin.ReptContactUpsertRequestDto;
import ca.bc.gov.nrs.rept.exception.UserNotFoundException;
import ca.bc.gov.nrs.rept.repository.rept.admin.ReptContactAdminRepository;
import ca.bc.gov.nrs.rept.repository.rept.admin.ReptContactAdminRepository.ContactPayload;
import ca.bc.gov.nrs.rept.repository.rept.admin.ReptContactAdminRepository.ContactRecord;
import ca.bc.gov.nrs.rept.security.LoggedUserHelper;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@Profile("oracle")
public class ReptContactAdminService {

  private final ReptContactAdminRepository repository;
  private final LoggedUserHelper loggedUserHelper;

  public ReptContactAdminService(
      ReptContactAdminRepository repository, LoggedUserHelper loggedUserHelper) {
    this.repository = repository;
    this.loggedUserHelper = loggedUserHelper;
  }

  public List<ReptContactAdminDto> search(ReptContactSearchCriteria criteria) {
    String firstName = criteria == null ? null : trim(criteria.firstName());
    String lastName = criteria == null ? null : trim(criteria.lastName());
    String companyName = criteria == null ? null : trim(criteria.companyName());
    return repository.search(firstName, lastName, companyName).stream()
        .map(this::toDto)
        .toList();
  }

  public Optional<ReptContactAdminDto> find(Long id) {
    if (id == null || id < 1) {
      return Optional.empty();
    }
    return repository.findById(id).map(this::toDto);
  }

  public ReptContactAdminDto create(ReptContactUpsertRequestDto request) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }
    validateNameRequired(request);
    ContactPayload payload = toPayload(request);
    String userId = requireCurrentUserId();
    ContactRecord created = repository.insert(payload, userId);
    return reload(created);
  }

  public ReptContactAdminDto update(Long id, ReptContactUpsertRequestDto request) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }
    validateNameRequired(request);
    Long revision = requireRevision(request.revisionCount());
    ContactPayload payload = toPayload(request);
    String userId = requireCurrentUserId();
    ContactRecord updated = repository.update(id, revision, payload, userId);
    return reload(updated);
  }

  public void delete(Long id, Long revisionCount) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    Long revision = requireRevision(revisionCount);
    repository.delete(id, revision);
  }

  private ReptContactAdminDto reload(ContactRecord fallback) {
    if (fallback == null || fallback.id() == null) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Contact operation did not return an id");
    }
    return repository.findById(fallback.id())
        .map(this::toDto)
        .orElseGet(() -> toDto(fallback));
  }

  private ReptContactAdminDto toDto(ContactRecord record) {
    return new ReptContactAdminDto(
        record.id(),
        record.revisionCount(),
        record.displayName(),
        record.firstName(),
        record.lastName(),
        record.companyName(),
        record.address(),
        record.city(),
        record.provinceState(),
        record.country(),
        record.postalZipCode(),
        record.email(),
        record.phone(),
        record.fax());
  }

  private ContactPayload toPayload(ReptContactUpsertRequestDto request) {
    return new ContactPayload(
        trim(request.firstName()),
        trim(request.lastName()),
        trim(request.companyName()),
        trim(request.address()),
        trim(request.city()),
        trim(request.provinceState()),
        trim(request.country()),
        trim(request.postalZipCode()),
        trim(request.email()),
        trim(request.phone()),
        trim(request.fax()));
  }

  private Long requireRevision(Long revision) {
    if (revision == null || revision < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "revisionCount is required");
    }
    return revision;
  }

  private String requireCurrentUserId() {
    try {
      String userId = loggedUserHelper.getLoggedUserId();
      if (userId == null || userId.isBlank()) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User id is required");
      }
      return userId.trim();
    } catch (UserNotFoundException ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User id is required", ex);
    }
  }

  private void validateNameRequired(ReptContactUpsertRequestDto request) {
    boolean hasFirstName = request.firstName() != null && !request.firstName().trim().isEmpty();
    boolean hasLastName = request.lastName() != null && !request.lastName().trim().isEmpty();
    boolean hasCompanyName = request.companyName() != null && !request.companyName().trim().isEmpty();

    if (!hasFirstName && !hasLastName && !hasCompanyName) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "At least one of firstName, lastName, or companyName is required");
    }
  }

  private String trim(String value) {
    return value == null ? null : value.trim();
  }
}
