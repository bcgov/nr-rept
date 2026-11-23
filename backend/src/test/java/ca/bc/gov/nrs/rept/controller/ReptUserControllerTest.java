package ca.bc.gov.nrs.rept.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ca.bc.gov.nrs.rept.dto.rept.ReptUserSummaryDto;
import ca.bc.gov.nrs.rept.service.rept.ReptUserDirectoryService;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test | ReptUserController")
class ReptUserControllerTest {

  @Mock
  private ReptUserDirectoryService userDirectoryService;

  @InjectMocks
  private ReptUserController controller;

  @Test
  void getUser_shouldReturnTheExactUser() {
    ReptUserSummaryDto user = new ReptUserSummaryDto(
        "JDOE", "Jane Doe", "Jane", "Doe", "jane.doe@example.com", "g1", null);
    when(userDirectoryService.findByUserId("JDOE")).thenReturn(Optional.of(user));

    ResponseEntity<ReptUserSummaryDto> response = controller.getUser("JDOE");

    assertThat(response.getStatusCode().value()).isEqualTo(200);
    assertThat(response.getBody()).isEqualTo(user);
    verify(userDirectoryService).findByUserId("JDOE");
  }

  @Test
  void getUser_shouldReturnNotFound_WhenUserCannotBeResolved() {
    when(userDirectoryService.findByUserId("NOBODY")).thenReturn(Optional.empty());

    ResponseEntity<ReptUserSummaryDto> response = controller.getUser("NOBODY");

    assertThat(response.getStatusCode().value()).isEqualTo(404);
  }
}
