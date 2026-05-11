package ca.bc.gov.nrs.hrs.service.rept.admin;

import ca.bc.gov.nrs.hrs.dto.rept.admin.ReptOrgUnitDto;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptOrgUnitRepository;
import ca.bc.gov.nrs.hrs.repository.rept.admin.ReptOrgUnitRepository.OrgUnitRecord;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("oracle")
public class ReptOrgUnitAdminService {

  private final ReptOrgUnitRepository repository;

  public ReptOrgUnitAdminService(ReptOrgUnitRepository repository) {
    this.repository = repository;
  }

  public List<ReptOrgUnitDto> search(String query) {
    return repository.searchByName(query).stream()
        .map(this::toDto)
        .toList();
  }

  public Optional<ReptOrgUnitDto> find(Long number) {
    if (number == null) {
      return Optional.empty();
    }
    return repository.findByNumber(number).map(this::toDto);
  }

  private ReptOrgUnitDto toDto(OrgUnitRecord record) {
    if (record == null) {
      return null;
    }
    return new ReptOrgUnitDto(record.number(), record.code(), record.name());
  }
}
