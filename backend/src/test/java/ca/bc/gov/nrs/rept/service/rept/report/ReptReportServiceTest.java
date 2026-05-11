package ca.bc.gov.nrs.rept.service.rept.report;

import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportFormat;
import ca.bc.gov.nrs.rept.dto.rept.report.ReptReportRequestDto;
import ca.bc.gov.nrs.rept.security.LoggedUserHelper;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.headerDoesNotExist;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ReptReportServiceTest {

  private static final String BASE_URL = "https://example.com";

  private MockRestServiceServer mockServer;
  private ReptReportService service;
  private ReptReportParameterProvider parameterProvider;
  private LoggedUserHelper loggedUserHelper;

  @BeforeEach
  void setUp() {
    RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
    mockServer = MockRestServiceServer.bindTo(builder).build();
    RestClient restClient = builder.build();

    parameterProvider = mock(ReptReportParameterProvider.class);
    loggedUserHelper = mock(LoggedUserHelper.class);
    when(loggedUserHelper.getLoggedUserId()).thenReturn("user123");

    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("param", "value");
    when(parameterProvider.buildParameters(
        ArgumentMatchers.any(),
        ArgumentMatchers.any(),
        ArgumentMatchers.anyString()
    )).thenReturn(params);
    service = new ReptReportService(restClient, parameterProvider, loggedUserHelper);
  }

  @Test
  void generateReportRetrievesContentDispositionFilename() {
    byte[] responseBody = "test".getBytes();

  mockServer.expect(requestTo(BASE_URL + "/" + ReptReportDefinition.REPORT_2100.getJasperPath() + ".rpt.pdf?param=value"))
        .andExpect(method(HttpMethod.GET))
        .andExpect(queryParam("param", "value"))
        .andRespond(withSuccess(responseBody, MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Custom.pdf"));

    ReptReportRequestDto requestDto = new ReptReportRequestDto(
        LocalDate.now(),
        LocalDate.now(),
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        ReptReportFormat.PDF,
        null
    );

    ReptReportResult result = service.generateReport("2100", requestDto);

    mockServer.verify();

    assertThat(result.content()).isEqualTo(responseBody);
    assertThat(result.mediaType()).isEqualTo(MediaType.APPLICATION_PDF);
    assertThat(result.filename()).isEqualTo("Custom.pdf");
  }

  @Test
  void generateReportFallsBackToDefaultFilenameWhenMissingDisposition() {
    byte[] responseBody = "ok".getBytes();

  mockServer.expect(requestTo(BASE_URL + "/" + ReptReportDefinition.REPORT_2100.getJasperPath() + ".rpt.pdf?param=value"))
        .andExpect(method(HttpMethod.GET))
        .andExpect(queryParam("param", "value"))
        .andExpect(headerDoesNotExist("Request_Cookie"))
        .andRespond(withSuccess(responseBody, MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Upcoming_Payments_Report.pdf"));

    ReptReportResult result = service.generateReport("2100", new ReptReportRequestDto(
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
        null
    ));

    mockServer.verify();

    assertThat(result.content()).isEqualTo(responseBody);
    assertThat(result.filename()).isEqualTo("Upcoming_Payments_Report.pdf");
  }
}
