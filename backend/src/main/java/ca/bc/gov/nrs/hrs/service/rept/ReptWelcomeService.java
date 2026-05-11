package ca.bc.gov.nrs.hrs.service.rept;

import ca.bc.gov.nrs.hrs.dto.rept.ReptRecentProjectDto;
import ca.bc.gov.nrs.hrs.repository.rept.ReptWelcomeRepository;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("oracle")
public class ReptWelcomeService {

  private static final int MAX_LIMIT = 50;
  private static final int MIN_LIMIT = 1;

  private final ReptWelcomeRepository repository;

  public ReptWelcomeService(ReptWelcomeRepository repository) {
    this.repository = repository;
  }

  public List<ReptRecentProjectDto> findRecentProjects(int limit) {
    int sanitized = Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, limit));
    return repository.findRecentProjects(sanitized);
  }
}
