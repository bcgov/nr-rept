package ca.bc.gov.nrs.hrs.service.rept;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;

import ca.bc.gov.nrs.hrs.dto.CodeNameDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectCreateOptionsDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectCreateRequestDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectCreateResultDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectDetailDto;
import ca.bc.gov.nrs.hrs.exception.UserNotFoundException;
import ca.bc.gov.nrs.hrs.repository.rept.ProjectCreationException;
import ca.bc.gov.nrs.hrs.repository.rept.ReptProjectRepository;
import ca.bc.gov.nrs.hrs.security.LoggedUserHelper;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test | ReptProjectService")
class ReptProjectServiceTest {

  @Mock
  private ReptProjectRepository repository;

  @Mock
  private LoggedUserHelper loggedUserHelper;

  @InjectMocks
  private ReptProjectService service;

  @Test
  void findProject_shouldReturnEmpty_WhenIdIsNull() {
    Optional<ReptProjectDetailDto> result = service.findProject(null);

    assertThat(result).isEmpty();
    verifyNoInteractions(repository);
  }

  @Test
  void findProject_shouldReturnEmpty_WhenIdIsLessThanOne() {
    Optional<ReptProjectDetailDto> result = service.findProject(0L);

    assertThat(result).isEmpty();
    verifyNoInteractions(repository);
  }

  @Test
  void findProject_shouldDelegateToRepository_WhenIdValid() {
    Long projectId = 42L;
    ReptProjectDetailDto dto = buildProject()
        .withId(projectId)
        .build();
    when(repository.findProjectById(projectId)).thenReturn(Optional.of(dto));

    Optional<ReptProjectDetailDto> result = service.findProject(projectId);

    assertThat(result).contains(dto);
    verify(repository).findProjectById(projectId);
  }

  @Test
  void loadCreateOptions_shouldConvertCodeLists() {
    when(repository.listProjectFilePrefixes()).thenReturn(Map.of("111-11", "Prefix"));
    when(repository.listProjectStatuses()).thenReturn(Map.of("PND", "Pending"));
    when(repository.listRegions()).thenReturn(Map.of("1", "Region"));
    when(repository.listDistricts()).thenReturn(Map.of("10", "District"));
    when(repository.listBctsOffices()).thenReturn(Map.of("20", "BCTS"));
    when(repository.listRequestingSources()).thenReturn(Map.of("30", "Email"));
    when(repository.listPriorityCodes()).thenReturn(Map.of("H", "High"));

    ReptProjectCreateOptionsDto options = service.loadCreateOptions();

    assertThat(options.filePrefixes())
        .extracting(CodeNameDto::code)
        .containsExactly("111-11");
    assertThat(options.statuses())
        .extracting(CodeNameDto::code)
        .containsExactly("PND");
    assertThat(options.regions())
        .extracting(CodeNameDto::code)
        .containsExactly("1");
    assertThat(options.districts())
        .extracting(CodeNameDto::code)
        .containsExactly("10");
    assertThat(options.bctsOffices())
        .extracting(CodeNameDto::code)
        .containsExactly("20");
    assertThat(options.requestingSources())
        .extracting(CodeNameDto::code)
        .containsExactly("30");
    assertThat(options.priorities())
        .extracting(CodeNameDto::code)
        .containsExactly("H");
  }

  @Test
  void createProject_shouldFallbackToLoggedUser_WhenRequestorBlank() {
    LocalDate requestDate = LocalDate.of(2024, 5, 1);
  ReptProjectCreateRequestDto request = new ReptProjectCreateRequestDto(
    "123-45",
    "01",
    "New Project",
    "1",
    "10",
    "20",
    "30",
    " ",
    "PND",
    requestDate,
    "  comment  ");

    when(loggedUserHelper.getLoggedUserId()).thenReturn("USR001");
    ReptProjectCreateResultDto result = new ReptProjectCreateResultDto(
        100L,
        1L,
        9999L,
        "123-45",
        "01",
        "New Project",
        "PND",
        "H",
        "30",
        "USR001",
        requestDate);
  when(repository.createProject(org.mockito.ArgumentMatchers.any(), eq("USR001")))
        .thenReturn(result);

    ReptProjectCreateResultDto response = service.createProject(request);

    assertThat(response).isSameAs(result);
    ArgumentCaptor<ReptProjectCreateRequestDto> captor = ArgumentCaptor.forClass(ReptProjectCreateRequestDto.class);
    verify(repository).createProject(captor.capture(), eq("USR001"));
    assertThat(captor.getValue().requestorUserId()).isEqualTo("USR001");
    assertThat(captor.getValue().projectComment()).isEqualTo("comment");
  }

