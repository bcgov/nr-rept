package ca.bc.gov.nrs.rept.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import ca.bc.gov.nrs.rept.client.UserLookupClient.IdirUser;

import java.util.List;
import java.util.Optional;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/**
 * HTTP-contract tests for {@link UserLookupClient} against the
 * nr-user-lookup-api endpoints, using a {@link MockRestServiceServer}.
 */
class UserLookupClientTest {

  private MockRestServiceServer server;
  private UserLookupClient client;

  @BeforeEach
  void setUp() {
    RestClient.Builder builder = RestClient.builder().baseUrl("http://lookup.test");
    server = MockRestServiceServer.bindTo(builder).build();
    client = new UserLookupClient(builder.build());
  }

  @Test
  void searchIdirPostsQueryParamsAndMapsItems() {
    server.expect(requestTo(Matchers.startsWith(
                    "http://lookup.test/api/v1/user-lookup/idir-users/search")))
            .andExpect(method(HttpMethod.POST))
            .andExpect(queryParam("userId", "smith"))
            .andExpect(queryParam("firstName", "jane"))
            .andExpect(queryParam("pageSize", "25"))
            .andRespond(withSuccess(
                    "{\"totalItems\":1,\"pageSize\":25,\"items\":["
                            + "{\"userId\":\"JSMITH\",\"guid\":\"g1\",\"firstName\":\"Jane\","
                            + "\"lastName\":\"Smith\",\"email\":\"jane@gov.bc.ca\"}]}",
                    MediaType.APPLICATION_JSON));

    List<IdirUser> users = client.searchIdir("smith", "jane", null, 25);

    server.verify();
    assertThat(users).hasSize(1);
    assertThat(users.get(0).userId()).isEqualTo("JSMITH");
    assertThat(users.get(0).email()).isEqualTo("jane@gov.bc.ca");
  }

  @Test
  void searchIdirOmitsBlankCriteria() {
    server.expect(requestTo(
                    "http://lookup.test/api/v1/user-lookup/idir-users/search"
                            + "?lastName=smith&pageSize=10"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(
                    "{\"totalItems\":0,\"pageSize\":10,\"items\":[]}",
                    MediaType.APPLICATION_JSON));

    assertThat(client.searchIdir("  ", null, "smith", 10)).isEmpty();
    server.verify();
  }

  @Test
  void getIdirDetailFoundTrueMapsToUser() {
    server.expect(requestTo(Matchers.startsWith(
                    "http://lookup.test/api/v1/user-lookup/idir-account-detail")))
            .andExpect(method(HttpMethod.GET))
            .andExpect(queryParam("userId", "JSMITH"))
            .andRespond(withSuccess(
                    "{\"found\":true,\"userId\":\"JSMITH\",\"guid\":\"g1\","
                            + "\"firstName\":\"Jane\",\"lastName\":\"Smith\","
                            + "\"email\":\"jane@gov.bc.ca\"}",
                    MediaType.APPLICATION_JSON));

    Optional<IdirUser> user = client.getIdirDetail("JSMITH");

    server.verify();
    assertThat(user).isPresent();
    assertThat(user.get().email()).isEqualTo("jane@gov.bc.ca");
  }

  @Test
  void getIdirDetailFoundFalseIsEmpty() {
    server.expect(method(HttpMethod.GET))
            .andRespond(withSuccess("{\"found\":false}", MediaType.APPLICATION_JSON));

    assertThat(client.getIdirDetail("NOBODY")).isEmpty();
    server.verify();
  }

  @Test
  void getIdirDetailBlankUserIdSkipsTheCall() {
    assertThat(client.getIdirDetail("  ")).isEmpty();
    server.verify();
  }
}
