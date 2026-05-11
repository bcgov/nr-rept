package ca.bc.gov.nrs.rept.repository.rept;

import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyRegistrationDto;
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
public class ReptPropertyRegistrationRepository extends AbstractReptRepository {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ReptPropertyRegistrationRepository.class);

  private static final String PROC_REGISTRATION_GET = "ACQUISITION_REGISTRATION_GET";
  private static final String PROC_REGISTRATION_INS = "ACQUISITION_REGISTRATION_INS";
  private static final String PROC_REGISTRATION_UPD = "ACQUISITION_REGISTRATION_UPD";
  private static final String PROC_REGISTRATION_DEL = "ACQUISITION_REGISTRATION_DEL";

  public ReptPropertyRegistrationRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public Optional<ReptPropertyRegistrationDto> findByPropertyId(Long propertyId) {
    if (propertyId == null) {
      return Optional.empty();
    }

    final String qualifiedCall = qualifyProjectProcedure(PROC_REGISTRATION_GET);

    try {
      return jdbcTemplate.execute(
          qualifiedCall,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, propertyId);
            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return Optional.<ReptPropertyRegistrationDto>empty();
            }

            try (rs) {
              if (!rs.next()) {
                return Optional.<ReptPropertyRegistrationDto>empty();
              }
              return Optional.of(mapDto(rs));
            }
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_REGISTRATION_GET,
          projectPackage,
          e.getMessage(),
          e);
      return Optional.empty();
    }
  }

  /**
   * Creates or updates registration data for a property.
   * Uses insert if the registration doesn't exist, otherwise updates.
   */
  @Transactional
  public RegistrationResult upsert(Long propertyId, RegistrationParams params, String userId) {
    Optional<ReptPropertyRegistrationDto> existing = findByPropertyId(propertyId);
    if (existing.isPresent()) {
      return update(propertyId, params, userId);
    } else {
      return insert(propertyId, params, userId);
    }
  }

  /**
   * Creates registration data for a property.
   */
  @Transactional
  public RegistrationResult insert(Long propertyId, RegistrationParams params, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_REGISTRATION_INS, 7);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<RegistrationResult>) cs -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setLong(1, propertyId);
            cs.setNull(2, Types.NUMERIC); // Revision - will be set
            setStringOrNull(cs, 3, params.ltoPlanNumber());
            setStringOrNull(cs, 4, params.ltoDocumentNumber());
            setStringOrNull(cs, 5, params.surveyTubeNumber());
            setDateOrNull(cs, 6, params.registrationDate());
            setStringOrNull(cs, 7, userId);
            cs.execute();
            Long id = cs.getObject(1, Long.class);
            Long revision = cs.getObject(2, Long.class);
            return new RegistrationResult(id, revision);
          });
    } catch (DataAccessException e) {
      LOGGER.error(
          "{} failed for package {}: {}",
          PROC_REGISTRATION_INS,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  /**
   * Updates registration data for a property.
   */
  @Transactional
  public RegistrationResult update(Long propertyId, RegistrationParams params, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_REGISTRATION_UPD, 7);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<RegistrationResult>) cs -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setLong(1, propertyId);
            setLongOrNull(cs, 2, params.revisionCount());
            setStringOrNull(cs, 3, params.ltoPlanNumber());
            setStringOrNull(cs, 4, params.ltoDocumentNumber());
            setStringOrNull(cs, 5, params.surveyTubeNumber());
            setDateOrNull(cs, 6, params.registrationDate());
            setStringOrNull(cs, 7, userId);
            cs.execute();
            Long id = cs.getObject(1, Long.class);
            Long revision = cs.getObject(2, Long.class);
            return new RegistrationResult(id, revision);
          });
    } catch (DataAccessException e) {
      LOGGER.error(
          "{} failed for package {}: {}",
          PROC_REGISTRATION_UPD,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  /**
   * Deletes registration data for a property.
   */
  @Transactional
  public void delete(Long propertyId, Long revisionCount) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_REGISTRATION_DEL, 2);

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
          PROC_REGISTRATION_DEL,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  private ReptPropertyRegistrationDto mapDto(ResultSet rs) throws java.sql.SQLException {
    Long propertyId = rs.getObject("PROJECT_PROPERTY_ID", Long.class);
    String planNumber = trim(rs.getString("LTO_PLAN_NUMBER"));
    String documentNumber = trim(rs.getString("LTO_DOCUMENT_NUMBER"));
    String surveyTubeNumber = trim(rs.getString("SURVEY_TUBE_NUMBER"));
    Date registrationDate = rs.getDate("LTO_REGISTRATION_DATE");
    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);
    LocalDate localRegistrationDate = toLocalDate(registrationDate);
    return new ReptPropertyRegistrationDto(
        propertyId, planNumber, documentNumber, surveyTubeNumber, localRegistrationDate, revisionCount);
  }

  /** Input parameters for registration operations. */
  public record RegistrationParams(
      Long revisionCount,
      String ltoPlanNumber,
      String ltoDocumentNumber,
      String surveyTubeNumber,
      LocalDate registrationDate) {}

  /** Result of registration insert/update operation. */
  public record RegistrationResult(Long propertyId, Long revisionCount) {}
}
