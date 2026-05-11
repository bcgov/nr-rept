package ca.bc.gov.nrs.hrs.service.rept.admin;

import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptCoUserDto;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptCoUserSearchCriteria;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptCoUserUpsertRequestDto;
import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptOrgUnitDto;
import ca.bc.gov.nrs.hrs.exception.UserNotFoundException;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptCoUserRepository;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptCoUserRepository.CoUserRecord;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptOrgUnitRepository;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptOrgUnitRepository.OrgUnitRecord;
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
public class ReptCoUserAdminService {

  private final ReptCoUserRepository repository;
  private final ReptOrgUnitRepository orgUnitRepository;
  private final LoggedUserHelper loggedUserHelper;

  public ReptCoUserAdminService(
      ReptCoUserRepository repository,
      ReptOrgUnitRepository orgUnitRepository,
      LoggedUserHelper loggedUserHelper) {
    this.repository = repository;
    this.orgUnitRepository = orgUnitRepository;
    this.loggedUserHelper = loggedUserHelper;
  }

  public List<ReptCoUserDto> search(ReptCoUserSearchCriteria criteria) {
    String name = criteria == null ? null : trim(criteria.name());
    Boolean external = criteria == null ? null : criteria.external();
    Map<Long, ReptOrgUnitDto> cache = new HashMap<>();
    return repository.search(name, external).stream()
        .map(record -> toDto(record, cache))
        .toList();
  }

  public Optional<ReptCoUserDto> find(Long id) {
    if (id == null || id < 1) {
      return Optional.empty();
    }
    Map<Long, ReptOrgUnitDto> cache = new HashMap<>();
    return repository.findById(id).map(record -> toDto(record, cache));
  }

  public ReptCoUserDto create(ReptCoUserUpsertRequestDto request) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }
    boolean external = request.external() != null ? request.external() : false;
    
    // Business rule: External co-users have a name but no org unit
    //                Internal co-users have an org unit but no name (name comes from org unit)
    String name;
    Long orgUnitNumber;
    
    if (external) {
      name = requireName(request.name());
      orgUnitNumber = null; // External co-users cannot have an org unit
    } else {
      name = null; // Internal co-users get their name from the org unit
      orgUnitNumber = requireOrgUnit(request.orgUnitNumber());
    }
    
    String userId = requireCurrentUserId();

    CoUserRecord created = repository.insert(name, external, orgUnitNumber, userId);
    return reload(created);
  }

  public ReptCoUserDto update(Long id, ReptCoUserUpsertRequestDto request) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
    }
    Long revision = requireRevision(request.revisionCount());
    boolean external = request.external() != null ? request.external() : false;
    
    // Business rule: External co-users have a name but no org unit
    //                Internal co-users have an org unit but no name (name comes from org unit)
    String name;
    Long orgUnitNumber;
    
    if (external) {
      name = requireName(request.name());
      orgUnitNumber = null; // External co-users cannot have an org unit
    } else {
      name = null; // Internal co-users get their name from the org unit
      orgUnitNumber = requireOrgUnit(request.orgUnitNumber());
    }
    
    String userId = requireCurrentUserId();

    CoUserRecord updated = repository.update(id, revision, name, external, orgUnitNumber, userId);
    return reload(updated);
  }

  public void delete(Long id, Long revisionCount) {
    if (id == null || id < 1) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid id is required");
    }
    Long revision = requireRevision(revisionCount);
    repository.delete(id, revision);
  }

  private ReptCoUserDto reload(CoUserRecord fallback) {
    if (fallback == null || fallback.id() == null) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Co-user operation did not return an id");
    }
    Map<Long, ReptOrgUnitDto> cache = new HashMap<>();
    return repository.findById(fallback.id())
        .map(record -> toDto(record, cache))
        .orElseGet(() -> toDto(fallback, cache));
  }

  private ReptCoUserDto toDto(CoUserRecord record, Map<Long, ReptOrgUnitDto> orgUnitCache) {
    ReptOrgUnitDto orgUnit = resolveOrgUnit(record.orgUnitNumber(), orgUnitCache);
    return new ReptCoUserDto(record.id(), record.name(), record.external(), orgUnit, record.revisionCount());
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
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organizational unit is required for internal co-users");
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
