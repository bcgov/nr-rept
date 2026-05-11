package ca.bc.gov.nrs.hrs.repository.rept;

import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectCreateRequestDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectCreateResultDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectDetailDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectSearchResultDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptProjectUpdateRequestDto;
import ca.bc.gov.nrs.hrs.service.rept.ReptProjectSearchCriteria;
import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.Types;
import java.sql.Timestamp;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Optional;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
public class ReptProjectRepository extends AbstractReptRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptProjectRepository.class);

  private static final String PROC_PROJECT_GET = "REPT_PROJECT_GET";
  private static final String PROC_PROJECT_SEARCH = "REPT_PROJECT_SEARCH";
  private static final String PROC_PROJECT_INSERT = "REPT_PROJECT_INS";
  private static final String PROC_PROJECT_UPDATE = "REPT_PROJECT_UPD";
  private static final String PROC_REGION_CODES = "FOREST_REGION_LST";
  private static final String PROC_DISTRICT_CODES = "FOREST_DISTRICT_LST";
  private static final String PROC_BCTS_CODES = "FOREST_TSO_LST";
  private static final String PROC_STATUS_CODES = "REPT_PROJECT_STATUS_CODE_LST";
  private static final String PROC_PRIORITY_CODES = "REPT_PRIORITY_CODE_LST";
  private static final String PROC_REQUESTING_SOURCE_CODES = "REQUESTING_SOURCE_LST";
  private static final String PROC_PROJECT_MANAGER_CODES = "PROJECT_MANAGER_LST";
  private static final String PROC_PROJECT_FILE_PREFIX_CODES = "REPT_PROJECT_FILE_PREFIX_LST";
  private static final String PROC_PROJECT_FILE_SUFFIX_CODES = "REPT_PROJECT_FILE_SUFFIX_LST";
  private static final String DEFAULT_PRIORITY_CODE = "H";
  private static final String DEFAULT_STATUS_CODE_PENDING = "PND";

  public ReptProjectRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public List<ReptProjectSearchResultDto> searchProjects(ReptProjectSearchCriteria criteria) {
    if (criteria == null) {
      return List.of();
    }

  final String call = qualifyProjectProcedure(PROC_PROJECT_SEARCH, 8);
    Map<String, String> regionCodes = loadCodeList(PROC_REGION_CODES);
    Map<String, String> districtCodes = loadCodeList(PROC_DISTRICT_CODES);
    Map<String, String> statusCodes = loadCodeList(PROC_STATUS_CODES);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);

            setStringOrNull(cs, 2, criteria.projectFilePrefix());
            setLongOrNull(cs, 3, criteria.projectNumber());
            setStringOrNull(cs, 4, criteria.projectFileSuffix());
            setStringOrNull(cs, 5, criteria.projectName());
            setStringOrNull(cs, 6, criteria.projectStatusCode());
            setLongOrNull(cs, 7, criteria.districtNumber());
            setLongOrNull(cs, 8, criteria.regionNumber());
            setStringOrNull(cs, 9, criteria.projectManagerUserId());

            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return List.<ReptProjectSearchResultDto>of();
            }

            List<ReptProjectSearchResultDto> results = new ArrayList<>();
            try (rs) {
              while (rs.next()) {
                results.add(mapSearchRow(rs, regionCodes, districtCodes, statusCodes));
              }
            }
            return results;
          });
    } catch (org.springframework.dao.DataAccessException ex) {
      LOGGER.warn("{} failed for package {}: {}", PROC_PROJECT_SEARCH, projectPackage, ex.getMessage(), ex);
      return List.of();
    }
  }

  @Transactional(readOnly = true)
  public Map<String, String> listProjectManagers() {
    return new LinkedHashMap<>(loadCodeList(PROC_PROJECT_MANAGER_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listProjectStatuses() {
    return new LinkedHashMap<>(loadCodeList(PROC_STATUS_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listRegions() {
    return new LinkedHashMap<>(loadCodeList(PROC_REGION_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listDistricts() {
    return new LinkedHashMap<>(loadCodeList(PROC_DISTRICT_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listProjectFilePrefixes() {
    return new LinkedHashMap<>(loadCodeList(PROC_PROJECT_FILE_PREFIX_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listProjectFileSuffixes(String prefix) {
    String normalizedPrefix = trim(prefix);
    if (normalizedPrefix == null || normalizedPrefix.isBlank()) {
      return Map.of();
    }
    return new LinkedHashMap<>(loadCodeList(PROC_PROJECT_FILE_SUFFIX_CODES, normalizedPrefix));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listPriorityCodes() {
    return new LinkedHashMap<>(loadCodeList(PROC_PRIORITY_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listBctsOffices() {
    return new LinkedHashMap<>(loadCodeList(PROC_BCTS_CODES));
  }

  @Transactional(readOnly = true)
  public Map<String, String> listRequestingSources() {
    return new LinkedHashMap<>(loadCodeList(PROC_REQUESTING_SOURCE_CODES));
  }

  @Transactional
  public ReptProjectCreateResultDto createProject(
    ReptProjectCreateRequestDto request,
    String entryUserId) {
    if (request == null) {
      throw new IllegalArgumentException("request is required");
    }

    LocalDate requestDate = request.requestDate() == null ? LocalDate.now() : request.requestDate();
    String statusCode = blankToNull(request.statusCode());
    if (statusCode == null) {
      statusCode = DEFAULT_STATUS_CODE_PENDING;
    }

  final String call = qualifyProjectProcedureWithoutReturn(PROC_PROJECT_INSERT, 22);

    try {
      String finalStatusCode = statusCode;
      LocalDate finalRequestDate = requestDate;
      String finalComment = blankToNull(request.projectComment());
      String finalEntryUser = blankToNull(entryUserId);

      if (finalEntryUser == null) {
        throw new ProjectCreationException(
            ProjectCreationException.Reason.CHECK_CONSTRAINT,
            "A valid entry user ID is required to create a project file.");
      }
      return jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            int outIndex = 1;
            cs.registerOutParameter(outIndex++, Types.NUMERIC);
            cs.registerOutParameter(outIndex++, Types.NUMERIC);
            cs.registerOutParameter(outIndex++, Types.NUMERIC);

            int paramIndex = 1;
            setLongOrNull(cs, paramIndex++, null); // project id (in/out)
            setLongOrNull(cs, paramIndex++, null); // revision
            setLongOrNull(cs, paramIndex++, null); // project number
            setStringOrNull(cs, paramIndex++, request.filePrefix());
            setStringOrNull(cs, paramIndex++, request.fileSuffix());
            setStringOrNull(cs, paramIndex++, request.projectName());
            setStringOrNull(cs, paramIndex++, finalStatusCode);
            setStringOrNull(cs, paramIndex++, null); // priority handled via default
            setLongOrNull(cs, paramIndex++, parseNullableLong(request.bctsOfficeNumber()));
            setLongOrNull(cs, paramIndex++, parseNullableLong(request.districtNumber()));
            setLongOrNull(cs, paramIndex++, parseNullableLong(request.regionNumber()));
            setTimestampOrNull(cs, paramIndex++, finalRequestDate);
            setStringOrNull(cs, paramIndex++, request.requestorUserId());
            setLongOrNull(cs, paramIndex++, parseNullableLong(request.requestingSourceId()));
            setStringOrNull(cs, paramIndex++, null); // project history
            setStringOrNull(cs, paramIndex++, null); // related files
            setStringOrNull(cs, paramIndex++, null); // related registrations
            setStringOrNull(cs, paramIndex++, null); // project manager name
            setStringOrNull(cs, paramIndex++, null); // project manager userid
            setTimestampOrNull(cs, paramIndex++, null); // manager assign date
            setStringOrNull(cs, paramIndex++, finalComment); // comment
            setStringOrNull(cs, paramIndex++, finalEntryUser);

            cs.execute();

            Long projectId = cs.getObject(1, Long.class);
            Long revision = cs.getObject(2, Long.class);
            Long projectNumber = cs.getObject(3, Long.class);

            return new ReptProjectCreateResultDto(
                projectId,
                revision,
                projectNumber,
                request.filePrefix(),
                request.fileSuffix(),
                request.projectName(),
                finalStatusCode,
                DEFAULT_PRIORITY_CODE,
                request.requestingSourceId(),
                request.requestorUserId(),
        finalRequestDate);
          });
    } catch (ProjectCreationException ex) {
      throw ex;
    } catch (DataAccessException ex) {
      throw translateProjectCreateException(ex);
    }
  }

  private ReptProjectSearchResultDto mapSearchRow(
      ResultSet rs,
      Map<String, String> regionCodes,
      Map<String, String> districtCodes,
      Map<String, String> statusCodes)
      throws java.sql.SQLException {
    Long id = rs.getObject("REPT_PROJECT_ID", Long.class);
    String filePrefix = trim(rs.getString("FILE_PREFIX"));
    Long projectNumber = rs.getObject("PROJECT_NUMBER", Long.class);
    String fileSuffix = trim(rs.getString("FILE_SUFFIX"));
    String projectName = trim(rs.getString("PROJECT_NAME"));
    Long regionNumber = rs.getObject("REGION_NO", Long.class);
    Long districtNumber = rs.getObject("DISTRICT_NO", Long.class);
    String statusCode = trim(rs.getString("REPT_PROJECT_STATUS_CODE"));

    String regionLabel = labelFor(regionCodes, regionNumber);
    String districtLabel = labelFor(districtCodes, districtNumber);
    String statusLabel = labelFor(statusCodes, statusCode);

    return new ReptProjectSearchResultDto(
        id,
        filePrefix,
        projectNumber,
        fileSuffix,
        projectName,
        regionNumber,
        regionLabel,
        districtNumber,
        districtLabel,
        statusCode,
        statusLabel);
  }

  private String labelFor(Map<String, String> codes, Long number) {
    if (number == null) {
      return null;
    }
    String key = toCode(number);
    return labelFor(codes, key);
  }

  private String labelFor(Map<String, String> codes, String key) {
    if (key == null) {
      return null;
    }
    return codes.getOrDefault(key, key);
  }

  private void setTimestampOrNull(CallableStatement cs, int index, LocalDate value) throws java.sql.SQLException {
    if (value == null) {
      cs.setNull(index, Types.TIMESTAMP);
    } else {
      cs.setTimestamp(index, Timestamp.valueOf(value.atStartOfDay()));
    }
  }

  private Long parseNullableLong(String value) {
    String normalized = blankToNull(value);
    if (normalized == null) {
      return null;
    }
    try {
      return Long.valueOf(normalized);
    } catch (NumberFormatException ex) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.CHECK_CONSTRAINT,
          "Value must be numeric: " + normalized,
          ex);
    }
  }

  private String blankToNull(String value) {
    String trimmed = trim(value);
    if (trimmed == null || trimmed.isBlank()) {
      return null;
    }
    return trimmed;
  }

  private ProjectCreationException translateProjectCreateException(DataAccessException ex) {
    SQLException sqlException = findSqlException(ex);
    ProjectCreationException.Reason reason = ProjectCreationException.Reason.DATABASE_ERROR;
    String message = null;

    if (sqlException != null) {
      int errorCode = Math.abs(sqlException.getErrorCode());
      switch (errorCode) {
        case 1:
          reason = ProjectCreationException.Reason.DUPLICATE;
          break;
        case 20001:
          reason = ProjectCreationException.Reason.DATA_NOT_CURRENT;
          break;
        case 2290:
          reason = ProjectCreationException.Reason.CHECK_CONSTRAINT;
          break;
        case 2292:
          reason = ProjectCreationException.Reason.CHILD_RECORDS_EXIST;
          break;
        default:
          reason = ProjectCreationException.Reason.DATABASE_ERROR;
          break;
      }
      message = extractOracleMessage(sqlException.getMessage());
    }

    if (message == null || message.isBlank()) {
      message = defaultMessage(reason);
    }

    return new ProjectCreationException(reason, message, ex);
  }

  private SQLException findSqlException(Throwable throwable) {
    Throwable current = throwable;
    while (current != null) {
      if (current instanceof SQLException sqlException) {
        return sqlException;
      }
      current = current.getCause();
    }
    return null;
  }

  private String extractOracleMessage(String message) {
    if (message == null) {
      return null;
    }
    String trimmed = message.trim();
    if (trimmed.startsWith("ORA-")) {
      int colon = trimmed.indexOf(':');
      if (colon >= 0 && colon + 1 < trimmed.length()) {
        trimmed = trimmed.substring(colon + 1).trim();
      }
    }
    int newline = trimmed.indexOf('\n');
    if (newline > 0) {
      trimmed = trimmed.substring(0, newline).trim();
    }
    return trimmed;
  }

  private String defaultMessage(ProjectCreationException.Reason reason) {
    return switch (reason) {
      case DUPLICATE -> "A project with the same file already exists.";
      case CHECK_CONSTRAINT -> "Project data violates a database rule.";
      case DATA_NOT_CURRENT -> "The project information is out of date. Refresh and try again.";
      case CHILD_RECORDS_EXIST -> "The project has related records preventing this operation.";
      case DATABASE_ERROR -> "The project could not be created due to a database error.";
    };
  }

  @Transactional(readOnly = true)
  public Optional<ReptProjectDetailDto> findProjectById(Long projectId) {
    if (projectId == null) {
      return Optional.empty();
    }

    final String qualifiedCall = qualifyProjectProcedure(PROC_PROJECT_GET);

    try {
      return jdbcTemplate.execute(
          qualifiedCall,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, projectId);
            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return Optional.<ReptProjectDetailDto>empty();
            }

            try (rs) {
              if (!rs.next()) {
                return Optional.<ReptProjectDetailDto>empty();
              }

              ReptProjectDetailDto dto = mapProject(rs);
              return Optional.of(dto);
            }
          });
    } catch (DataAccessException e) {
      LOGGER.warn("{} failed for package {}: {}", PROC_PROJECT_GET, projectPackage, e.getMessage(), e);
      return Optional.empty();
    }
  }

  private ReptProjectDetailDto mapProject(ResultSet rs) throws java.sql.SQLException {
    Long id = rs.getObject("REPT_PROJECT_ID", Long.class);
    String filePrefix = trim(rs.getString("FILE_PREFIX"));
    Long projectNumber = rs.getObject("PROJECT_NUMBER", Long.class);
    String fileSuffix = trim(rs.getString("FILE_SUFFIX"));
    String projectName = trim(rs.getString("PROJECT_NAME"));
    String statusCode = trim(rs.getString("REPT_PROJECT_STATUS_CODE"));
    String priorityCode = trim(rs.getString("REPT_PRIORITY_CODE"));
    Long regionNumber = rs.getObject("REGION_NO", Long.class);
    Long districtNumber = rs.getObject("DISTRICT_NO", Long.class);
    Long bctsOfficeNumber = rs.getObject("BCTS_OFFICE_NO", Long.class);
    Timestamp requestTs = rs.getTimestamp("REQUEST_DATE");
    String requestingSourceId = toCode(rs.getObject("REPT_REQUESTING_SOURCE_ID", Long.class));
    String requestorUserId = trim(rs.getString("REQUESTOR_USERID"));
    String projectManagerUserId = trim(rs.getString("PROJECT_MANAGER_USERID"));
    String projectManagerName = trim(rs.getString("PROJECT_MANAGER_NAME"));
    Timestamp assignedTs = rs.getTimestamp("PROJECT_MANAGER_ASSIGN_DATE");
    String projectHistory = rs.getString("PROJECT_HISTORY");
    String relatedFiles = rs.getString("RELATED_FILES");
    String relatedRegistrations = rs.getString("RELATED_REGISTRATIONS");
    String projectComment = rs.getString("PROJECT_COMMENT");
    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);

    LocalDate requestDate = toLocalDate(requestTs);
    LocalDate assignedDate = toLocalDate(assignedTs);

    String regionLabel = lookupLabel(PROC_REGION_CODES, toCode(regionNumber)).orElse(null);
    String districtLabel = lookupLabel(PROC_DISTRICT_CODES, toCode(districtNumber)).orElse(null);
    String bctsLabel = lookupLabel(PROC_BCTS_CODES, toCode(bctsOfficeNumber)).orElse(null);
    String statusLabel = lookupLabel(PROC_STATUS_CODES, statusCode).orElse(null);
    String priorityLabel = lookupLabel(PROC_PRIORITY_CODES, priorityCode).orElse(null);
    String requestingSourceLabel = lookupLabel(PROC_REQUESTING_SOURCE_CODES, requestingSourceId).orElse(null);

    return new ReptProjectDetailDto(
        id,
        filePrefix,
        projectNumber,
        fileSuffix,
        projectName,
        statusCode,
        statusLabel,
        priorityCode,
        priorityLabel,
        regionNumber,
        regionLabel,
        districtNumber,
        districtLabel,
        bctsOfficeNumber,
        bctsLabel,
        requestDate,
        requestingSourceId,
        requestingSourceLabel,
        requestorUserId,
        projectManagerUserId,
        projectManagerName,
        assignedDate,
        projectHistory,
        relatedFiles,
        relatedRegistrations,
        projectComment,
        revisionCount);
  }

  @Transactional
  public void updateProject(Long projectId, ReptProjectUpdateRequestDto request, String entryUserId)
      throws ProjectCreationException {
    if (projectId == null || request == null) {
      throw new IllegalArgumentException("projectId and request are required");
    }

    // First fetch the current project to get the file prefix, project number, and file suffix
    Optional<ReptProjectDetailDto> existing = findProjectById(projectId);
    if (existing.isEmpty()) {
      throw new ProjectCreationException(
          ProjectCreationException.Reason.DATA_NOT_CURRENT,
          "Project not found or has been deleted.");
    }

    ReptProjectDetailDto current = existing.get();
    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROJECT_UPDATE, 22);

    LOGGER.debug("Updating project {}: revisionCount={}, projectName={}, statusCode={}, priorityCode={}, "
        + "regionNumber={}, districtNumber={}, bctsOfficeNumber={}, requestingSourceId={}, entryUserId={}",
        projectId, request.revisionCount(), request.projectName(), request.statusCode(), request.priorityCode(),
        request.regionNumber(), request.districtNumber(), request.bctsOfficeNumber(),
        request.requestingSourceId(), entryUserId);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            // Register OUT parameters for positions 1 and 2 (INOUT)
            cs.registerOutParameter(1, Types.DECIMAL);
            cs.registerOutParameter(2, Types.DECIMAL);

            // Parameter order must match stored procedure REPT_PROJECT_UPD exactly:
            // 1: IO_PROJECT_ID (INOUT, NUMBER)
            // 2: IO_REVISION_COUNT (INOUT, NUMBER)
            // 3: IN_FILE_PREFIX (VARCHAR2)
            // 4: IN_PROJECT_NUMBER (NUMBER)
            // 5: IN_FILE_SUFFIX (VARCHAR2)
            // 6: IN_PROJECT_NAME (VARCHAR2)
            // 7: IN_REPT_PROJECT_STATUS_CODE (VARCHAR2)
            // 8: IN_REPT_PRIORITY_CODE (VARCHAR2)
            // 9: IN_BCTS_OFFICE_NO (NUMBER)
            // 10: IN_DISTRICT_NO (NUMBER)
            // 11: IN_REGION_NO (NUMBER)
            // 12: IN_REQUEST_DATE (DATE)
            // 13: IN_REQUESTOR_USERID (VARCHAR2)
            // 14: IN_REPT_REQUESTING_SOURCE_ID (NUMBER)
            // 15: IN_PROJECT_HISTORY (VARCHAR2)
            // 16: IN_RELATED_FILES (VARCHAR2)
            // 17: IN_RELATED_REGISTRATIONS (VARCHAR2)
            // 18: IN_PROJECT_MANAGER_NAME (VARCHAR2)
            // 19: IN_PROJECT_MANAGER_USERID (VARCHAR2)
            // 20: IN_PROJECT_MANAGER_ASSIGN_DATE (DATE)
            // 21: IN_PROJECT_COMMENT (VARCHAR2)
            // 22: IN_USERID (VARCHAR2)

            int paramIndex = 1;
            setLongOrNull(cs, paramIndex++, projectId);                       // 1: project id (INOUT)
            setLongOrNull(cs, paramIndex++, request.revisionCount());         // 2: revision count (INOUT)
            setStringOrNull(cs, paramIndex++, current.filePrefix());          // 3: file prefix
            setLongOrNull(cs, paramIndex++, current.projectNumber());         // 4: project number
            setStringOrNull(cs, paramIndex++, current.fileSuffix());          // 5: file suffix
            setStringOrNull(cs, paramIndex++, request.projectName());         // 6: project name
            setStringOrNull(cs, paramIndex++, request.statusCode());          // 7: status code
            setStringOrNull(cs, paramIndex++, request.priorityCode());        // 8: priority code
            setLongOrNull(cs, paramIndex++, request.bctsOfficeNumber());      // 9: BCTS office number
            setLongOrNull(cs, paramIndex++, request.districtNumber());        // 10: district number
            setLongOrNull(cs, paramIndex++, request.regionNumber());          // 11: region number
            setDateOrNull(cs, paramIndex++, request.requestDate());           // 12: request date
            setStringOrNull(cs, paramIndex++, request.requestorUserId());     // 13: requestor userid
            setLongOrNull(cs, paramIndex++, parseNullableLong(request.requestingSourceId())); // 14: requesting source id
            setStringOrNull(cs, paramIndex++, request.projectHistory());      // 15: project history
            setStringOrNull(cs, paramIndex++, request.relatedFiles());        // 16: related files
            setStringOrNull(cs, paramIndex++, request.relatedRegistrations()); // 17: related registrations
            setStringOrNull(cs, paramIndex++, request.projectManagerName());  // 18: project manager name
            setStringOrNull(cs, paramIndex++, request.projectManagerUserId()); // 19: project manager userid
            setDateOrNull(cs, paramIndex++, request.projectManagerAssignedDate()); // 20: manager assign date
            setStringOrNull(cs, paramIndex++, request.projectComment());      // 21: project comment
            setStringOrNull(cs, paramIndex++, entryUserId);                   // 22: entry userid

            cs.execute();
            
            Long updatedId = cs.getLong(1);
            Long updatedRevision = cs.getLong(2);
            LOGGER.debug("Project updated: id={}, new revisionCount={}", updatedId, updatedRevision);
            return null;
          });
    } catch (DataAccessException ex) {
      throw translateProjectCreateException(ex);
    }
  }

}
