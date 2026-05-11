package ca.bc.gov.nrs.hrs.service.rept.admin;

import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptExpenseAuthorityDto;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptExpenseAuthoritySearchCriteria;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptExpenseAuthorityUpsertRequestDto;
import ca.bc.gov.nrs.hrs.exception.UserNotFoundException;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptExpenseAuthorityRepository;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptExpenseAuthorityRepository.ExpenseAuthorityRecord;
import ca.bc.gov.nrs.hrs.security.LoggedUserHelper;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@Profile("oracle")
public class ReptExpenseAuthorityAdminService {

  private final ReptExpenseAuthorityRepository repository;
  private final LoggedUserHelper loggedUserHelper;

  public ReptExpenseAuthorityAdminService(
      ReptExpenseAuthorityRepository repository, LoggedUserHelper loggedUserHelper) {
    this.repository = repository;
    this.loggedUserHelper = loggedUserHelper;
  }

  public List<ReptExpenseAuthorityDto> search(ReptExpenseAuthoritySearchCriteria criteria) {
    String name = criteria == null ? null : trim(criteria.name());
    Boolean active = criteria == null ? null : criteria.active();
    return repository.search(name, active).stream().map(this::toDto).toList();
  }

  public Optional<ReptExpenseAuthorityDto> find(Long id) {
    if (id == null || id < 1) {
      return Optional.empty();
    }
    return repository.findById(id).map(this::toDto);
  }

  public ReptExpenseAuthorityDto create(ReptExpenseAuthorityUpsertRequestDto request) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }
    String name = requireName(request.name());
    boolean active = request.active() == null ? true : request.active();
    String userId = requireCurrentUserId();

    ExpenseAuthorityRecord created = repository.insert(name, active, userId);
    return reload(created);
  }

  public ReptExpenseAuthorityDto update(Long id, ReptExpenseAuthorityUpsertRequestDto request) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }
    String name = requireName(request.name());
    boolean active = request.active() == null ? true : request.active();
    String userId = requireCurrentUserId();

    ExpenseAuthorityRecord updated = repository.update(id, active, name, userId);
    return reload(updated);
  }

  public void delete(Long id) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    repository.delete(id);
  }

  private ReptExpenseAuthorityDto reload(ExpenseAuthorityRecord fallback) {
    if (fallback == null || fallback.id() == null) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Expense authority operation did not return an id");
    }
    return repository.findById(fallback.id()).map(this::toDto).orElseGet(() -> toDto(fallback));
  }

  private ReptExpenseAuthorityDto toDto(ExpenseAuthorityRecord record) {
    return new ReptExpenseAuthorityDto(record.id(), record.name(), record.active());
  }

  private String requireName(String name) {
    String trimmed = trim(name);
    if (trimmed == null || trimmed.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
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

  private String trim(String value) {
    return value == null ? null : value.trim();
  }
}
