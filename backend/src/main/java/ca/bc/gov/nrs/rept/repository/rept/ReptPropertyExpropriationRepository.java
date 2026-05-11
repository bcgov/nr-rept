package ca.bc.gov.nrs.rept.repository.rept;

import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyExpropriationDto;
import java.sql.CallableStatement;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.Types;
import java.time.LocalDate;
import java.util.Optional;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Profile("oracle")
public class ReptPropertyExpropriationRepository extends AbstractReptRepository {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ReptPropertyExpropriationRepository.class);

  private static final String PROC_EXPROPRIATION_GET = "ACQUISITION_EXPROPRIATION_GET";
  private static final String PROC_EXPROPRIATION_INS = "ACQUISITION_EXPROPRIATION_INS";
  private static final String PROC_EXPROPRIATION_UPD = "ACQUISITION_EXPROPRIATION_UPD";
  private static final String PROC_EXPROPRIATION_DEL = "ACQUISITION_EXPROPRIATION_DEL";

  public ReptPropertyExpropriationRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public Optional<ReptPropertyExpropriationDto> findByPropertyId(Long propertyId) {
    if (propertyId == null) {
      return Optional.empty();
    }

    final String qualifiedCall = qualifyProjectProcedure(PROC_EXPROPRIATION_GET);

    try {
      return jdbcTemplate.execute(
          qualifiedCall,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, propertyId);
            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return Optional.<ReptPropertyExpropriationDto>empty();
            }

            try (rs) {
              if (!rs.next()) {
                return Optional.<ReptPropertyExpropriationDto>empty();
              }
              return Optional.of(mapDto(rs));
            }
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_EXPROPRIATION_GET,
          projectPackage,
          e.getMessage(),
          e);
      return Optional.empty();
    }
  }

  /**
   * Creates or updates expropriation data for a property.
   * Uses insert if the expropriation doesn't exist, otherwise updates.
   */
  @Transactional
  public ExpropriationResult upsert(Long propertyId, ExpropriationParams params, String userId) {
    Optional<ReptPropertyExpropriationDto> existing = findByPropertyId(propertyId);
    if (existing.isPresent()) {
      return update(propertyId, params, userId);
    } else {
      return insert(propertyId, params, userId);
    }
  }

  /**
   * Creates expropriation data for a property.
   */
  @Transactional
  public ExpropriationResult insert(Long propertyId, ExpropriationParams params, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_EXPROPRIATION_INS, 7);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<ExpropriationResult>) cs -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setLong(1, propertyId);
            cs.setNull(2, Types.NUMERIC); // Revision - will be set
            setDateOrNull(cs, 3, params.executiveApprovalDate());
            setDateOrNull(cs, 4, params.consensualServiceDate());
            setDateOrNull(cs, 5, params.noticeAdvancePaymentDate());
            setDateOrNull(cs, 6, params.vestingDate());
            setStringOrNull(cs, 7, userId);
            cs.execute();
            Long id = cs.getObject(1, Long.class);
            Long revision = cs.getObject(2, Long.class);
            return new ExpropriationResult(id, revision);
          });
    } catch (DataAccessException e) {
      LOGGER.error(
          "{} failed for package {}: {}",
          PROC_EXPROPRIATION_INS,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  /**
   * Updates expropriation data for a property.
   */
  @Transactional
  public ExpropriationResult update(Long propertyId, ExpropriationParams params, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_EXPROPRIATION_UPD, 7);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<ExpropriationResult>) cs -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setLong(1, propertyId);
            setLongOrNull(cs, 2, params.revisionCount());
            setDateOrNull(cs, 3, params.executiveApprovalDate());
            setDateOrNull(cs, 4, params.consensualServiceDate());
            setDateOrNull(cs, 5, params.noticeAdvancePaymentDate());
            setDateOrNull(cs, 6, params.vestingDate());
            setStringOrNull(cs, 7, userId);
            cs.execute();
            Long id = cs.getObject(1, Long.class);
            Long revision = cs.getObject(2, Long.class);
            return new ExpropriationResult(id, revision);
          });
    } catch (DataAccessException e) {
      LOGGER.error(
          "{} failed for package {}: {}",
          PROC_EXPROPRIATION_UPD,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  /**
   * Deletes expropriation data for a property.
   */
  @Transactional
  public void delete(Long propertyId, Long revisionCount) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_EXPROPRIATION_DEL, 2);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Void>) cs -> {
            setLongOrNull(cs, 1, propertyId);
            setLongOrNull(cs, 2, revisionCount);
            cs.execute();
            return null;
          });
    } catch (DataAccessException e) {
      LOGGER.error(
          "{} failed for package {}: {}",
          PROC_EXPROPRIATION_DEL,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  private ReptPropertyExpropriationDto mapDto(ResultSet rs) throws java.sql.SQLException {
    Long propertyId = rs.getObject("PROJECT_PROPERTY_ID", Long.class);
    Date approvalDate = rs.getDate("EXECUTIVE_APPROVAL_DATE");
    Date consensualDate = rs.getDate("CONSENSUAL_EXPR_SERVICE_DATE");
    Date noticeDate = rs.getDate("NOTICE_ADV_PYMT_SERVICE_DATE");
    Date vestingDate = rs.getDate("VESTING_DATE");
    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);

    return new ReptPropertyExpropriationDto(
        propertyId,
        toLocalDate(approvalDate),
        toLocalDate(consensualDate),
        toLocalDate(noticeDate),
        toLocalDate(vestingDate),
        revisionCount);
  }

  /** Input parameters for expropriation operations. */
  public record ExpropriationParams(
      Long revisionCount,
      LocalDate executiveApprovalDate,
      LocalDate consensualServiceDate,
      LocalDate noticeAdvancePaymentDate,
      LocalDate vestingDate) {}

  /** Result of expropriation insert/update operation. */
  public record ExpropriationResult(Long propertyId, Long revisionCount) {}
}
