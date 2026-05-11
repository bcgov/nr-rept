package ca.bc.gov.nrs.rept.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import ca.bc.gov.nrs.rept.dto.rept.ReptProjectDetailDto;
import ca.bc.gov.nrs.rept.service.rept.ReptProjectService;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test | ReptProjectController")
class ReptProjectControllerTest {

  @Mock
  private ObjectProvider<ReptProjectService> projectServiceProvider;

  @Mock
  private ReptProjectService service;

  @InjectMocks
  private ReptProjectController controller;

  @Test
  void detail_shouldReturnNoContent_WhenServiceMissing() {
    when(projectServiceProvider.getIfAvailable()).thenReturn(null);

    ResponseEntity<ReptProjectDetailDto> response = controller.detail(123L);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    verify(projectServiceProvider).getIfAvailable();
    verifyNoInteractions(service);
  }

  @Test
  void detail_shouldReturnNotFound_WhenServiceReturnsEmpty() {
    when(projectServiceProvider.getIfAvailable()).thenReturn(service);
    when(service.findProject(456L)).thenReturn(Optional.empty());

    ResponseEntity<ReptProjectDetailDto> response = controller.detail(456L);

    assertThat(response.getStatusCode().value()).isEqualTo(404);
    verify(service).findProject(456L);
  }

  @Test
  void detail_shouldReturnProject_WhenServiceReturnsEntity() {
    when(projectServiceProvider.getIfAvailable()).thenReturn(service);
    ReptProjectDetailDto dto = buildProject(456L);
    when(service.findProject(456L)).thenReturn(Optional.of(dto));

    ResponseEntity<ReptProjectDetailDto> response = controller.detail(456L);

    assertThat(response.getStatusCode().value()).isEqualTo(200);
    assertThat(response.getBody()).isEqualTo(dto);
    verify(service).findProject(456L);
  }

  @Test
  void detail_shouldReturnNotFound_WhenServiceThrows() {
    when(projectServiceProvider.getIfAvailable()).thenReturn(service);
    when(service.findProject(789L)).thenThrow(new RuntimeException("boom"));

    ResponseEntity<ReptProjectDetailDto> response = controller.detail(789L);

    assertThat(response.getStatusCode().value()).isEqualTo(404);
    verify(service).findProject(789L);
  }

  private ReptProjectDetailDto buildProject(Long id) {
    return new ReptProjectDetailDto(
        id,
        "PFX",
        12L,
        "SFX",
        "Sample",
        "A",
        "Active",
        "1",
        "High",
        4L,
        "Region",
        7L,
        "District",
        9L,
        "BCTS",
        LocalDate.of(2024, 1, 1),
        "23",
        "Email",
        "USR123",
        "PM001",
        "Jane Doe",
        LocalDate.of(2024, 2, 2),
        "History",
        "Files",
        "Registrations",
        "Comment",
        1L);
  }
}
