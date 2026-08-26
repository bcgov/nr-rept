package ca.bc.gov.nrs.rept.service.rept;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ca.bc.gov.nrs.rept.client.UserLookupClient;
import ca.bc.gov.nrs.rept.client.UserLookupClient.IdirUser;
import ca.bc.gov.nrs.rept.dto.rept.ReptUserSearchResponseDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptUserSummaryDto;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link ReptUserDirectoryService}. The HTTP contract with
 * nr-user-lookup-api is covered by {@code UserLookupClientTest}; here the
 * client is mocked so the tests focus on validation, mapping and paging.
 */
class ReptUserDirectoryServiceTest {

  private UserLookupClient client;
  private ReptUserDirectoryService service;

  @BeforeEach
  void setUp() {
    client = mock(UserLookupClient.class);
    service = new ReptUserDirectoryService(client, 50);
  }

  @Test
  void searchUsersThrowsWhenCriteriaIsNull() {
    assertThatThrownBy(() -> service.searchUsers(null))
            .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void searchUsersThrowsWhenNoCriteriaProvided() {
    ReptUserSearchCriteria blank = new ReptUserSearchCriteria(null, " ", null, 0, 0);
    assertThatThrownBy(() -> service.searchUsers(blank))
            .isInstanceOf(IllegalArgumentException.class);
    verify(client, never()).searchIdir(any(), any(), any(), anyInt());
  }

  @Test
  void searchUsersRequiresAtLeastOneField() {
    ReptUserSearchCriteria empty = new ReptUserSearchCriteria("", "", "", 0, 50);
    assertThatThrownBy(() -> service.searchUsers(empty))
            .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void searchUsersMapsAndSortsResults() {
    when(client.searchIdir("smith", null, null, 50)).thenReturn(List.of(
            new IdirUser("BSMITH", "g2", "Bob", "Smith", "bob@gov.bc.ca"),
            new IdirUser("ASMITH", "g1", "Ann", "Smith", "ann@gov.bc.ca")));

    ReptUserSearchResponseDto response =
            service.searchUsers(new ReptUserSearchCriteria("smith", null, null, 0, 50));

    assertThat(response.total()).isEqualTo(2);
    assertThat(response.page()).isZero();
    assertThat(response.size()).isEqualTo(50);
    // Sorted by display name, so "Ann Smith" precedes "Bob Smith".
    assertThat(response.results()).extracting(ReptUserSummaryDto::userId)
            .containsExactly("ASMITH", "BSMITH");

    ReptUserSummaryDto first = response.results().get(0);
    assertThat(first.displayName()).isEqualTo("Ann Smith");
    assertThat(first.email()).isEqualTo("ann@gov.bc.ca");
    assertThat(first.idirGuid()).isEqualTo("g1");
    assertThat(first.idirUserGuid()).isNull();
  }

  @Test
  void searchUsersFallsBackToTheDefaultPageSize() {
    when(client.searchIdir(eq("smith"), any(), any(), eq(50))).thenReturn(List.of());

    ReptUserSearchResponseDto response =
            service.searchUsers(new ReptUserSearchCriteria("smith", null, null, 0, 0));

    verify(client).searchIdir("smith", null, null, 50);
    assertThat(response.size()).isEqualTo(50);
    assertThat(response.results()).isEmpty();
  }

  @Test
  void searchUsersTrimsResultsToTheRequestedSize() {
    when(client.searchIdir(eq(null), eq("jane"), eq(null), eq(1))).thenReturn(List.of(
            new IdirUser("AJANE", "g1", "Jane", "Alpha", null),
            new IdirUser("BJANE", "g2", "Jane", "Beta", null)));

    ReptUserSearchResponseDto response =
            service.searchUsers(new ReptUserSearchCriteria(null, "jane", null, 0, 1));

    assertThat(response.results()).hasSize(1);
    // `total` reports everything the directory matched, not the trimmed page.
    assertThat(response.total()).isEqualTo(2);
  }

  @Test
  void searchUsersDropsEntriesWithoutAUserId() {
    when(client.searchIdir(any(), any(), any(), anyInt())).thenReturn(List.of(
            new IdirUser("  ", "g0", "No", "Id", null),
            new IdirUser("JSMITH", "g1", "Jane", "Smith", null)));

    ReptUserSearchResponseDto response =
            service.searchUsers(new ReptUserSearchCriteria("smith", null, null, 0, 50));

    assertThat(response.results()).extracting(ReptUserSummaryDto::userId)
            .containsExactly("JSMITH");
  }

  @Test
  void findByUserIdStripsTheIdirPrefix() {
    when(client.getIdirDetail("AGOERTZE")).thenReturn(
            Optional.of(new IdirUser("AGOERTZE", "g1", "Ann", "Goertze", "ann@gov.bc.ca")));

    Optional<ReptUserSummaryDto> user = service.findByUserId("IDIR\\AGOERTZE");

    assertThat(user).isPresent();
    assertThat(user.get().displayName()).isEqualTo("Ann Goertze");
  }

  @Test
  void findByUserIdIsEmptyOnUpstreamFailure() {
    when(client.getIdirDetail("AGOERTZE")).thenThrow(new IllegalStateException("boom"));

    assertThat(service.findByUserId("AGOERTZE")).isEmpty();
  }

  @Test
  void findByUserIdIsEmptyForBlankInput() {
    assertThat(service.findByUserId("  ")).isEmpty();
    verify(client, never()).getIdirDetail(any());
  }
}
