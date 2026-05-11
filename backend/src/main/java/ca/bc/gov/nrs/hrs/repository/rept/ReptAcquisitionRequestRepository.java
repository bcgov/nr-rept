package ca.bc.gov.nrs.hrs.repository.rept;

import ca.bc.gov.nrs.hrs.dto.rept.ReptAcquisitionRequestCreateDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptAcquisitionRequestDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptAcquisitionRequestUpdateDto;
import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.Types;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Profile("oracle")
public class ReptAcquisitionRequestRepository extends AbstractReptRepository {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ReptAcquisitionRequestRepository.class);

  private static final String PROC_ACQUISITION_REQUEST_FIND = "ACQUISITION_REQUEST_FIND";
  private static final String PROC_ACQUISITION_REQUEST_INSERT = "ACQUISITION_REQUEST_INS";
  private static final String PROC_ACQUISITION_REQUEST_UPDATE = "ACQUISITION_REQUEST_UPD";
  private static final String PROC_RECOMMENDED_ACQ_CODES = "RECOMMENDED_ACQ_CODE_LST";
  private static final String PROC_FSR_STATUS_CODES = "FSR_ACQ_STATUS_CODE_LST";
  private static final String PROC_ROAD_USE_CODES = "ROAD_USE_TYPE_CODE_LST";
  private static final String PROC_FUNDING_CODES = "REPT_FUNDING_SOURCE_CODE_LST";

  public ReptAcquisitionRequestRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public Optional<ReptAcquisitionRequestDto> findByProjectId(Long projectId) {
    if (projectId == null) {
      return Optional.empty();
    }

    final String qualifiedCall = qualifyProjectProcedure(PROC_ACQUISITION_REQUEST_FIND);

    try {
      return jdbcTemplate.execute(
          qualifiedCall,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, projectId);
            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return Optional.<ReptAcquisitionRequestDto>empty();
            }

            try (rs) {
              if (!rs.next()) {
                return Optional.<ReptAcquisitionRequestDto>empty();
              }
              ReptAcquisitionRequestDto dto = mapDto(rs);
              return Optional.of(dto);
            }
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_ACQUISITION_REQUEST_FIND,
          projectPackage,
          e.getMessage(),
          e);
      return Optional.empty();
    }
  }

  private ReptAcquisitionRequestDto mapDto(ResultSet rs) throws java.sql.SQLException {
    Long id = rs.getObject("ACQUISITION_REQUEST_ID", Long.class);
    Long projectId = rs.getObject("REPT_PROJECT_ID", Long.class);
    String recommendedCode = trim(rs.getString("RECOMMENDED_ACQUISITION_CODE"));
    String fsrCode = trim(rs.getString("FSR_ACQUISITION_STATUS_CODE"));
    String roadUseCode = trim(rs.getString("ROAD_USE_TYPE_CODE"));
    Date receivedDateRaw = rs.getDate("ACQUISITION_REQUEST_DATE");
    LocalDate receivedDate = toLocalDate(receivedDateRaw);
    Date targetDateRaw = rs.getDate("TARGET_COMPLETION_DATE");
    LocalDate targetDate = toLocalDate(targetDateRaw);
    String locationPlan = trim(rs.getString("LOCATION_PLAN"));
  String justification = rs.getString("JUSTIFICATION");
  String propertiesDescription = rs.getString("PROPERTIES_DESCRIPTION");
    BigDecimal timberVolume = rs.getBigDecimal("TOTAL_VOLUME_ACCESSED");
    BigDecimal annualVolume = rs.getBigDecimal("ANNUAL_HAULED_VOLUME");
    BigDecimal availableFunds = rs.getBigDecimal("AVAILABLE_FUNDS_AMOUNT");
    String responsibilityCentre = trim(rs.getString("CAS_RESPONSIBILITY_CENTRE"));
    String fundingCode = trim(rs.getString("REPT_FUNDING_SOURCE_CODE"));
    String serviceLine = trim(rs.getString("CAS_SERVICE_LINE"));
    String stob = trim(rs.getString("CAS_STOB"));
    String requestorUserId = trim(rs.getString("ACQUISITION_REQUESTOR_USERID"));
    String requestorName = trim(rs.getString("ACQUISTION_REQUESTOR_NAME"));
    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);

    String acquisitionTypeLabel =
        lookupLabel(PROC_RECOMMENDED_ACQ_CODES, recommendedCode).orElse(null);
    String fsrTypeLabel = lookupLabel(PROC_FSR_STATUS_CODES, fsrCode).orElse(null);
    String roadUseTypeLabel = lookupLabel(PROC_ROAD_USE_CODES, roadUseCode).orElse(null);
    String fundingLabel = lookupLabel(PROC_FUNDING_CODES, fundingCode).orElse(null);

    return new ReptAcquisitionRequestDto(
        id,
        projectId,
        recommendedCode,
        acquisitionTypeLabel,
        fsrCode,
        fsrTypeLabel,
        roadUseCode,
        roadUseTypeLabel,
        receivedDate,
        targetDate,
        locationPlan,
        justification,
        propertiesDescription,
        timberVolume,
        annualVolume,
        availableFunds,
        responsibilityCentre,
        fundingCode,
        fundingLabel,
        serviceLine,
        stob,
        requestorUserId,
        requestorName,
        revisionCount);
  }

  @Transactional(readOnly = true)
  public Map<String, String> listAcquisitionTypes() {
    return new LinkedHashMap<>(loadCodeList(PROC_RECOMMENDED_ACQ_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listFsrTypes() {
    return new LinkedHashMap<>(loadCodeList(PROC_FSR_STATUS_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listRoadUseTypes() {
    return new LinkedHashMap<>(loadCodeList(PROC_ROAD_USE_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listFundingCodes() {
    return new LinkedHashMap<>(loadCodeList(PROC_FUNDING_CODES));
  }

  @Transactional
  public Long createAcquisitionRequest(Long projectId, ReptAcquisitionRequestCreateDto request, String entryUserId)
      throws ProjectCreationException {
    if (projectId == null || request == null) {
      throw new IllegalArgumentException("projectId and request are required");
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_ACQUISITION_REQUEST_INSERT, 21);

    LOGGER.info("SQL Call: {}", call);
    LOGGER.debug("Creating acquisition request for project {}: acquisitionTypeCode={}, fsrTypeCode={}, "
        + "roadUseTypeCode={}, receivedDate={}, targetCompletionDate={}, justification length={}, "
        + "propertiesDescription length={}, timberVolumeAccessed={}, annualVolume={}, availableFunds={}, "
        + "responsibilityCentre={}, fundingCode={}, serviceLine={}, stob={}, entryUserId={}",
        projectId, request.acquisitionTypeCode(), request.fsrTypeCode(), request.roadUseTypeCode(),
        request.receivedDate(), request.targetCompletionDate(),
        request.justification() != null ? request.justification().length() : 0,
        request.propertiesDescription() != null ? request.propertiesDescription().length() : 0,
        request.timberVolumeAccessed(), request.annualVolume(), request.availableFunds(),
        request.responsibilityCentre(), request.fundingCode(), request.serviceLine(), request.stob(), entryUserId);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            // Use Types.DECIMAL to match legacy code exactly
            cs.registerOutParameter(1, Types.DECIMAL);
            cs.registerOutParameter(2, Types.DECIMAL);

            // Parameter order must match stored procedure ACQUISITION_REQUEST_INS exactly:
            // 1: IO_ACQUISITION_REQUEST_ID (INOUT)
            // 2: IO_REVISION_COUNT (INOUT)
            // 3: IN_REPT_PROJECT_ID
            // 4: IN_ACQUISTION_REQUESTOR_NAME
            // 5: IN_ACQ_REQUESTOR_USERID
            // 6: IN_ACQUISITION_REQUEST_DATE
            // 7: IN_JUSTIFICATION
            // 8: IN_PROPERTIES_DESCRIPTION
            // 9: IN_TOTAL_VOLUME_ACCESSED
            // 10: IN_TARGET_COMPLETION_DATE
            // 11: IN_ANNUAL_HAULED_VOLUME
            // 12: IN_LOCATION_PLAN
            // 13: IN_AVAILABLE_FUNDS_AMOUNT
            // 14: IN_CAS_RESPONSIBILITY_CENTRE
            // 15: IN_CAS_SERVICE_LINE
            // 16: IN_CAS_STOB
            // 17: IN_RECOMMENDED_ACQ_CODE
            // 18: IN_FSR_ACQUISITION_STATUS_CODE
            // 19: IN_REPT_FUNDING_SOURCE_CODE
            // 20: IN_ROAD_USE_TYPE_CODE
            // 21: IN_USERID

            int paramIndex = 1;
            cs.setNull(paramIndex++, Types.DECIMAL);                          // 1: id (OUT, use DECIMAL like legacy)
            cs.setNull(paramIndex++, Types.DECIMAL);                          // 2: revisionCount (OUT, use DECIMAL like legacy)
            setLongOrNull(cs, paramIndex++, projectId);                       // 3: project id
            setStringOrNull(cs, paramIndex++, request.requestorName());       // 4: requestor name
            setStringOrNull(cs, paramIndex++, request.requestorUserId());     // 5: requestor userid
            setDateOrNull(cs, paramIndex++, request.receivedDate());          // 6: acquisition request date
            setStringOrNull(cs, paramIndex++, request.justification());       // 7: justification
            setStringOrNull(cs, paramIndex++, request.propertiesDescription()); // 8: properties description
            setBigDecimalOrNull(cs, paramIndex++, request.timberVolumeAccessed()); // 9: total volume accessed
            setDateOrNull(cs, paramIndex++, request.targetCompletionDate());  // 10: target completion date
            setBigDecimalOrNull(cs, paramIndex++, request.annualVolume());    // 11: annual hauled volume
            setStringOrNull(cs, paramIndex++, request.locationPlan());        // 12: location plan
            setBigDecimalOrNull(cs, paramIndex++, request.availableFunds());  // 13: available funds amount
            setStringOrNull(cs, paramIndex++, request.responsibilityCentre()); // 14: CAS responsibility centre
            setStringOrNull(cs, paramIndex++, request.serviceLine());         // 15: CAS service line
            setStringOrNull(cs, paramIndex++, request.stob());                // 16: CAS STOB
            setStringOrNull(cs, paramIndex++, request.acquisitionTypeCode()); // 17: recommended acq code
            setStringOrNull(cs, paramIndex++, request.fsrTypeCode());         // 18: FSR acquisition status code
            setStringOrNull(cs, paramIndex++, request.fundingCode());         // 19: funding source code
            setStringOrNull(cs, paramIndex++, request.roadUseTypeCode());     // 20: road use type code
            setStringOrNull(cs, paramIndex++, entryUserId);                   // 21: entry userid

            cs.execute();
            Long newId = cs.getLong(1);
            Long newRevision = cs.getLong(2);
            LOGGER.debug("Acquisition request created with id={}, revisionCount={}", newId, newRevision);
            return newId;
          });
    } catch (DataAccessException ex) {
      LOGGER.error("Failed to create acquisition request for project {}: {}", projectId, ex.getMessage(), ex);
      throw translateException(ex);
    }
  }

  @Transactional
  public void updateAcquisitionRequest(Long acquisitionRequestId, ReptAcquisitionRequestUpdateDto request, String entryUserId)
      throws ProjectCreationException {
    if (acquisitionRequestId == null || request == null) {
      throw new IllegalArgumentException("acquisitionRequestId and request are required");
    }

    // First get the projectId from the existing record
    Optional<ReptAcquisitionRequestDto> existing = findById(acquisitionRequestId);
    if (existing.isEmpty()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.DATA_NOT_CURRENT,
          "Acquisition request not found or has been deleted.");
    }

    Long projectId = existing.get().projectId();
    final String call = qualifyProjectProcedureWithoutReturn(PROC_ACQUISITION_REQUEST_UPDATE, 21);

    LOGGER.debug("Updating acquisition request {}: revisionCount={}, acquisitionTypeCode={}, fsrTypeCode={}, "
        + "roadUseTypeCode={}, receivedDate={}, targetCompletionDate={}, justification length={}, "
        + "propertiesDescription length={}, timberVolumeAccessed={}, annualVolume={}, availableFunds={}, "
        + "responsibilityCentre={}, fundingCode={}, serviceLine={}, stob={}, entryUserId={}",
        acquisitionRequestId, request.revisionCount(), request.acquisitionTypeCode(), request.fsrTypeCode(),
        request.roadUseTypeCode(), request.receivedDate(), request.targetCompletionDate(),
        request.justification() != null ? request.justification().length() : 0,
        request.propertiesDescription() != null ? request.propertiesDescription().length() : 0,
        request.timberVolumeAccessed(), request.annualVolume(), request.availableFunds(),
        request.responsibilityCentre(), request.fundingCode(), request.serviceLine(), request.stob(), entryUserId);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            // Use Types.DECIMAL to match legacy code exactly
            cs.registerOutParameter(1, Types.DECIMAL);
            cs.registerOutParameter(2, Types.DECIMAL);

            // Parameter order must match stored procedure ACQUISITION_REQUEST_UPD exactly:
            // 1: IO_ACQUISITION_REQUEST_ID (INOUT)
            // 2: IO_REVISION_COUNT (INOUT)
            // 3: IN_REPT_PROJECT_ID
            // 4: IN_ACQUISTION_REQUESTOR_NAME
            // 5: IN_ACQ_REQUESTOR_USERID
            // 6: IN_ACQUISITION_REQUEST_DATE
            // 7: IN_JUSTIFICATION
            // 8: IN_PROPERTIES_DESCRIPTION
            // 9: IN_TOTAL_VOLUME_ACCESSED
            // 10: IN_TARGET_COMPLETION_DATE
            // 11: IN_ANNUAL_HAULED_VOLUME
            // 12: IN_LOCATION_PLAN
            // 13: IN_AVAILABLE_FUNDS_AMOUNT
            // 14: IN_CAS_RESPONSIBILITY_CENTRE
            // 15: IN_CAS_SERVICE_LINE
            // 16: IN_CAS_STOB
            // 17: IN_RECOMMENDED_ACQ_CODE
            // 18: IN_FSR_ACQUISITION_STATUS_CODE
            // 19: IN_REPT_FUNDING_SOURCE_CODE
            // 20: IN_ROAD_USE_TYPE_CODE
            // 21: IN_USERID

            int paramIndex = 1;
            setLongOrNull(cs, paramIndex++, acquisitionRequestId);            // 1: id (INOUT)
            setLongOrNull(cs, paramIndex++, request.revisionCount());         // 2: revisionCount (INOUT)
            setLongOrNull(cs, paramIndex++, projectId);                       // 3: project id
            setStringOrNull(cs, paramIndex++, request.requestorName());       // 4: requestor name
            setStringOrNull(cs, paramIndex++, request.requestorUserId());     // 5: requestor userid
            setDateOrNull(cs, paramIndex++, request.receivedDate());          // 6: acquisition request date
            setStringOrNull(cs, paramIndex++, request.justification());       // 7: justification
            setStringOrNull(cs, paramIndex++, request.propertiesDescription()); // 8: properties description
            setBigDecimalOrNull(cs, paramIndex++, request.timberVolumeAccessed()); // 9: total volume accessed
            setDateOrNull(cs, paramIndex++, request.targetCompletionDate());  // 10: target completion date
            setBigDecimalOrNull(cs, paramIndex++, request.annualVolume());    // 11: annual hauled volume
            setStringOrNull(cs, paramIndex++, request.locationPlan());        // 12: location plan
            setBigDecimalOrNull(cs, paramIndex++, request.availableFunds());  // 13: available funds amount
            setStringOrNull(cs, paramIndex++, request.responsibilityCentre()); // 14: CAS responsibility centre
            setStringOrNull(cs, paramIndex++, request.serviceLine());         // 15: CAS service line
            setStringOrNull(cs, paramIndex++, request.stob());                // 16: CAS STOB
            setStringOrNull(cs, paramIndex++, request.acquisitionTypeCode()); // 17: recommended acq code
            setStringOrNull(cs, paramIndex++, request.fsrTypeCode());         // 18: FSR acquisition status code
            setStringOrNull(cs, paramIndex++, request.fundingCode());         // 19: funding source code
            setStringOrNull(cs, paramIndex++, request.roadUseTypeCode());     // 20: road use type code
            setStringOrNull(cs, paramIndex++, entryUserId);                   // 21: entry userid

            cs.execute();
            Long updatedId = cs.getLong(1);
            Long updatedRevision = cs.getLong(2);
            LOGGER.debug("Acquisition request updated: id={}, new revisionCount={}", updatedId, updatedRevision);
            return null;
          });
    } catch (DataAccessException ex) {
      LOGGER.error("Failed to update acquisition request {}: {}", acquisitionRequestId, ex.getMessage(), ex);
      throw translateException(ex);
    }
  }

  private Optional<ReptAcquisitionRequestDto> findById(Long acquisitionRequestId) {
    if (acquisitionRequestId == null) {
      return Optional.empty();
    }

    final String qualifiedCall = qualifyProjectProcedure("ACQUISITION_REQUEST_GET");

    try {
      return jdbcTemplate.execute(
          qualifiedCall,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, acquisitionRequestId);
            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return Optional.<ReptAcquisitionRequestDto>empty();
            }

            try (rs) {
              if (!rs.next()) {
                return Optional.<ReptAcquisitionRequestDto>empty();
              }
              return Optional.of(mapDto(rs));
            }
          });
    } catch (DataAccessException e) {
      LOGGER.warn("ACQUISITION_REQUEST_GET failed: {}", e.getMessage(), e);
      return Optional.empty();
    }
  }

  private void setBigDecimalOrNull(CallableStatement cs, int index, BigDecimal value) throws java.sql.SQLException {
    if (value == null) {
      cs.setNull(index, Types.NUMERIC);
    } else {
      cs.setBigDecimal(index, value);
    }
  }

  private ProjectCreationException translateException(DataAccessException ex) {
    java.sql.SQLException sqlException = findSqlException(ex);
    ProjectCreationException.Reason reason = ProjectCreationException.Reason.DATABASE_ERROR;
    String message = null;

    if (sqlException != null) {
      int errorCode = Math.abs(sqlException.getErrorCode());
      String sqlState = sqlException.getSQLState();
      String sqlMessage = sqlException.getMessage();
      
      LOGGER.error("SQL Exception details - errorCode: {}, sqlState: {}, message: {}", 
          errorCode, sqlState, sqlMessage);
      
      switch (errorCode) {
        case 1:
          reason = ProjectCreationException.Reason.DUPLICATE;
          message = "An acquisition request already exists for this project.";
          break;
        case 20001:
          reason = ProjectCreationException.Reason.DATA_NOT_CURRENT;
          message = "The acquisition request information is out of date. Refresh and try again.";
          break;
        case 2290:
          reason = ProjectCreationException.Reason.CHECK_CONSTRAINT;
          message = "Acquisition request data violates a database rule.";
          break;
        case 6550:
          // PL/SQL compilation error - likely wrong number of parameters
          LOGGER.error("PL/SQL compilation error - check stored procedure parameter count");
          message = "Database procedure error: " + sqlMessage;
          break;
        default:
          LOGGER.error("Unhandled SQL error code: {} - {}", errorCode, sqlMessage);
          break;
      }
    } else {
      LOGGER.error("No SQL exception found in chain, root cause: {}", ex.getMostSpecificCause().getMessage());
    }

    if (message == null) {
      message = "The acquisition request could not be saved due to a database error.";
    }

    return new ProjectCreationException(reason, message, ex);
  }

  private java.sql.SQLException findSqlException(Throwable throwable) {
    Throwable current = throwable;
    while (current != null) {
      if (current instanceof java.sql.SQLException sqlException) {
        return sqlException;
      }
      current = current.getCause();
    }
    return null;
  }
}
