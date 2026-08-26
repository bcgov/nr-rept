package ca.bc.gov.nrs.rept.service.rept;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPaymentDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptAgreementPaymentRescindRequestDto;
import ca.bc.gov.nrs.rept.repository.rept.ReptAgreementRepository;
import ca.bc.gov.nrs.rept.repository.rept.ReptContactRepository;
import ca.bc.gov.nrs.rept.repository.rept.ReptPropertyRepository;
import ca.bc.gov.nrs.rept.security.LoggedUserHelper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.Nested;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Test | ReptAgreementService")
class ReptAgreementServiceTest {

  private static final Long PROJECT_ID = 10L;
  private static final Long AGREEMENT_ID = 20L;
  private static final Long PAYMENT_ID = 30L;

  @Mock
  private ReptAgreementRepository repository;

  @Mock
  private ReptPropertyRepository propertyRepository;

  @Mock
  private ReptContactRepository contactRepository;

  @Mock
  private LoggedUserHelper loggedUserHelper;

  @InjectMocks
  private ReptAgreementService service;

  private static ReptAgreementPaymentDto payment(Boolean rescinded, Long revisionCount) {
    return new ReptAgreementPaymentDto(
        PAYMENT_ID,
        AGREEMENT_ID,
        rescinded,
        LocalDate.of(2024, 5, 1),
        new BigDecimal("100.00"),
        new BigDecimal("5.00"),
        new BigDecimal("105.00"),
        "M",
        "Monthly",
        "P",
        "Purchase",
        "instructions",
        "client",
        "rc",
        "line",
        "stob",
        "project",
        1L,
        new BigDecimal("5"),
        2L,
        new BigDecimal("7"),
        BigDecimal.ZERO,
        "EA",
        "Expense Authority",
        "QR",
        "Qualified Receiver",
        revisionCount,
        List.of());
  }

  @Nested
  @DisplayName("setAgreementPaymentRescinded")
  class SetAgreementPaymentRescinded {

    @Test
    void shouldRescind_AndReturnRefreshedPayment() {
      ReptAgreementPaymentDto before = payment(Boolean.FALSE, 3L);
      ReptAgreementPaymentDto after = payment(Boolean.TRUE, 4L);
      when(repository.agreementBelongsToProject(PROJECT_ID, AGREEMENT_ID)).thenReturn(true);
      when(repository.findAgreementPayment(PROJECT_ID, AGREEMENT_ID, PAYMENT_ID))
          .thenReturn(Optional.of(before))
          .thenReturn(Optional.of(after));
      when(repository.setPaymentRescinded(PAYMENT_ID, true, 3L, "IDIR\\TESTER")).thenReturn(4L);
      when(loggedUserHelper.getLoggedUserId()).thenReturn("IDIR\\TESTER");

      ReptAgreementPaymentDto result =
          service.setAgreementPaymentRescinded(
              PROJECT_ID,
              AGREEMENT_ID,
              PAYMENT_ID,
              new ReptAgreementPaymentRescindRequestDto(Boolean.TRUE, 3L));

      assertThat(result).isEqualTo(after);
      verify(repository).setPaymentRescinded(PAYMENT_ID, true, 3L, "IDIR\\TESTER");
    }

    @Test
    void shouldFallBackToStoredRevisionCount_WhenRequestOmitsIt() {
      when(repository.agreementBelongsToProject(PROJECT_ID, AGREEMENT_ID)).thenReturn(true);
      when(repository.findAgreementPayment(PROJECT_ID, AGREEMENT_ID, PAYMENT_ID))
          .thenReturn(Optional.of(payment(Boolean.TRUE, 9L)))
          .thenReturn(Optional.of(payment(Boolean.FALSE, 10L)));
      when(repository.setPaymentRescinded(
              eq(PAYMENT_ID),
              eq(false),
              any(),
              any()))
          .thenReturn(10L);

      service.setAgreementPaymentRescinded(
          PROJECT_ID,
          AGREEMENT_ID,
          PAYMENT_ID,
          new ReptAgreementPaymentRescindRequestDto(Boolean.FALSE, null));

      ArgumentCaptor<Long> revision = ArgumentCaptor.forClass(Long.class);
      verify(repository)
          .setPaymentRescinded(
              eq(PAYMENT_ID),
              eq(false),
              revision.capture(),
              any());
      assertThat(revision.getValue()).isEqualTo(9L);
    }

    @Test
    void shouldBeNoOp_WhenPaymentAlreadyInTargetState() {
      ReptAgreementPaymentDto current = payment(Boolean.TRUE, 3L);
      when(repository.agreementBelongsToProject(PROJECT_ID, AGREEMENT_ID)).thenReturn(true);
      when(repository.findAgreementPayment(PROJECT_ID, AGREEMENT_ID, PAYMENT_ID))
          .thenReturn(Optional.of(current));

      ReptAgreementPaymentDto result =
          service.setAgreementPaymentRescinded(
              PROJECT_ID,
              AGREEMENT_ID,
              PAYMENT_ID,
              new ReptAgreementPaymentRescindRequestDto(Boolean.TRUE, 3L));

      assertThat(result).isEqualTo(current);
      verify(repository, never())
          .setPaymentRescinded(
              any(),
              anyBoolean(),
              any(),
              any());
    }

