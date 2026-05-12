package ca.bc.gov.nrs.rept.repository.rept;

import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyDetailDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyMilestoneDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertyOptionsDto;
import ca.bc.gov.nrs.rept.dto.rept.ReptPropertySummaryDto;
import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
public class ReptPropertyRepository extends AbstractReptRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptPropertyRepository.class);

  private static final String PROC_PROPERTY_FIND = "PROJECT_PROPERTY_FIND";
  private static final String PROC_PROPERTY_GET = "PROJECT_PROPERTY_GET";
  private static final String PROC_PROPERTY_INS = "PROJECT_PROPERTY_INS";
  private static final String PROC_PROPERTY_UPD = "PROJECT_PROPERTY_UPD";
  private static final String PROC_PROPERTY_DEL = "PROJECT_PROPERTY_DEL";
  private static final String PROC_PROPERTY_ACQ_CODES = "PROPERTY_ACQUISITION_CODE_LST";
  private static final String PROC_LTO_CODES = "LAND_TITLE_OFFICE_CODE_LST";
  private static final String PROC_ELECTORAL_CODES = "ELECTORAL_DISTRICT_CODE_LST";
  private static final String PROC_ORG_UNIT_GET = "ORG_UNIT_GET";
  private static final String PROC_FOREST_DISTRICTS = "FOREST_DISTRICT_LST";

  public ReptPropertyRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public List<ReptPropertySummaryDto> findPropertySummaries(Long projectId) {
    if (projectId == null) {
      return List.of();
    }

    CodeLookups lookups = loadCodeLookups();
    Map<Long, OrgUnitInfo> orgUnitCache = new HashMap<>();
    List<PropertyRecord> records = new ArrayList<>();

    final String qualifiedCall = qualifyProjectProcedure(PROC_PROPERTY_FIND);

    try {
      jdbcTemplate.execute(
          qualifiedCall,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, projectId);
            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return null;
            }

            try (rs) {
              while (rs.next()) {
                PropertyRecord record = mapProperty(rs, lookups, orgUnitCache);
                if (Objects.equals(record.projectId(), projectId)) {
                  records.add(record);
                }
              }
            }
            return null;
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_FIND,
          projectPackage,
          e.getMessage(),
          e);
      return List.of();
    }

    records.sort((a, b) -> compareSafe(a.parcelIdentifier(), b.parcelIdentifier()));

    return records.stream().map(this::toSummaryDto).toList();
  }

  @Transactional(readOnly = true)
  public Optional<ReptPropertyDetailDto> findPropertyDetail(Long projectId, Long propertyId) {
    return loadPropertyRecord(propertyId)
        .filter(record -> Objects.equals(record.projectId(), projectId))
        .map(this::toDetailDto);
  }

  @Transactional(readOnly = true)
  public Optional<ReptPropertyMilestoneDto> findPropertyMilestones(Long projectId, Long propertyId) {
    return loadPropertyRecord(propertyId)
        .filter(record -> Objects.equals(record.projectId(), projectId))
        .map(this::toMilestoneDto);
  }

  @Transactional(readOnly = true)
  public Optional<Long> findProjectIdForProperty(Long propertyId) {
    return loadPropertyRecord(propertyId).map(PropertyRecord::projectId);
  }

  /**
   * Returns dropdown options for property forms (acquisition types, land title offices,
   * electoral districts, and forest districts).
   */
  @Transactional(readOnly = true)
  public ReptPropertyOptionsDto getPropertyOptions() {
    Map<String, String> acquisition = loadCodeList(PROC_PROPERTY_ACQ_CODES);
    Map<String, String> landTitle = loadCodeList(PROC_LTO_CODES);
    Map<String, String> electoral = loadCodeList(PROC_ELECTORAL_CODES);
    List<ReptPropertyOptionsDto.OrgUnitOption> forestDistricts = loadForestDistricts();
    return ReptPropertyOptionsDto.from(acquisition, landTitle, electoral, forestDistricts);
  }

  /**
   * Creates a new property for the given project.
   * Returns the new property ID and revision count.
   */
  @Transactional
  public PropertyInsertResult insert(PropertyInsertParams params, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROPERTY_INS, 33);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<PropertyInsertResult>) cs -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setNull(1, Types.NUMERIC); // ID - will be generated
            cs.setNull(2, Types.NUMERIC); // Revision - will be set
            setOptionalIndicator(cs, 3, params.expropriationRecommended());
            setLongOrNull(cs, 4, params.projectId());
            setStringOrNull(cs, 5, params.titleNumber());
            setStringOrNull(cs, 6, params.legalDescription());
            setStringOrNull(cs, 7, params.parcelIdentifier());
            setBigDecimalOrNull(cs, 8, params.parcelArea());
            setBigDecimalOrNull(cs, 9, params.projectArea());
            setStringOrNull(cs, 10, params.parcelAddress());
            setStringOrNull(cs, 11, params.city());
            setBigDecimalOrNull(cs, 12, params.assessedValue());
            setStringOrNull(cs, 13, params.landTitleOfficeCode());
            setStringOrNull(cs, 14, params.electoralDistrictCode());
            setStringOrNull(cs, 15, params.acquisitionCode());
            setLongOrNull(cs, 16, params.orgUnitNumber());
            // Milestone dates - null for new properties
            setDateOrNull(cs, 17, null); // ownerContactDate
            setDateOrNull(cs, 18, null); // internalAppraisalDate
            setDateOrNull(cs, 19, null); // roadValueRequestDate
            setDateOrNull(cs, 20, null); // roadValueReceivedDate
            setDateOrNull(cs, 21, null); // fundingRequestDate
            setDateOrNull(cs, 22, null); // fundingApprovedDate
            setDateOrNull(cs, 23, null); // surveyRequestDate
            setDateOrNull(cs, 24, null); // surveyReceivedDate
            setStringOrNull(cs, 25, null); // assessmentComment
            setDateOrNull(cs, 26, null); // feeAppraisalReceiveDate
            setDateOrNull(cs, 27, null); // feeAppraisalRequestDate
            setDateOrNull(cs, 28, null); // offerDate
            setStringOrNull(cs, 29, null); // negotiationComment
            setDateOrNull(cs, 30, null); // offerAcceptDate
            setDateOrNull(cs, 31, null); // completeDate
            setStringOrNull(cs, 32, null); // acquisitionComment
            setStringOrNull(cs, 33, userId);
            cs.execute();
            Long id = cs.getObject(1, Long.class);
            Long revision = cs.getObject(2, Long.class);
            return new PropertyInsertResult(id, revision);
          });
    } catch (DataAccessException e) {
      LOGGER.error(
          "{} failed for package {}: {}",
          PROC_PROPERTY_INS,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  /**
   * Updates property details (Details tab).
   */
  @Transactional
  public PropertyUpdateResult updateDetails(Long propertyId, PropertyUpdateParams params, String userId) {
    return loadPropertyRecord(propertyId)
        .map(record -> executeUpdate(record, params, userId))
        .orElseThrow(() -> new IllegalArgumentException("Property not found: " + propertyId));
  }

  /**
   * Updates property milestones (Milestones tab).
   */
  @Transactional
  public PropertyUpdateResult updateMilestones(Long propertyId, PropertyMilestoneParams params, String userId) {
    return loadPropertyRecord(propertyId)
        .map(record -> executeMilestoneUpdate(record, params, userId))
        .orElseThrow(() -> new IllegalArgumentException("Property not found: " + propertyId));
  }

  /**
   * Deletes a property.
   */
  @Transactional
  public void delete(Long propertyId, Long revisionCount) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROPERTY_DEL, 2);

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
          PROC_PROPERTY_DEL,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  private PropertyUpdateResult executeUpdate(PropertyRecord record, PropertyUpdateParams params, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROPERTY_UPD, 33);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<PropertyUpdateResult>) cs -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setLong(1, record.propertyId());
            setLongOrNull(cs, 2, params.revisionCount());
            setOptionalIndicator(cs, 3, params.expropriationRecommended());
            setLongOrNull(cs, 4, record.projectId());
            setStringOrNull(cs, 5, params.titleNumber());
            setStringOrNull(cs, 6, params.legalDescription());
            setStringOrNull(cs, 7, params.parcelIdentifier());
            setBigDecimalOrNull(cs, 8, params.parcelArea());
            setBigDecimalOrNull(cs, 9, params.projectArea());
            setStringOrNull(cs, 10, params.parcelAddress());
            setStringOrNull(cs, 11, params.city());
            setBigDecimalOrNull(cs, 12, params.assessedValue());
            setStringOrNull(cs, 13, params.landTitleOfficeCode());
            setStringOrNull(cs, 14, params.electoralDistrictCode());
            setStringOrNull(cs, 15, params.acquisitionCode());
            setLongOrNull(cs, 16, params.orgUnitNumber());
            // Preserve existing milestone values
            setDateOrNull(cs, 17, record.ownerContactDate());
            setDateOrNull(cs, 18, record.internalAppraisalDate());
            setDateOrNull(cs, 19, record.roadValueRequestDate());
            setDateOrNull(cs, 20, record.roadValueReceivedDate());
            setDateOrNull(cs, 21, record.fundingRequestDate());
            setDateOrNull(cs, 22, record.fundingApprovedDate());
            setDateOrNull(cs, 23, record.surveyRequestDate());
            setDateOrNull(cs, 24, record.surveyReceivedDate());
            setStringOrNull(cs, 25, record.assessmentComment());
            setDateOrNull(cs, 26, record.feeAppraisalReceiveDate());
            setDateOrNull(cs, 27, record.feeAppraisalRequestDate());
            setDateOrNull(cs, 28, record.offerDate());
            setStringOrNull(cs, 29, record.negotiationComment());
            setDateOrNull(cs, 30, record.offerAcceptDate());
            setDateOrNull(cs, 31, record.completeDate());
            setStringOrNull(cs, 32, record.acquisitionComment());
            setStringOrNull(cs, 33, userId);
            cs.execute();
            Long id = cs.getObject(1, Long.class);
            Long revision = cs.getObject(2, Long.class);
            return new PropertyUpdateResult(id, revision);
          });
    } catch (DataAccessException e) {
      LOGGER.error(
          "{} failed for package {}: {}",
          PROC_PROPERTY_UPD,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  private PropertyUpdateResult executeMilestoneUpdate(PropertyRecord record, PropertyMilestoneParams params, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROPERTY_UPD, 33);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<PropertyUpdateResult>) cs -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setLong(1, record.propertyId());
            setLongOrNull(cs, 2, params.revisionCount());
            setOptionalIndicator(cs, 3, params.expropriationRecommended());
            setLongOrNull(cs, 4, record.projectId());
            // Preserve existing detail values
            setStringOrNull(cs, 5, record.titleNumber());
            setStringOrNull(cs, 6, record.legalDescription());
            setStringOrNull(cs, 7, record.parcelIdentifier());
            setBigDecimalOrNull(cs, 8, record.parcelArea());
            setBigDecimalOrNull(cs, 9, record.projectArea());
            setStringOrNull(cs, 10, record.parcelAddress());
            setStringOrNull(cs, 11, record.city());
            setBigDecimalOrNull(cs, 12, record.assessedValue());
            setStringOrNull(cs, 13, record.landTitleOfficeCode());
            setStringOrNull(cs, 14, record.electoralDistrictCode());
            setStringOrNull(cs, 15, record.propertyAcquisitionCode());
            setLongOrNull(cs, 16, record.orgUnitNumber());
            // Update milestone values from params
            setDateOrNull(cs, 17, params.ownerContactDate());
            setDateOrNull(cs, 18, params.internalAppraisalDate());
            setDateOrNull(cs, 19, params.roadValueRequestedDate());
            setDateOrNull(cs, 20, params.roadValueReceivedDate());
            setDateOrNull(cs, 21, params.fundingRequestedDate());
            setDateOrNull(cs, 22, params.fundingApprovedDate());
            setDateOrNull(cs, 23, params.surveyRequestedDate());
            setDateOrNull(cs, 24, params.surveyReceivedDate());
            setStringOrNull(cs, 25, params.assessmentComment());
            setDateOrNull(cs, 26, params.feeAppraisalReceivedDate());
            setDateOrNull(cs, 27, params.feeAppraisalRequestedDate());
            setDateOrNull(cs, 28, params.offerDate());
            setStringOrNull(cs, 29, params.negotiationComment());
            setDateOrNull(cs, 30, params.offerAcceptedDate());
            setDateOrNull(cs, 31, params.completionDate());
            setStringOrNull(cs, 32, params.acquisitionComment());
            setStringOrNull(cs, 33, userId);
            cs.execute();
            Long id = cs.getObject(1, Long.class);
            Long revision = cs.getObject(2, Long.class);
            return new PropertyUpdateResult(id, revision);
          });
    } catch (DataAccessException e) {
      LOGGER.error(
          "{} failed for package {}: {}",
          PROC_PROPERTY_UPD,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  private List<ReptPropertyOptionsDto.OrgUnitOption> loadForestDistricts() {
    final String call = qualifyCodeListProcedure(PROC_FOREST_DISTRICTS, 1);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<List<ReptPropertyOptionsDto.OrgUnitOption>>) cs -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setTimestamp(2, new java.sql.Timestamp(System.currentTimeMillis()));
            cs.execute();
            ResultSet rs = (ResultSet) cs.getObject(1);
            List<ReptPropertyOptionsDto.OrgUnitOption> results = new ArrayList<>();
            if (rs == null) {
              return results;
            }
            try (rs) {
              while (rs.next()) {
                // Legacy code reads by position: column 1 = org unit no (string), column 2 = display name
                String orgUnitNoStr = trim(rs.getString(1));
                String displayName = trim(rs.getString(2));
                if (orgUnitNoStr != null && !orgUnitNoStr.isBlank()) {
                  try {
                    Long orgUnitNo = Long.parseLong(orgUnitNoStr);
                    results.add(new ReptPropertyOptionsDto.OrgUnitOption(orgUnitNo, null, displayName));
                  } catch (NumberFormatException e) {
                    LOGGER.warn("Invalid org unit number in forest district list: {}", orgUnitNoStr);
                  }
                }
              }
            }
            return results;
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} lookup failed for package {}: {}",
          PROC_FOREST_DISTRICTS,
          codeListPackage,
          e.getMessage(),
          e);
      return List.of();
    }
  }

  private String qualifyCodeListProcedure(String procedureName, int inputParameters) {
    if (inputParameters < 1) {
      throw new IllegalArgumentException("inputParameters must be >= 1");
    }
    StringBuilder builder = new StringBuilder();
    builder.append("{? = call ")
        .append(codeListPackage)
        .append('.')
        .append(procedureName)
        .append('(')
        .append('?');
    for (int i = 1; i < inputParameters; i++) {
      builder.append(',').append('?');
    }
    builder.append(")}");
    return builder.toString();
  }

  protected void setBigDecimalOrNull(CallableStatement cs, int index, BigDecimal value)
      throws java.sql.SQLException {
    if (value == null) {
      cs.setNull(index, Types.NUMERIC);
    } else {
      cs.setBigDecimal(index, value);
    }
  }

  private Optional<PropertyRecord> loadPropertyRecord(Long propertyId) {
    if (propertyId == null) {
      return Optional.empty();
    }

    CodeLookups lookups = loadCodeLookups();
    Map<Long, OrgUnitInfo> orgUnitCache = new HashMap<>();

    final String qualifiedCall = qualifyProjectProcedure(PROC_PROPERTY_GET);

    try {
      return jdbcTemplate.execute(
          qualifiedCall,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, propertyId);
            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return Optional.empty();
            }

            try (rs) {
              if (!rs.next()) {
                return Optional.empty();
              }
              PropertyRecord record = mapProperty(rs, lookups, orgUnitCache);
              return Optional.of(record);
            }
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_GET,
          projectPackage,
          e.getMessage(),
          e);
      return Optional.empty();
    }
  }

  private PropertyRecord mapProperty(
      ResultSet rs, CodeLookups lookups, Map<Long, OrgUnitInfo> orgUnitCache)
      throws java.sql.SQLException {
    Long propertyId = rs.getObject("PROJECT_PROPERTY_ID", Long.class);
    Long projectId = rs.getObject("REPT_PROJECT_ID", Long.class);
    String titleNumber = trim(rs.getString("TITLE_NUMBER"));
    String legalDescription = rs.getString("LEGAL_DESCRIPTION");
    String parcelIdentifier = trim(rs.getString("PARCEL_IDENTIFIER"));
    BigDecimal parcelArea = rs.getBigDecimal("PARCEL_AREA");
    BigDecimal projectArea = rs.getBigDecimal("PROJECT_AREA");
    String parcelAddress = rs.getString("PARCEL_ADDRESS");
    String city = rs.getString("CITY");
    BigDecimal assessedValue = rs.getBigDecimal("ASSESSED_VALUE_AMOUNT");
    String landTitleOfficeCode = trim(rs.getString("LAND_TITLE_OFFICE_CODE"));
    String landTitleOfficeLabel = resolveLabel(lookups.landTitleOffices(), landTitleOfficeCode);
    String electoralDistrictCode = trim(rs.getString("ELECTORAL_DISTRICT_CODE"));
    String electoralDistrictLabel = resolveLabel(lookups.electoralDistricts(), electoralDistrictCode);
    String propertyAcquisitionCode = trim(rs.getString("PROPERTY_ACQUISITION_CODE"));
    String propertyAcquisitionLabel = resolveLabel(lookups.propertyAcquisition(), propertyAcquisitionCode);
    Long orgUnitNumber = rs.getObject("ORG_UNIT_NO", Long.class);
    OrgUnitInfo orgUnit = resolveOrgUnit(orgUnitNumber, orgUnitCache);

    Date ownerContactRaw = rs.getDate("OWNER_CONTACT_DATE");
    Date internalAppraisalRaw = rs.getDate("INTERNAL_APPRAISAL_DATE");
    Date roadValueRequestRaw = rs.getDate("ROAD_VALUE_REQUEST_DATE");
    Date roadValueReceivedRaw = rs.getDate("ROAD_VALUE_RECEIVED_DATE");
    Date fundingRequestRaw = rs.getDate("FUNDING_REQUEST_DATE");
    Date fundingApprovedRaw = rs.getDate("FUNDING_APPROVED_DATE");
    Date surveyRequestRaw = rs.getDate("SURVEY_REQUEST_DATE");
    Date surveyReceivedRaw = rs.getDate("SURVEY_RECEIVED_DATE");
    String assessmentComment = rs.getString("ASSESSMENT_COMMENT");
    Date feeAppraisalReceiveRaw = rs.getDate("FEE_APPRAISAL_RECEIVE_DATE");
    Date feeAppraisalRequestRaw = rs.getDate("FEE_APPRAISAL_REQUEST_DATE");
    Date offerDateRaw = rs.getDate("OFFER_DATE");
    String negotiationComment = rs.getString("NEGOTIATION_COMMENT");
    Date offerAcceptRaw = rs.getDate("OFFER_ACCEPT_DATE");
    Date completeDateRaw = rs.getDate("COMPLETE_DATE");
    String acquisitionComment = rs.getString("ACQUISITION_COMMENT");
    String exproIndicator = rs.getString("EXPROPRIATION_RECOMMENDED_IND");
    Boolean expropriationRecommended = toBooleanIndicator(exproIndicator);
    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);

    return new PropertyRecord(
        propertyId,
        projectId,
        titleNumber,
        legalDescription,
        parcelIdentifier,
        parcelArea,
        projectArea,
        parcelAddress,
        city,
        assessedValue,
        landTitleOfficeCode,
        landTitleOfficeLabel,
        electoralDistrictCode,
        electoralDistrictLabel,
        propertyAcquisitionCode,
        propertyAcquisitionLabel,
        orgUnitNumber,
        orgUnit != null ? orgUnit.code() : null,
        orgUnit != null ? orgUnit.name() : null,
        toLocalDate(ownerContactRaw),
        toLocalDate(internalAppraisalRaw),
        toLocalDate(roadValueRequestRaw),
        toLocalDate(roadValueReceivedRaw),
        toLocalDate(fundingRequestRaw),
        toLocalDate(fundingApprovedRaw),
        toLocalDate(surveyRequestRaw),
        toLocalDate(surveyReceivedRaw),
        assessmentComment,
        toLocalDate(feeAppraisalRequestRaw),
        toLocalDate(feeAppraisalReceiveRaw),
        toLocalDate(offerDateRaw),
        negotiationComment,
        toLocalDate(offerAcceptRaw),
        toLocalDate(completeDateRaw),
        acquisitionComment,
        expropriationRecommended,
        revisionCount);
  }

  private ReptPropertySummaryDto toSummaryDto(PropertyRecord record) {
    return new ReptPropertySummaryDto(
        record.propertyId(),
        record.titleNumber(),
        record.parcelIdentifier(),
        record.legalDescription(),
        record.parcelAddress(),
        record.city(),
        record.propertyAcquisitionCode(),
        record.propertyAcquisitionLabel(),
        record.landTitleOfficeCode(),
        record.landTitleOfficeLabel(),
        record.parcelArea(),
        record.projectArea(),
        record.assessedValue(),
        record.expropriationRecommended(),
        record.revisionCount());
  }

  private ReptPropertyDetailDto toDetailDto(PropertyRecord record) {
    return new ReptPropertyDetailDto(
        record.propertyId(),
        record.projectId(),
        record.titleNumber(),
        record.parcelIdentifier(),
        record.legalDescription(),
        record.parcelAddress(),
        record.city(),
        record.parcelArea(),
        record.projectArea(),
        record.assessedValue(),
        record.propertyAcquisitionCode(),
        record.propertyAcquisitionLabel(),
        record.landTitleOfficeCode(),
        record.landTitleOfficeLabel(),
        record.electoralDistrictCode(),
        record.electoralDistrictLabel(),
        record.orgUnitNumber(),
        record.orgUnitCode(),
        record.orgUnitName(),
        record.expropriationRecommended(),
        record.revisionCount());
  }

  private ReptPropertyMilestoneDto toMilestoneDto(PropertyRecord record) {
    return new ReptPropertyMilestoneDto(
        record.revisionCount,
        record.ownerContactDate(),
        record.internalAppraisalDate(),
        record.roadValueRequestDate(),
        record.roadValueReceivedDate(),
        record.fundingRequestDate(),
        record.fundingApprovedDate(),
        record.surveyRequestDate(),
        record.surveyReceivedDate(),
        record.assessmentComment(),
        record.feeAppraisalRequestDate(),
        record.feeAppraisalReceiveDate(),
        record.offerDate(),
        record.negotiationComment(),
        record.offerAcceptDate(),
        record.completeDate(),
        record.acquisitionComment(),
        record.expropriationRecommended());
  }

  private CodeLookups loadCodeLookups() {
    Map<String, String> acquisition = loadCodeList(PROC_PROPERTY_ACQ_CODES);
    Map<String, String> landTitle = loadCodeList(PROC_LTO_CODES);
    Map<String, String> electoral = loadCodeList(PROC_ELECTORAL_CODES);
    return new CodeLookups(acquisition, landTitle, electoral);
  }

  private OrgUnitInfo resolveOrgUnit(Long orgUnitNumber, Map<Long, OrgUnitInfo> cache) {
    if (orgUnitNumber == null) {
      return null;
    }
    OrgUnitInfo cached = cache.get(orgUnitNumber);
    if (cached != null) {
      return cached;
    }

    final String qualifiedCall = qualifyProjectProcedure(PROC_ORG_UNIT_GET);

    try {
      OrgUnitInfo loaded =
          jdbcTemplate.execute(
              qualifiedCall,
              (CallableStatement cs) -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                cs.setLong(2, orgUnitNumber);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return null;
                }
                try (rs) {
                  if (!rs.next()) {
                    return null;
                  }
                  Long number = rs.getObject("ORG_UNIT_NO", Long.class);
                  String code = trim(rs.getString("ORG_UNIT_CODE"));
                  String name = trim(rs.getString("ORG_UNIT_NAME"));
                  return new OrgUnitInfo(number, code, name);
                }
              });
      if (loaded != null) {
        cache.put(orgUnitNumber, loaded);
      }
      return loaded;
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} lookup failed for package {}: {}",
          PROC_ORG_UNIT_GET,
          projectPackage,
          e.getMessage(),
          e);
      return null;
    }
  }

  private String resolveLabel(Map<String, String> map, String key) {
    if (key == null || key.isBlank()) {
      return null;
    }
    return map.getOrDefault(key, key);
  }

  private Boolean toBooleanIndicator(String indicator) {
    if (indicator == null) {
      return null;
    }
    String normalized = indicator.trim();
    if (normalized.isEmpty()) {
      return null;
    }
    return switch (normalized.toLowerCase()) {
      case "y", "yes", "true", "1", "t", "on" -> Boolean.TRUE;
      case "n", "no", "false", "0", "f", "off" -> Boolean.FALSE;
      default -> null;
    };
  }

  private int compareSafe(String left, String right) {
    if (left == null && right == null) {
      return 0;
    }
    if (left == null) {
      return 1;
    }
    if (right == null) {
      return -1;
    }
    return left.compareToIgnoreCase(right);
  }

  private record CodeLookups(
      Map<String, String> propertyAcquisition,
      Map<String, String> landTitleOffices,
      Map<String, String> electoralDistricts) {}

  private record OrgUnitInfo(Long number, String code, String name) {}

  private record PropertyRecord(
      Long propertyId,
      Long projectId,
      String titleNumber,
      String legalDescription,
      String parcelIdentifier,
      BigDecimal parcelArea,
      BigDecimal projectArea,
      String parcelAddress,
      String city,
      BigDecimal assessedValue,
      String landTitleOfficeCode,
      String landTitleOfficeLabel,
      String electoralDistrictCode,
      String electoralDistrictLabel,
      String propertyAcquisitionCode,
      String propertyAcquisitionLabel,
      Long orgUnitNumber,
      String orgUnitCode,
      String orgUnitName,
      LocalDate ownerContactDate,
      LocalDate internalAppraisalDate,
      LocalDate roadValueRequestDate,
      LocalDate roadValueReceivedDate,
      LocalDate fundingRequestDate,
      LocalDate fundingApprovedDate,
      LocalDate surveyRequestDate,
      LocalDate surveyReceivedDate,
      String assessmentComment,
      LocalDate feeAppraisalRequestDate,
      LocalDate feeAppraisalReceiveDate,
      LocalDate offerDate,
      String negotiationComment,
      LocalDate offerAcceptDate,
      LocalDate completeDate,
      String acquisitionComment,
      Boolean expropriationRecommended,
      Long revisionCount) {}

  /** Input parameters for inserting a new property. */
  public record PropertyInsertParams(
      Long projectId,
      String titleNumber,
      String parcelIdentifier,
      String legalDescription,
      String parcelAddress,
      String city,
      BigDecimal parcelArea,
      BigDecimal projectArea,
      BigDecimal assessedValue,
      String acquisitionCode,
      String landTitleOfficeCode,
      String electoralDistrictCode,
      Long orgUnitNumber,
      Boolean expropriationRecommended) {}

  /** Result of property insert operation. */
  public record PropertyInsertResult(Long id, Long revisionCount) {}

  /** Input parameters for updating property details. */
  public record PropertyUpdateParams(
      Long revisionCount,
      String titleNumber,
      String parcelIdentifier,
      String legalDescription,
      String parcelAddress,
      String city,
      BigDecimal parcelArea,
      BigDecimal projectArea,
      BigDecimal assessedValue,
      String acquisitionCode,
      String landTitleOfficeCode,
      String electoralDistrictCode,
      Long orgUnitNumber,
      Boolean expropriationRecommended) {}

  /** Input parameters for updating property milestones. */
  public record PropertyMilestoneParams(
      Long revisionCount,
      LocalDate ownerContactDate,
      LocalDate internalAppraisalDate,
      LocalDate roadValueRequestedDate,
      LocalDate roadValueReceivedDate,
      LocalDate fundingRequestedDate,
      LocalDate fundingApprovedDate,
      LocalDate surveyRequestedDate,
      LocalDate surveyReceivedDate,
      String assessmentComment,
      LocalDate feeAppraisalRequestedDate,
      LocalDate feeAppraisalReceivedDate,
      LocalDate offerDate,
      String negotiationComment,
      LocalDate offerAcceptedDate,
      LocalDate completionDate,
      String acquisitionComment,
      Boolean expropriationRecommended) {}

  /** Result of property update operation. */
  public record PropertyUpdateResult(Long id, Long revisionCount) {}
}
