package ca.bc.gov.nrs.hrs.dto.rept.report;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.ValueInstantiationException;
import org.junit.jupiter.api.Test;

class ReptReportFormatTest {

  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  void shouldDeserializeLowercaseValues() throws Exception {
    ReptReportFormat format = mapper.readValue("\"pdf\"", ReptReportFormat.class);
    assertEquals(ReptReportFormat.PDF, format);
  }

  @Test
  void shouldDefaultToPdfWhenBlank() throws Exception {
    ReptReportFormat format = mapper.readValue("\"\"", ReptReportFormat.class);
    assertEquals(ReptReportFormat.PDF, format);
  }

  @Test
  void shouldRejectUnknownValues() {
    assertThrows(
        ValueInstantiationException.class,
        () -> mapper.readValue("\"xls\"", ReptReportFormat.class)
    );
  }
}