    @Test
    void shouldTreatNullRescindedAsNotRescinded() {
      when(repository.agreementBelongsToProject(PROJECT_ID, AGREEMENT_ID)).thenReturn(true);
      when(repository.findAgreementPayment(PROJECT_ID, AGREEMENT_ID, PAYMENT_ID))
          .thenReturn(Optional.of(payment(null, 1L)));

      ReptAgreementPaymentDto result =
          service.setAgreementPaymentRescinded(
              PROJECT_ID,
              AGREEMENT_ID,
              PAYMENT_ID,
              new ReptAgreementPaymentRescindRequestDto(Boolean.FALSE, 1L));

      assertThat(result.rescinded()).isNull();
      verify(repository, never())
          .setPaymentRescinded(
              any(),
              anyBoolean(),
              any(),
              any());
    }

    @Test
    void shouldThrowValidation_WhenRescindedFlagMissing() {
      assertThatThrownBy(
              () ->
                  service.setAgreementPaymentRescinded(
                      PROJECT_ID,
                      AGREEMENT_ID,
                      PAYMENT_ID,
                      new ReptAgreementPaymentRescindRequestDto(null, 1L)))
          .isInstanceOf(AgreementCommandException.class)
          .extracting(ex -> ((AgreementCommandException) ex).getReason())
          .isEqualTo(AgreementCommandException.Reason.VALIDATION);
    }

    @Test
    void shouldThrowNotFound_WhenAgreementNotInProject() {
      when(repository.agreementBelongsToProject(PROJECT_ID, AGREEMENT_ID)).thenReturn(false);

      assertThatThrownBy(
              () ->
                  service.setAgreementPaymentRescinded(
                      PROJECT_ID,
                      AGREEMENT_ID,
                      PAYMENT_ID,
                      new ReptAgreementPaymentRescindRequestDto(Boolean.TRUE, 1L)))
          .isInstanceOf(AgreementCommandException.class)
          .extracting(ex -> ((AgreementCommandException) ex).getReason())
          .isEqualTo(AgreementCommandException.Reason.NOT_FOUND);
    }

    @Test
    void shouldThrowNotFound_WhenPaymentMissing() {
      when(repository.agreementBelongsToProject(PROJECT_ID, AGREEMENT_ID)).thenReturn(true);
      when(repository.findAgreementPayment(PROJECT_ID, AGREEMENT_ID, PAYMENT_ID))
          .thenReturn(Optional.empty());

      assertThatThrownBy(
              () ->
                  service.setAgreementPaymentRescinded(
                      PROJECT_ID,
                      AGREEMENT_ID,
                      PAYMENT_ID,
                      new ReptAgreementPaymentRescindRequestDto(Boolean.TRUE, 1L)))
          .isInstanceOf(AgreementCommandException.class)
          .extracting(ex -> ((AgreementCommandException) ex).getReason())
          .isEqualTo(AgreementCommandException.Reason.NOT_FOUND);
    }

    @Test
    void shouldMapOptimisticLockFailureToConflict() {
      when(repository.agreementBelongsToProject(PROJECT_ID, AGREEMENT_ID)).thenReturn(true);
      when(repository.findAgreementPayment(PROJECT_ID, AGREEMENT_ID, PAYMENT_ID))
          .thenReturn(Optional.of(payment(Boolean.FALSE, 3L)));
      when(repository.setPaymentRescinded(
              any(),
              anyBoolean(),
              any(),
              any()))
          .thenThrow(new DataIntegrityViolationException("stale"));

      assertThatThrownBy(
              () ->
                  service.setAgreementPaymentRescinded(
                      PROJECT_ID,
                      AGREEMENT_ID,
                      PAYMENT_ID,
                      new ReptAgreementPaymentRescindRequestDto(Boolean.TRUE, 3L)))
          .isInstanceOf(AgreementCommandException.class)
          .extracting(ex -> ((AgreementCommandException) ex).getReason())
          .isEqualTo(AgreementCommandException.Reason.CONFLICT);
    }

    @Test
    void shouldFallBackToUnknownUser_WhenLoggedUserUnavailable() {
      when(repository.agreementBelongsToProject(PROJECT_ID, AGREEMENT_ID)).thenReturn(true);
      when(repository.findAgreementPayment(PROJECT_ID, AGREEMENT_ID, PAYMENT_ID))
          .thenReturn(Optional.of(payment(Boolean.FALSE, 3L)))
          .thenReturn(Optional.of(payment(Boolean.TRUE, 4L)));
      when(loggedUserHelper.getLoggedUserId()).thenThrow(new IllegalStateException("no principal"));
      when(repository.setPaymentRescinded(PAYMENT_ID, true, 3L, "UNKNOWN")).thenReturn(4L);

      service.setAgreementPaymentRescinded(
          PROJECT_ID,
          AGREEMENT_ID,
          PAYMENT_ID,
          new ReptAgreementPaymentRescindRequestDto(Boolean.TRUE, 3L));

      verify(repository).setPaymentRescinded(PAYMENT_ID, true, 3L, "UNKNOWN");
    }
  }

  @Test
  void constructorDependenciesAreWired() {
    assertThat(
            new ReptAgreementService(
                mock(ReptAgreementRepository.class),
                mock(ReptPropertyRepository.class),
                mock(ReptContactRepository.class),
                mock(LoggedUserHelper.class)))
        .isNotNull();
  }
}
