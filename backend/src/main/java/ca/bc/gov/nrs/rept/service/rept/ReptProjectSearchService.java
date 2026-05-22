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

  private static final Pattern PROJECT_NUMBER_ONLY_PATTERN = Pattern.compile("\\d{1,6}");

  private static final Pattern PROJECT_PREFIX_NUMBER_PATTERN =
      Pattern.compile("(?<prefix>\\d{3,5}-\\d{2})/(?<number>\\d{1,6})");

  private static final Pattern PROJECT_NUMBER_SUFFIX_PATTERN =
      Pattern.compile("(?<number>\\d{1,6})-(?<suffix>\\d{2})");

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

    String trimmed = projectFile.trim();

    String prefix = baseCriteria.projectFilePrefix();
    String number = null;
    String suffix = baseCriteria.projectFileSuffix();

    Matcher fullMatcher = PROJECT_FILE_PATTERN.matcher(trimmed);
    Matcher prefixNumberMatcher = PROJECT_PREFIX_NUMBER_PATTERN.matcher(trimmed);
    Matcher numberSuffixMatcher = PROJECT_NUMBER_SUFFIX_PATTERN.matcher(trimmed);
    if (fullMatcher.matches()) {
      prefix = fullMatcher.group("prefix");
      number = fullMatcher.group("number");
      suffix = fullMatcher.group("suffix");
    } else if (prefixNumberMatcher.matches()) {
      prefix = prefixNumberMatcher.group("prefix");
      number = prefixNumberMatcher.group("number");
    } else if (numberSuffixMatcher.matches()) {
      number = numberSuffixMatcher.group("number");
      suffix = numberSuffixMatcher.group("suffix");
    } else if (PROJECT_NUMBER_ONLY_PATTERN.matcher(trimmed).matches()) {
      number = trimmed;
    } else {
      return baseCriteria;
    }

    return ReptProjectSearchCriteria.builder()
        .projectFilePrefix(prefix)
        .projectNumber(number)
        .projectFileSuffix(suffix)
        .projectName(baseCriteria.projectName())
        .regionNumber(baseCriteria.regionNumber())
        .districtNumber(baseCriteria.districtNumber())
        .projectManagerUserId(baseCriteria.projectManagerUserId())
        .projectStatusCode(baseCriteria.projectStatusCode())
        .build();
  }

  private List<CodeNameDto> toCodeList(Map<String, String> map) {
    return map.entrySet().stream()
        .map(entry -> new CodeNameDto(entry.getKey(), entry.getValue()))
        .sorted(Comparator.comparing(CodeNameDto::name, Comparator.nullsLast(String::compareToIgnoreCase)))
        .collect(Collectors.toList());
  }
}
