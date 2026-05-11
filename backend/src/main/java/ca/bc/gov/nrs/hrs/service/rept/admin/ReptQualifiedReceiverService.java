package ca.bc.gov.nrs.hrs.service.rept.admin;

import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptQualifiedReceiverDto;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptQualifiedReceiverSearchCriteria;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptQualifiedReceiverUpsertRequestDto;
import ca.bc.gov.nrs.hrs.repository.rept.ReptQualifiedReceiverRepository;
import ca.bc.gov.nrs.hrs.repository.rept.ReptQualifiedReceiverRepository.QualifiedReceiverRecord;
import ca.bc.gov.nrs.hrs.security.LoggedUserHelper;
import ca.bc.gov.nrs.hrs.exception.UserNotFoundException;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@Profile("oracle")
public class ReptQualifiedReceiverService {

  private final ReptQualifiedReceiverRepository repository;
  private final LoggedUserHelper loggedUserHelper;

  public ReptQualifiedReceiverService(
      ReptQualifiedReceiverRepository repository,
      LoggedUserHelper loggedUserHelper) {
    this.repository = repository;
    this.loggedUserHelper = loggedUserHelper;
  }

  public List<ReptQualifiedReceiverDto> search(ReptQualifiedReceiverSearchCriteria criteria) {
    String name = criteria == null ? null : criteria.name();
    Boolean active = criteria == null ? null : criteria.active();

    return repository.search(name, active).stream()
        .map(this::toDto)
        .toList();
  }

  public Optional<ReptQualifiedReceiverDto> find(Long id) {
    if (id == null || id < 1) {
      return Optional.empty();
    }
    return repository.findById(id).map(this::toDto);
  }

  public ReptQualifiedReceiverDto create(ReptQualifiedReceiverUpsertRequestDto request) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }

    String name = requireName(request.sourceName());
    boolean active = request.active() == null ? true : request.active();
    String userId = requireCurrentUserId();

    QualifiedReceiverRecord created = repository.insert(name, active, userId);
    return reload(created);
  }

  public ReptQualifiedReceiverDto update(Long id, ReptQualifiedReceiverUpsertRequestDto request) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }

    String name = requireName(request.sourceName());
    boolean active = request.active() == null ? true : request.active();
    String userId = requireCurrentUserId();

    QualifiedReceiverRecord updated = repository.update(id, active, name, userId);
    return reload(updated);
  }

  public void delete(Long id) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    repository.delete(id);
  }

  private ReptQualifiedReceiverDto reload(QualifiedReceiverRecord fallback) {
    if (fallback == null || fallback.id() == null) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Qualified receiver operation failed to return an identifier");
    }
    return repository.findById(fallback.id())
        .map(this::toDto)
        .orElseGet(() -> toDto(fallback));
  }

  private String requireName(String name) {
    String trimmed = name == null ? null : name.trim();
    if (trimmed == null || trimmed.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourceName is required");
    }
    return trimmed;
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

  private ReptQualifiedReceiverDto toDto(QualifiedReceiverRecord record) {
    return new ReptQualifiedReceiverDto(record.id(), record.name(), record.active());
  }
}