  @Test
  void createProject_shouldFallbackToRequestor_WhenPrincipalMissing() {
    LocalDate requestDate = LocalDate.of(2024, 5, 1);
    ReptProjectCreateRequestDto request = new ReptProjectCreateRequestDto(
        "123-45",
        "01",
        "New Project",
        null,
        null,
        null,
        null,
        "IDIR\\JASGREWA",
        "PND",
        requestDate,
        null);

    when(loggedUserHelper.getLoggedUserId()).thenThrow(new UserNotFoundException());

    ReptProjectCreateResultDto result = mock(ReptProjectCreateResultDto.class);
    when(repository.createProject(org.mockito.ArgumentMatchers.any(), eq("IDIR\\JASGREWA")))
        .thenReturn(result);

    ReptProjectCreateResultDto response = service.createProject(request);

    assertThat(response).isSameAs(result);
    verify(repository).createProject(org.mockito.ArgumentMatchers.any(), eq("IDIR\\JASGREWA"));
  }

  @Test
  void createProject_shouldThrowWhenNoEntryUser() {
    ReptProjectCreateRequestDto request = new ReptProjectCreateRequestDto(
        "123-45",
        "01",
        "New Project",
        null,
        null,
        null,
        null,
        null,
        "PND",
        LocalDate.of(2024, 5, 1),
        null);

    when(loggedUserHelper.getLoggedUserId()).thenThrow(new UserNotFoundException());

    org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.createProject(request))
        .isInstanceOf(ProjectCreationException.class)
        .hasMessageContaining("Entry user ID");
    verifyNoInteractions(repository);
  }

  private TestProjectBuilder buildProject() {
    return new TestProjectBuilder();
  }

  private static class TestProjectBuilder {
    private Long id = 1L;
    private String filePrefix = "PFX";
    private Long projectNumber = 123L;
    private String fileSuffix = "SFX";
    private String projectName = "Sample";
    private String statusCode = "A";
    private String statusLabel = "Active";
    private String priorityCode = "1";
    private String priorityLabel = "High";
    private Long regionNumber = 4L;
    private String regionLabel = "Region";
    private Long districtNumber = 7L;
    private String districtLabel = "District";
    private Long bctsOfficeNumber = 9L;
    private String bctsOfficeLabel = "BCTS";
    private LocalDate requestDate = LocalDate.of(2024, 1, 1);
    private String requestingSourceId = "23";
    private String requestingSourceLabel = "Email";
    private String requestorUserId = "USR123";
    private String projectManagerUserId = "PM001";
    private String projectManagerName = "Jane Doe";
    private LocalDate projectManagerAssignedDate = LocalDate.of(2024, 2, 2);
    private String projectHistory = "History";
    private String relatedFiles = "Files";
    private String relatedRegistrations = "Registrations";
    private String projectComment = "Comment";
    private Long revisionCount = 1L;

    TestProjectBuilder withId(Long id) {
      this.id = id;
      return this;
    }

    ReptProjectDetailDto build() {
      return new ReptProjectDetailDto(
          id,
          filePrefix,
          projectNumber,
          fileSuffix,
          projectName,
          statusCode,
          statusLabel,
          priorityCode,
          priorityLabel,
          regionNumber,
          regionLabel,
          districtNumber,
          districtLabel,
          bctsOfficeNumber,
          bctsOfficeLabel,
          requestDate,
          requestingSourceId,
          requestingSourceLabel,
          requestorUserId,
          projectManagerUserId,
          projectManagerName,
          projectManagerAssignedDate,
          projectHistory,
          relatedFiles,
          relatedRegistrations,
          projectComment,
          revisionCount);
    }
  }
}
