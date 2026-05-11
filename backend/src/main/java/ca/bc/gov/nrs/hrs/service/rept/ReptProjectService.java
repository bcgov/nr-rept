package ca.bc.gov.nrs.hrs.service.rept;

import ca.bc.gov.nrs.hrs.dto.CodeNameDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectCreateOptionsDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectCreateRequestDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectCreateResultDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectDetailDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectUpdateOptionsDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectUpdateRequestDto;
import ca.bc.gov.nrs.hrs.exception.UserNotFoundException;
import ca.bc.gov.nrs.hrs.repository.rept.ProjectCreationException;
import ca.bc.gov.nrs.hrs.repository.rept.ReptProjectRepository;
import ca.bc.gov.nrs.hrs.security.LoggedUserHelper;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("oracle")
public class ReptProjectService {

  private final ReptProjectRepository repository;
  private final LoggedUserHelper loggedUserHelper;

  public ReptProjectService(
      ReptProjectRepository repository,
      LoggedUserHelper loggedUserHelper) {
    this.repository = repository;
    this.loggedUserHelper = loggedUserHelper;
  }

  public Optional<ReptProjectDetailDto> findProject(Long projectId) {
    if (projectId == null || projectId < 1) {
      return Optional.empty();
    }
    return repository.findProjectById(projectId);
  }

  public ReptProjectCreateOptionsDto loadCreateOptions() {
    return new ReptProjectCreateOptionsDto(
        toCodeList(repository.listProjectFilePrefixes()),
        toCodeList(repository.listProjectStatuses()),
        toCodeList(repository.listRegions()),
        toCodeList(repository.listDistricts()),
        toCodeList(repository.listBctsOffices()),
        toCodeList(repository.listRequestingSources()),
        toCodeList(repository.listPriorityCodes()));
  }

  public ReptProjectCreateResultDto createProject(ReptProjectCreateRequestDto request)
      throws ProjectCreationException {
    if (request == null) {
      throw new IllegalArgumentException("request is required");
    }

    String currentUserId = resolveCurrentUserId();
    String requestorUserId = firstNonBlank(request.requestorUserId(), currentUserId);

    ReptProjectCreateRequestDto normalizedRequest = new ReptProjectCreateRequestDto(
        request.filePrefix(),
        request.fileSuffix(),
        request.projectName(),
        request.regionNumber(),
        request.districtNumber(),
        request.bctsOfficeNumber(),
        request.requestingSourceId(),
        requestorUserId,
        request.statusCode(),
        request.requestDate(),
        request.projectComment());

    String entryUserId = firstNonBlank(currentUserId, requestorUserId);
    if (entryUserId == null || entryUserId.isBlank()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.CHECK_CONSTRAINT,
          "Entry user ID is required to create a project file.");
    }

    return repository.createProject(normalizedRequest, entryUserId);
  }

  public List<CodeNameDto> listProjectFileSuffixes(String prefix) {
    String normalized = prefix == null ? null : prefix.trim();
    if (normalized == null || normalized.isEmpty()) {
      return List.of();
    }
    return toCodeList(repository.listProjectFileSuffixes(normalized));
  }

  public ReptProjectUpdateOptionsDto loadUpdateOptions() {
    return new ReptProjectUpdateOptionsDto(
        toCodeList(repository.listProjectStatuses()),
        toCodeList(repository.listPriorityCodes()),
        toCodeList(repository.listRegions()),
        toCodeList(repository.listDistricts()),
        toCodeList(repository.listBctsOffices()),
      toCodeList(repository.listRequestingSources()),
      toCodeList(repository.listProjectManagers()));
  }

  public ReptProjectDetailDto updateProject(Long projectId, ReptProjectUpdateRequestDto request)
      throws ProjectCreationException {
    if (projectId == null || projectId < 1) {
      throw new IllegalArgumentException("projectId is required");
    }
    if (request == null) {
      throw new IllegalArgumentException("request is required");
    }

    String currentUserId = resolveCurrentUserId();
    if (currentUserId == null || currentUserId.isBlank()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.CHECK_CONSTRAINT,
          "Entry user ID is required to update a project file.");
    }

    repository.updateProject(projectId, request, currentUserId);
    return repository.findProjectById(projectId).orElseThrow(() ->
        new ProjectCreationException(
            ProjectCreationException.Reason.DATA_NOT_CURRENT,
            "Project not found after update."));
  }

  private String resolveCurrentUserId() {
    try {
      return loggedUserHelper.getLoggedUserId();
    } catch (UserNotFoundException ex) {
      return "";
    }
  }

  private String firstNonBlank(String... values) {
    if (values == null) {
      return null;
    }
    for (String value : values) {
      if (value != null) {
        String trimmed = value.trim();
        if (!trimmed.isEmpty()) {
          return trimmed;
        }
      }
    }
    return null;
  }

  private List<CodeNameDto> toCodeList(Map<String, String> source) {
    return source.entrySet().stream()
        .map(entry -> new CodeNameDto(entry.getKey(), entry.getValue()))
        .sorted(Comparator.comparing(CodeNameDto::name, Comparator.nullsLast(String::compareToIgnoreCase)))
        .collect(Collectors.toList());
  }
}
