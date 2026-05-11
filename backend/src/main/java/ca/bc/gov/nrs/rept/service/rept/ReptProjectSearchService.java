package ca.bc.gov.nrs.rept.service.rept;

import ca.bc.gov.nrs.rept.dto.CodeNameDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectSearchOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptProjectSearchResultDto;
import ca.bc.gov.nrs.rept.repository.rept.ReptProjectRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("oracle")
public class ReptProjectSearchService {

  private static final Pattern PROJECT_FILE_PATTERN =
      Pattern.compile("(?<prefix>\\d{3,5}-\\d{2})/(?<number>\\d{1,6})-(?<suffix>\\d{2})");

  private final ReptProjectRepository projectRepository;

  public ReptProjectSearchService(ReptProjectRepository projectRepository) {
    this.projectRepository = projectRepository;
  }

  public List<ReptProjectSearchResultDto> search(ReptProjectSearchCriteria criteria) {
    return projectRepository.searchProjects(criteria);
  }

  public ReptProjectSearchOptionsDto loadOptions() {
    List<CodeNameDto> regions = toCodeList(projectRepository.listRegions());
    List<CodeNameDto> districts = toCodeList(projectRepository.listDistricts());
    List<CodeNameDto> statuses = toCodeList(projectRepository.listProjectStatuses());
    List<CodeNameDto> managers = toCodeList(projectRepository.listProjectManagers());
    List<CodeNameDto> prefixes = toCodeList(projectRepository.listProjectFilePrefixes());

    return new ReptProjectSearchOptionsDto(regions, districts, statuses, managers, prefixes);
  }

  public List<CodeNameDto> loadFileSuffixes(String prefix) {
    if (prefix == null || prefix.isBlank()) {
      return List.of();
    }
    Map<String, String> suffixes = projectRepository.listProjectFileSuffixes(prefix.trim());
    return toCodeList(suffixes);
  }

  public ReptProjectSearchCriteria mergeWithProjectFile(
      ReptProjectSearchCriteria baseCriteria, String projectFile) {
    if (projectFile == null || projectFile.isBlank()) {
      return baseCriteria;
    }

    Matcher matcher = PROJECT_FILE_PATTERN.matcher(projectFile.trim());
    if (!matcher.matches()) {
      return baseCriteria;
    }

    ReptProjectSearchCriteria.Builder builder = ReptProjectSearchCriteria.builder()
        .projectFilePrefix(matcher.group("prefix"))
        .projectNumber(matcher.group("number"))
        .projectFileSuffix(matcher.group("suffix"))
        .projectName(baseCriteria.projectName())
        .regionNumber(baseCriteria.regionNumber())
        .districtNumber(baseCriteria.districtNumber())
        .projectManagerUserId(baseCriteria.projectManagerUserId())
        .projectStatusCode(baseCriteria.projectStatusCode());

    return builder.build();
  }

  private List<CodeNameDto> toCodeList(Map<String, String> map) {
    return map.entrySet().stream()
        .map(entry -> new CodeNameDto(entry.getKey(), entry.getValue()))
        .sorted(Comparator.comparing(CodeNameDto::name, Comparator.nullsLast(String::compareToIgnoreCase)))
        .collect(Collectors.toList());
  }
}
