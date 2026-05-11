package ca.bc.gov.nrs.hrs.service.rept.admin;

import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptOrgUnitDto;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptRequestingSourceDto;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptRequestingSourceSearchCriteria;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptRequestingSourceUpsertRequestDto;
import ca.bc.gov.nrs.hrs.exception.UserNotFoundException;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptOrgUnitRepository;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptOrgUnitRepository.OrgUnitRecord;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptRequestingSourceRepository;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptRequestingSourceRepository.RequestingSourceRecord;
import ca.bc.gov.nrs.hrs.security.LoggedUserHelper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@Profile("oracle")
public class ReptRequestingSourceAdminService {

  private final ReptRequestingSourceRepository repository;
  private final ReptOrgUnitRepository orgUnitRepository;
  private final LoggedUserHelper loggedUserHelper;

  public ReptRequestingSourceAdminService(
      ReptRequestingSourceRepository repository,
      ReptOrgUnitRepository orgUnitRepository,
      LoggedUserHelper loggedUserHelper) {
    this.repository = repository;
    this.orgUnitRepository = orgUnitRepository;
    this.loggedUserHelper = loggedUserHelper;
  }

  public List<ReptRequestingSourceDto> search(ReptRequestingSourceSearchCriteria criteria) {
    String name = criteria == null ? null : trim(criteria.name());
    Boolean external = criteria == null ? null : criteria.external();
    Map<Long, ReptOrgUnitDto> cache = new HashMap<>();
    return repository.search(name, external).stream()
        .map(record -> toDto(record, cache))
        .toList();
  }

  public Optional<ReptRequestingSourceDto> find(Long id) {
    if (id == null || id < 1) {
      return Optional.empty();
    }
    Map<Long, ReptOrgUnitDto> cache = new HashMap<>();
    return repository.findById(id).map(record -> toDto(record, cache));
  }

  public ReptRequestingSourceDto create(ReptRequestingSourceUpsertRequestDto request) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }
    boolean external = request.external() != null ? request.external() : false;
    
    // Business rule: External sources have a name but no org unit
    //                Internal sources have an org unit but no name (name comes from org unit)
    String name;
    Long orgUnitNumber;
    
    if (external) {
      name = requireName(request.name());
      orgUnitNumber = null; // External sources cannot have an org unit
    } else {
      name = null; // Internal sources get their name from the org unit
      orgUnitNumber = requireOrgUnit(request.orgUnitNumber());
    }
    
    String userId = requireCurrentUserId();

    RequestingSourceRecord created = repository.insert(name, external, orgUnitNumber, userId);
    return reload(created);
  }

  public ReptRequestingSourceDto update(Long id, ReptRequestingSourceUpsertRequestDto request) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }
    Long revision = requireRevision(request.revisionCount());
    boolean external = request.external() != null ? request.external() : false;
    
    // Business rule: External sources have a name but no org unit
    //                Internal sources have an org unit but no name (name comes from org unit)
    String name;
    Long orgUnitNumber;
    
    if (external) {
      name = requireName(request.name());
      orgUnitNumber = null; // External sources cannot have an org unit
    } else {
      name = null; // Internal sources get their name from the org unit
      orgUnitNumber = requireOrgUnit(request.orgUnitNumber());
    }
    
    String userId = requireCurrentUserId();

    RequestingSourceRecord updated = repository.update(id, revision, name, external, orgUnitNumber, userId);
    return reload(updated);
  }

  public void delete(Long id, Long revisionCount) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    Long revision = requireRevision(revisionCount);
    repository.delete(id, revision);
  }

  private ReptRequestingSourceDto reload(RequestingSourceRecord fallback) {
    if (fallback == null || fallback.id() == null) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Requesting source operation did not return an id");
    }
    Map<Long, ReptOrgUnitDto> cache = new HashMap<>();
    return repository.findById(fallback.id())
        .map(record -> toDto(record, cache))
        .orElseGet(() -> toDto(fallback, cache));
  }

  private ReptRequestingSourceDto toDto(
      RequestingSourceRecord record, Map<Long, ReptOrgUnitDto> orgUnitCache) {
    ReptOrgUnitDto orgUnit = resolveOrgUnit(record.orgUnitNumber(), orgUnitCache);
    return new ReptRequestingSourceDto(record.id(), record.name(), record.external(), orgUnit, record.revisionCount());
  }

  private ReptOrgUnitDto resolveOrgUnit(Long number, Map<Long, ReptOrgUnitDto> cache) {
    if (number == null) {
      return null;
    }
    return cache.computeIfAbsent(
        number,
        key ->
            orgUnitRepository
                .findByNumber(key)
                .map(this::toOrgUnitDto)
                .orElseGet(() -> new ReptOrgUnitDto(key, null, null)));
  }

  private ReptOrgUnitDto toOrgUnitDto(OrgUnitRecord record) {
    return new ReptOrgUnitDto(record.number(), record.code(), record.name());
  }

  private Long requireOrgUnit(Long orgUnitNumber) {
    if (orgUnitNumber == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organizational unit is required for internal sources");
    }
    return orgUnitRepository
        .findByNumber(orgUnitNumber)
        .map(OrgUnitRecord::number)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown org unit"));
  }

  private String requireName(String name) {
    String trimmed = trim(name);
    if (trimmed == null || trimmed.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
    }
    return trimmed;
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

  private String trim(String value) {
    return value == null ? null : value.trim();
  }
}
