package ca.bc.gov.nrs.rept.service.rept;

import ca.bc.gov.nrs.rept.dto.CodeNameDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAcquisitionRequestCreateDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAcquisitionRequestDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAcquisitionRequestOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAcquisitionRequestUpdateDto;
import ca.bc.gov.nrs.rept.exception.UserNotFoundException;
import ca.bc.gov.nrs.rept.repository.rept.ProjectCreationException;
import ca.bc.gov.nrs.rept.repository.rept.ReptAcquisitionRequestRepository;
import ca.bc.gov.nrs.rept.security.LoggedUserHelper;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("oracle")
public class ReptAcquisitionRequestService {

  private final ReptAcquisitionRequestRepository repository;
  private final LoggedUserHelper loggedUserHelper;

  public ReptAcquisitionRequestService(
      ReptAcquisitionRequestRepository repository,
      LoggedUserHelper loggedUserHelper) {
    this.repository = repository;
    this.loggedUserHelper = loggedUserHelper;
  }

  public Optional<ReptAcquisitionRequestDto> findByProject(Long projectId) {
    if (projectId == null || projectId < 1) {
      return Optional.empty();
    }
    return repository.findByProjectId(projectId);
  }

  public ReptAcquisitionRequestOptionsDto loadOptions() {
    return new ReptAcquisitionRequestOptionsDto(
        toCodeList(repository.listAcquisitionTypes()),
        toCodeList(repository.listFsrTypes()),
        toCodeList(repository.listRoadUseTypes()),
        toCodeList(repository.listFundingCodes()));
  }

  public ReptAcquisitionRequestDto createAcquisitionRequest(Long projectId, ReptAcquisitionRequestCreateDto request)
      throws ProjectCreationException {
    if (projectId == null || projectId < 1) {
      throw new IllegalArgumentException("projectId is required");
    }
    if (request == null) {
      throw new IllegalArgumentException("request is required");
    }

    // Check if an acquisition request already exists
    Optional<ReptAcquisitionRequestDto> existing = repository.findByProjectId(projectId);
    if (existing.isPresent()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.DUPLICATE,
          "An acquisition request already exists for this project.");
    }

    String currentUserId = resolveCurrentUserId();
    if (currentUserId == null || currentUserId.isBlank()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.CHECK_CONSTRAINT,
          "Entry user ID is required to create an acquisition request.");
    }

    repository.createAcquisitionRequest(projectId, request, currentUserId);
    return repository.findByProjectId(projectId).orElseThrow(() ->
        new ProjectCreationException(
            ProjectCreationException.Reason.DATABASE_ERROR,
            "Acquisition request not found after creation."));
  }

  public ReptAcquisitionRequestDto updateAcquisitionRequest(Long projectId, ReptAcquisitionRequestUpdateDto request)
      throws ProjectCreationException {
    if (projectId == null || projectId < 1) {
      throw new IllegalArgumentException("projectId is required");
    }
    if (request == null) {
      throw new IllegalArgumentException("request is required");
    }

    Optional<ReptAcquisitionRequestDto> existing = repository.findByProjectId(projectId);
    if (existing.isEmpty()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.DATA_NOT_CURRENT,
          "Acquisition request not found for this project.");
    }

    String currentUserId = resolveCurrentUserId();
    if (currentUserId == null || currentUserId.isBlank()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.CHECK_CONSTRAINT,
          "Entry user ID is required to update an acquisition request.");
    }

    repository.updateAcquisitionRequest(existing.get().id(), request, currentUserId);
    return repository.findByProjectId(projectId).orElseThrow(() ->
        new ProjectCreationException(
            ProjectCreationException.Reason.DATA_NOT_CURRENT,
            "Acquisition request not found after update."));
  }

  private String resolveCurrentUserId() {
    try {
      return loggedUserHelper.getLoggedUserId();
    } catch (UserNotFoundException ex) {
      return "";
    }
  }

  private List<CodeNameDto> toCodeList(Map<String, String> source) {
    return source.entrySet().stream()
        .map(entry -> new CodeNameDto(entry.getKey(), entry.getValue()))
        .sorted(Comparator.comparing(CodeNameDto::name, Comparator.nullsLast(String::compareToIgnoreCase)))
        .collect(Collectors.toList());
  }
}
