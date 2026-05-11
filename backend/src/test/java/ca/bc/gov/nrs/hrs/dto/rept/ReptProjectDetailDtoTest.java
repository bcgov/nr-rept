package ca.bc.gov.nrs.hrs.dto.rept;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Unit Test | ReptProjectDetailDto")
class ReptProjectDetailDtoTest {

  @Test
  void projectFile_shouldConcatenateSegments() {
    ReptProjectDetailDto dto = new ReptProjectDetailDto(
        99L,
        " ABC ",
        123L,
        " 01 ",
        " Project",
        "A",
        " Active ",
        "1",
        " High ",
        4L,
        " Region ",
        7L,
        " District ",
        9L,
        " BCTS ",
        LocalDate.of(2024, 1, 1),
        "23",
        " Email ",
        "USR123",
        "PM001",
        " Jane Doe ",
        LocalDate.of(2024, 2, 2),
        "History",
        "Files",
        "Registrations",
        "Comment",
        1L);

    assertThat(dto.projectFile()).isEqualTo("ABC/123-01");
    assertThat(dto.filePrefix()).isEqualTo("ABC");
    assertThat(dto.fileSuffix()).isEqualTo("01");
    assertThat(dto.projectName()).isEqualTo("Project");
    assertThat(dto.statusLabel()).isEqualTo("Active");
    assertThat(dto.priorityLabel()).isEqualTo("High");
    assertThat(dto.regionLabel()).isEqualTo("Region");
    assertThat(dto.districtLabel()).isEqualTo("District");
    assertThat(dto.bctsOfficeLabel()).isEqualTo("BCTS");
    assertThat(dto.requestingSourceLabel()).isEqualTo("Email");
    assertThat(dto.projectManagerName()).isEqualTo("Jane Doe");
  }

  @Test
  void projectFile_shouldReturnNull_WhenAllSegmentsMissing() {
    ReptProjectDetailDto dto = new ReptProjectDetailDto(
        100L,
        null,
        null,
        null,
        "Project",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null);

    assertThat(dto.projectFile()).isNull();
  }
}
