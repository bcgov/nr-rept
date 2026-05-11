package ca.bc.gov.nrs.hrs.repository.rept;

import ca.bc.gov.nrs.hrs.dto.rept.ReptAgreementDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptAgreementPayeeDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptAgreementPaymentDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptAgreementPaymentTaxRateDto;
import ca.bc.gov.nrs.hrs.dto.rept.ReptAgreementPropertyDto;
import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
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
public class ReptAgreementRepository extends AbstractReptRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptAgreementRepository.class);

  private static final String PROC_AGREEMENT_FIND = "REPT_AGREEMENT_FIND";
  private static final String PROC_AGREEMENT_GET = "REPT_AGREEMENT_GET";
  private static final String PROC_AGREEMENT_UPDATE = "REPT_AGREEMENT_UPD";
  private static final String PROC_AGREEMENT_INS = "REPT_AGREEMENT_INS";
  private static final String PROC_PROPERTY_AGREEMENT_FIND = "PPA_FIND_BY_AGREEMENT";
  private static final String PROC_PROPERTY_AGREEMENT_INSERT = "PROJECT_PROPERTY_AGREEMENT_INS";
  private static final String PROC_PROPERTY_AGREEMENT_DELETE = "PROJECT_PROPERTY_AGREEMENT_DEL";
  private static final String PROC_PAYMENT_FIND = "REPT_AGREEMENT_PAYMENT_FIND";
  private static final String PROC_PAYMENT_INSERT = "REPT_AGREEMENT_PAYMENT_INS";
  private static final String PROC_PAYMENT_GET = "REPT_AGREEMENT_PAYMENT_GET";
  private static final String PROC_PAYEE_FIND = "PAYEE_FIND_BY_PAYMENT";
  private static final String PROC_PAYEE_INSERT = "REPT_AGREE_PAYMENT_PAYEE_INS";
  private static final String PROC_PROPERTY_GET = "PROJECT_PROPERTY_GET";
  private static final String PROC_PROPERTY_CONTACT_GET = "PROJECT_PROPERTY_CONTACT_GET";
  private static final String PROC_CONTACT_GET = "REPT_CONTACT_GET";
  private static final String PROC_TAX_RATE_GET = "GST_VALUE";
  private static final String PROC_TAX_RATE_FIND = "GST_FIND";

  private static final String PROC_ACQUISITION_CODES = "ACQUISITION_AGREEMENT_CODE_LST";
  private static final String PROC_DISPOSITION_CODES = "DISPOSITION_AGREEMENT_CODE_LST";
  private static final String PROC_CO_USER_CODES = "CO_USER_LST";
  private static final String PROC_PROPERTY_ACQ_CODES = "PROPERTY_ACQUISITION_CODE_LST";
  private static final String PROC_LTO_CODES = "LAND_TITLE_OFFICE_CODE_LST";
  private static final String PROC_PAYMENT_TERM_CODES = "PAYMENT_TERM_TYPE_CODE_LST";
  private static final String PROC_PAYMENT_TYPE_CODES = "REPT_PAYMENT_TYPE_CODE_LST";
  private static final String PROC_EXPENSE_AUTH_CODES = "REPT_EXPENSE_AUTH_CODE_LST";
  private static final String PROC_QUALIFIED_RECEIVER_CODES = "REPT_QUALIFIEDR_CODE_LST";
  private static final String PROC_CONTACT_TYPE_CODES = "REPT_CONTACT_TYPE_CODE_LST";

  public ReptAgreementRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public List<ReptAgreementDto> findAgreements(Long projectId) {
    if (projectId == null) {
      return List.of();
    }

    Map<String, String> acquisitionCodes = loadCodeList(PROC_ACQUISITION_CODES);
    Map<String, String> dispositionCodes = loadCodeList(PROC_DISPOSITION_CODES);
    Map<String, String> coUserCodes = loadCodeList(PROC_CO_USER_CODES);

    List<AgreementRecord> records = new ArrayList<>();
    final String call = qualifyProjectProcedure(PROC_AGREEMENT_FIND);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Void>)
              cs -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                cs.setLong(2, projectId);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return null;
                }

                try (rs) {
                  while (rs.next()) {
                    records.add(mapAgreementRecord(rs));
                  }
                }
                return null;
              });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_AGREEMENT_FIND,
          projectPackage,
          e.getMessage(),
          e);
      return List.of();
    }

    return records.stream()
        .filter(record -> Objects.equals(record.projectId(), projectId))
        .map(record -> toAgreementDto(record, acquisitionCodes, dispositionCodes, coUserCodes))
        .toList();
  }

  @Transactional(readOnly = true)
  public Optional<ReptAgreementDto> findAgreement(Long projectId, Long agreementId) {
    if (projectId == null || agreementId == null) {
      return Optional.empty();
    }

    Map<String, String> acquisitionCodes = loadCodeList(PROC_ACQUISITION_CODES);
    Map<String, String> dispositionCodes = loadCodeList(PROC_DISPOSITION_CODES);
    Map<String, String> coUserCodes = loadCodeList(PROC_CO_USER_CODES);

    return loadAgreementRecord(agreementId)
        .filter(record -> Objects.equals(record.projectId(), projectId))
        .map(record -> toAgreementDto(record, acquisitionCodes, dispositionCodes, coUserCodes));
  }

  @Transactional(readOnly = true)
  public boolean agreementBelongsToProject(Long projectId, Long agreementId) {
    if (projectId == null || agreementId == null) {
      return false;
    }
    return loadAgreementRecord(agreementId)
        .map(record -> Objects.equals(record.projectId(), projectId))
        .orElse(false);
  }

  @Transactional(readOnly = true)
  public List<ReptAgreementPropertyDto> findAgreementProperties(Long projectId, Long agreementId) {
    if (projectId == null || agreementId == null) {
      return List.of();
    }

    Map<String, String> acquisitionCodes = loadCodeList(PROC_PROPERTY_ACQ_CODES);
    Map<String, String> ltoCodes = loadCodeList(PROC_LTO_CODES);
    Map<Long, PropertyInfo> propertyCache = new HashMap<>();
    List<ReptAgreementPropertyDto> results = new ArrayList<>();
    final String call = qualifyProjectProcedure(PROC_PROPERTY_AGREEMENT_FIND);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Void>)
              cs -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                cs.setLong(2, agreementId);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return null;
                }

                try (rs) {
                  while (rs.next()) {
                    Long associationId = rs.getObject("PROJECT_PROPERTY_AGREEMENT_ID", Long.class);
                    Long propertyId = rs.getObject("PROJECT_PROPERTY_ID", Long.class);
                    PropertyInfo property =
                        loadProperty(propertyId, propertyCache, acquisitionCodes, ltoCodes);
                    if (property == null || !Objects.equals(property.projectId(), projectId)) {
                      continue;
                    }
                    results.add(
                        new ReptAgreementPropertyDto(
                            associationId,
                            property.id(),
                            property.parcelIdentifier(),
                            property.titleNumber(),
                            property.legalDescription(),
                            property.acquisitionCode(),
                            property.acquisitionLabel(),
                            property.landTitleOfficeCode(),
                            property.landTitleOfficeLabel()));
                  }
                }
                return null;
              });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_AGREEMENT_FIND,
          projectPackage,
          e.getMessage(),
          e);
      return List.of();
    }

    results.sort(
        Comparator.comparing(
            ReptAgreementPropertyDto::parcelIdentifier,
            Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));
    return List.copyOf(results);
  }

  @Transactional(readOnly = true)
  public List<PropertyAssociationLink> findPropertyAssociationLinks(Long agreementId) {
    if (agreementId == null) {
      return List.of();
    }

    List<PropertyAssociationLink> results = new ArrayList<>();
    final String call = qualifyProjectProcedure(PROC_PROPERTY_AGREEMENT_FIND);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Void>)
              cs -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                cs.setLong(2, agreementId);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return null;
                }

                try (rs) {
                  while (rs.next()) {
                    Long associationId = rs.getObject("PROJECT_PROPERTY_AGREEMENT_ID", Long.class);
                    Long propertyId = rs.getObject("PROJECT_PROPERTY_ID", Long.class);
                    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);
                    if (associationId == null || propertyId == null) {
                      continue;
                    }
                    results.add(new PropertyAssociationLink(associationId, propertyId, revisionCount));
                  }
                }
                return null;
              });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_AGREEMENT_FIND,
          projectPackage,
          e.getMessage(),
          e);
      return List.of();
    }

    return List.copyOf(results);
  }

  @Transactional
  public Long createPropertyAssociation(Long agreementId, Long propertyId, String userId) {
    if (agreementId == null || propertyId == null) {
      return null;
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROPERTY_AGREEMENT_INSERT, 5);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setNull(1, Types.NUMERIC);
            cs.setNull(2, Types.NUMERIC);
            cs.setLong(3, propertyId);
            cs.setLong(4, agreementId);
            String normalizedUserId = trim(userId);
            if (normalizedUserId == null) {
              cs.setNull(5, Types.VARCHAR);
            } else {
              cs.setString(5, normalizedUserId);
            }

            cs.execute();
            return cs.getObject(1, Long.class);
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_AGREEMENT_INSERT,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  @Transactional
  public void deletePropertyAssociation(Long associationId, Long revisionCount) {
    if (associationId == null || revisionCount == null) {
      return;
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROPERTY_AGREEMENT_DELETE, 2);
    try {
      jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            cs.setLong(1, associationId);
            cs.setLong(2, revisionCount);
            cs.execute();
            return null;
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_AGREEMENT_DELETE,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  @Transactional(readOnly = true)
  public List<ReptAgreementPaymentDto> findAgreementPayments(Long projectId, Long agreementId) {
    if (projectId == null || agreementId == null) {
      return List.of();
    }

    Map<String, String> paymentTermCodes = loadCodeList(PROC_PAYMENT_TERM_CODES);
    Map<String, String> paymentTypeCodes = loadCodeList(PROC_PAYMENT_TYPE_CODES);
    Map<String, String> expenseAuthorityCodes = loadCodeList(PROC_EXPENSE_AUTH_CODES);
    Map<String, String> qualifiedReceiverCodes = loadCodeList(PROC_QUALIFIED_RECEIVER_CODES);
    Map<String, String> contactTypeCodes = loadCodeList(PROC_CONTACT_TYPE_CODES);
    Map<String, String> propertyAcquisitionCodes = loadCodeList(PROC_PROPERTY_ACQ_CODES);
    Map<String, String> landTitleCodes = loadCodeList(PROC_LTO_CODES);

    Map<Long, PropertyInfo> propertyCache = new HashMap<>();
    Map<Long, ContactInfo> contactCache = new HashMap<>();
    Map<Long, PropertyContactRecord> propertyContactCache = new HashMap<>();
    Map<Long, BigDecimal> taxRateCache = new HashMap<>();
    List<ReptAgreementPaymentDto> results = new ArrayList<>();

    final String call = qualifyProjectProcedure(PROC_PAYMENT_FIND);
    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Void>)
              cs -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                cs.setLong(2, agreementId);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return null;
                }

                try (rs) {
                  while (rs.next()) {
                    PaymentRecord record = mapPaymentRecord(rs);
                    List<ReptAgreementPayeeDto> payees =
                        loadPayees(
                            record.id(),
                            projectId,
                            propertyCache,
                            contactCache,
                            propertyContactCache,
                            propertyAcquisitionCodes,
                            landTitleCodes,
                            contactTypeCodes);
                    BigDecimal taxRatePercent = loadTaxRatePercent(record.taxRateId(), taxRateCache);
                    results.add(
                        toPaymentDto(
                            record,
                            paymentTermCodes,
                            paymentTypeCodes,
                            expenseAuthorityCodes,
                            qualifiedReceiverCodes,
                            taxRatePercent,
                            payees));
                  }
                }
                return null;
              });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PAYMENT_FIND,
          projectPackage,
          e.getMessage(),
          e);
      return List.of();
    }

    results.sort((left, right) -> compareDatesDesc(left.requestDate(), right.requestDate()));
    return List.copyOf(results);
  }

  @Transactional(readOnly = true)
  public Optional<ReptAgreementPaymentDto> findAgreementPayment(
      Long projectId, Long agreementId, Long paymentId) {
    if (projectId == null || agreementId == null || paymentId == null) {
      return Optional.empty();
    }

    Optional<PaymentRecord> recordOptional = loadPaymentRecord(paymentId);
    if (recordOptional.isEmpty()) {
      return Optional.empty();
    }

    PaymentRecord record = recordOptional.get();
    if (!Objects.equals(record.agreementId(), agreementId)) {
      return Optional.empty();
    }

    Map<String, String> paymentTermCodes = loadCodeList(PROC_PAYMENT_TERM_CODES);
    Map<String, String> paymentTypeCodes = loadCodeList(PROC_PAYMENT_TYPE_CODES);
    Map<String, String> expenseAuthorityCodes = loadCodeList(PROC_EXPENSE_AUTH_CODES);
    Map<String, String> qualifiedReceiverCodes = loadCodeList(PROC_QUALIFIED_RECEIVER_CODES);
    Map<String, String> contactTypeCodes = loadCodeList(PROC_CONTACT_TYPE_CODES);
    Map<String, String> propertyAcquisitionCodes = loadCodeList(PROC_PROPERTY_ACQ_CODES);
    Map<String, String> landTitleCodes = loadCodeList(PROC_LTO_CODES);

    Map<Long, PropertyInfo> propertyCache = new HashMap<>();
    Map<Long, ContactInfo> contactCache = new HashMap<>();
    Map<Long, PropertyContactRecord> propertyContactCache = new HashMap<>();
    Map<Long, BigDecimal> taxRateCache = new HashMap<>();

    List<ReptAgreementPayeeDto> payees =
        loadPayees(
            paymentId,
            projectId,
            propertyCache,
            contactCache,
            propertyContactCache,
            propertyAcquisitionCodes,
            landTitleCodes,
            contactTypeCodes);
    BigDecimal taxRatePercent = loadTaxRatePercent(record.taxRateId(), taxRateCache);

    return Optional.of(
        toPaymentDto(
            record,
            paymentTermCodes,
            paymentTypeCodes,
            expenseAuthorityCodes,
            qualifiedReceiverCodes,
            taxRatePercent,
            payees));
  }

  @Transactional
  public Long createAgreementPayment(PaymentCreateCommand command) {
    if (command == null || command.agreementId() == null) {
      return null;
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_PAYMENT_INSERT, 20);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setNull(1, Types.NUMERIC);
            cs.setNull(2, Types.NUMERIC);
            setIndicator(cs, 3, command.rescinded());
            setLongOrNull(cs, 4, command.agreementId());
            setDateOrNull(cs, 5, command.requestDate());
            if (command.amount() == null) {
              cs.setNull(6, Types.NUMERIC);
            } else {
              cs.setBigDecimal(6, command.amount());
            }
            setStringOrNull(cs, 7, command.paymentTermTypeCode());
            setStringOrNull(cs, 8, command.paymentTypeCode());
            setStringOrNull(cs, 9, command.processingInstructions());
            setStringOrNull(cs, 10, command.casClient());
            setStringOrNull(cs, 11, command.casResponsibilityCentre());
            setStringOrNull(cs, 12, command.casServiceLine());
            setStringOrNull(cs, 13, command.casStob());
            setStringOrNull(cs, 14, command.casProjectNumber());
            if (command.gstAmount() == null) {
              cs.setNull(15, Types.NUMERIC);
            } else {
              cs.setBigDecimal(15, command.gstAmount());
            }
            if (command.totalAmount() == null) {
              cs.setNull(16, Types.NUMERIC);
            } else {
              cs.setBigDecimal(16, command.totalAmount());
            }
            setLongOrNull(cs, 17, command.taxRateId());
            setStringOrNull(cs, 18, command.userId());
            setStringOrNull(cs, 19, command.expenseAuthorityCode());
            setStringOrNull(cs, 20, command.qualifiedReceiverCode());

            cs.execute();
            return cs.getObject(1, Long.class);
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PAYMENT_INSERT,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  @Transactional
  public void addPayeeToPayment(Long paymentId, Long propertyContactId, String userId) {
    if (paymentId == null || propertyContactId == null) {
      return;
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_PAYEE_INSERT, 5);
    try {
      jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setNull(1, Types.NUMERIC);
            cs.setNull(2, Types.NUMERIC);
            cs.setLong(3, paymentId);
            cs.setLong(4, propertyContactId);
            setStringOrNull(cs, 5, userId);
            cs.execute();
            return null;
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PAYEE_INSERT,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  /**
   * Creates a new agreement record and returns its generated ID.
   * Calls the REPT_AGREEMENT_INS stored procedure, which uses params 1+2 as INOUT:
   * pass 0 for both and receive the generated agreement-id and initial revision-count.
   */
  @Transactional
  public Long createAgreement(AgreementCreateCommand command) {
    if (command == null) {
      return null;
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_AGREEMENT_INS, 16);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            // params 1 and 2 are INOUT: pass 0, receive generated id / revision-count
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);

            cs.setLong(1, 0L); // REPT_AGREEMENT_ID – 0 signals INSERT
            cs.setLong(2, 0L); // REVISION_COUNT
            setIndicator(cs, 3, command.active());
            cs.setLong(4, command.projectId());
            setStringOrNull(cs, 5, command.acquisitionAgreementCode());
            setStringOrNull(cs, 6, command.dispositionAgreementCode());
            setStringOrNull(cs, 7, command.paymentTerms());
            setLongOrNull(cs, 8, command.agreementTerm());
            setDateOrNull(cs, 9, command.expiryDate());
            setDateOrNull(cs, 10, command.bringForwardDate());
            setDateOrNull(cs, 11, command.anniversaryDate());
            setDateOrNull(cs, 12, command.renegotiationDate());
            setStringOrNull(cs, 13, command.lessorsFile());
            setStringOrNull(cs, 14, command.commitmentDescription());
            setLongOrNull(cs, 15, command.coUserId());
            setStringOrNull(cs, 16, command.userId());

            cs.execute();
            // Param 1 returns the newly assigned agreement ID
            return cs.getObject(1, Long.class);
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_AGREEMENT_INS,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  /**
   * Loads the acquisition and disposition code lists used when creating a new agreement.
   */
  @Transactional(readOnly = true)
  public Map<String, String>[] loadAgreementCodeLists() {
    Map<String, String> acquisitionCodes = loadCodeList(PROC_ACQUISITION_CODES);
    Map<String, String> dispositionCodes = loadCodeList(PROC_DISPOSITION_CODES);
    @SuppressWarnings("unchecked")
    Map<String, String>[] result = new Map[]{acquisitionCodes, dispositionCodes};
    return result;
  }

  @Transactional(readOnly = true)
  public PaymentReferenceData loadPaymentReferenceData() {
    Map<String, String> paymentTypes = loadCodeList(PROC_PAYMENT_TYPE_CODES);
    Map<String, String> paymentTerms = loadCodeList(PROC_PAYMENT_TERM_CODES);
    Map<String, String> expenseAuthorities = loadCodeList(PROC_EXPENSE_AUTH_CODES);
    Map<String, String> qualifiedReceivers = loadCodeList(PROC_QUALIFIED_RECEIVER_CODES);
    ReptAgreementPaymentTaxRateDto taxRate = fetchCurrentTaxRate();

    return new PaymentReferenceData(paymentTypes, paymentTerms, expenseAuthorities, qualifiedReceivers, taxRate);
  }

  @Transactional
  public Long updateAgreement(AgreementUpdateCommand command) {
    if (command == null) {
      return null;
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_AGREEMENT_UPDATE, 16);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);

            cs.setLong(1, command.agreementId());
            cs.setLong(2, command.revisionCount());
            setIndicator(cs, 3, command.active());
            cs.setLong(4, command.projectId());
            setStringOrNull(cs, 5, command.acquisitionAgreementCode());
            setStringOrNull(cs, 6, command.dispositionAgreementCode());
            setStringOrNull(cs, 7, command.paymentTerms());
            setLongOrNull(cs, 8, command.agreementTerm());
            setDateOrNull(cs, 9, command.expiryDate());
            setDateOrNull(cs, 10, command.bringForwardDate());
            setDateOrNull(cs, 11, command.anniversaryDate());
            setDateOrNull(cs, 12, command.renegotiationDate());
            setStringOrNull(cs, 13, command.lessorsFile());
            setStringOrNull(cs, 14, command.commitmentDescription());
            setLongOrNull(cs, 15, command.coUserId());
            setStringOrNull(cs, 16, command.userId());

            cs.execute();
            return cs.getObject(2, Long.class);
          });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_AGREEMENT_UPDATE,
          projectPackage,
          e.getMessage(),
          e);
      throw e;
    }
  }

  private AgreementRecord mapAgreementRecord(ResultSet rs) throws SQLException {
    Long id = rs.getObject("REPT_AGREEMENT_ID", Long.class);
    Long projectId = rs.getObject("REPT_PROJECT_ID", Long.class);
    String acquisitionCode = trim(rs.getString("ACQUISITION_AGREEMENT_CODE"));
    String dispositionCode = trim(rs.getString("DISPOSITION_AGREEMENT_CODE"));
    Boolean active = readIndicator(rs, "AGREEMENT_ACTIVE_IND");
    String paymentTerms = rs.getString("PAYMENT_TERMS");
    Long agreementTerm = rs.getObject("AGREEMENT_TERM", Long.class);
    LocalDate expiryDate = toLocalDate(rs.getDate("AGREEMENT_EXPIRY_DATE"));
    LocalDate bringForwardDate = toLocalDate(rs.getDate("BRING_FORWARD_DATE"));
    LocalDate anniversaryDate = toLocalDate(rs.getDate("ANNIVERSARY_DATE"));
    LocalDate renegotiationDate = toLocalDate(rs.getDate("RENEGOTIATION_DATE"));
    String lessorsFile = rs.getString("LESSORS_FILE");
    String commitmentDescription = rs.getString("COMMITMENT_DESCRIPTION");
    Long coUserId = rs.getObject("REPT_CO_USER_ID", Long.class);
    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);

    return new AgreementRecord(
        id,
        projectId,
        acquisitionCode,
        dispositionCode,
        active,
        paymentTerms,
        agreementTerm,
        expiryDate,
        bringForwardDate,
        anniversaryDate,
        renegotiationDate,
        lessorsFile,
        commitmentDescription,
        coUserId,
        revisionCount);
  }

  private ReptAgreementDto toAgreementDto(
      AgreementRecord record,
      Map<String, String> acquisitionCodes,
      Map<String, String> dispositionCodes,
      Map<String, String> coUserCodes) {
    String agreementType = null;
    String agreementCode = null;
    String agreementLabel = null;

    if (record.acquisitionAgreementCode() != null && !record.acquisitionAgreementCode().isBlank()) {
      agreementType = "ACQUISITION";
      agreementCode = record.acquisitionAgreementCode();
      agreementLabel = labelFor(acquisitionCodes, agreementCode);
    } else if (record.dispositionAgreementCode() != null
        && !record.dispositionAgreementCode().isBlank()) {
      agreementType = "DISPOSITION";
      agreementCode = record.dispositionAgreementCode();
      agreementLabel = labelFor(dispositionCodes, agreementCode);
    }

    String coUserLabel = labelFor(coUserCodes, toCode(record.coUserId()));

    return new ReptAgreementDto(
        record.id(),
        record.projectId(),
        agreementType,
        agreementCode,
        agreementLabel,
        record.acquisitionAgreementCode(),
        labelFor(acquisitionCodes, record.acquisitionAgreementCode()),
        record.dispositionAgreementCode(),
        labelFor(dispositionCodes, record.dispositionAgreementCode()),
        record.active(),
        record.paymentTerms(),
        record.agreementTerm(),
        record.expiryDate(),
        record.bringForwardDate(),
        record.anniversaryDate(),
        record.renegotiationDate(),
        record.lessorsFile(),
        record.commitmentDescription(),
        record.coUserId(),
        coUserLabel,
        record.revisionCount());
  }

  public record AgreementUpdateCommand(
      Long agreementId,
      Long projectId,
      Long revisionCount,
      Boolean active,
      String paymentTerms,
      Long agreementTerm,
      LocalDate expiryDate,
      LocalDate bringForwardDate,
      LocalDate anniversaryDate,
      LocalDate renegotiationDate,
      String lessorsFile,
      String commitmentDescription,
      Long coUserId,
      String acquisitionAgreementCode,
      String dispositionAgreementCode,
      String userId) {}

  private Optional<AgreementRecord> loadAgreementRecord(Long agreementId) {
    if (agreementId == null) {
      return Optional.empty();
    }

    final String call = qualifyProjectProcedure(PROC_AGREEMENT_GET);
    try {
      Optional<AgreementRecord> result =
        jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Optional<AgreementRecord>>)
            cs -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                cs.setLong(2, agreementId);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return Optional.empty();
                }
                try (rs) {
                  if (!rs.next()) {
                    return Optional.empty();
                  }
                  return Optional.of(mapAgreementRecord(rs));
                }
              });
      return result == null ? Optional.empty() : result;
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_AGREEMENT_GET,
          projectPackage,
          e.getMessage(),
          e);
      return Optional.empty();
    }
  }

  private PropertyInfo loadProperty(
      Long propertyId,
      Map<Long, PropertyInfo> cache,
      Map<String, String> acquisitionCodes,
      Map<String, String> ltoCodes) {
    if (propertyId == null) {
      return null;
    }
    PropertyInfo cached = cache.get(propertyId);
    if (cached != null) {
      return cached;
    }

    final String call = qualifyProjectProcedure(PROC_PROPERTY_GET);
    try {
      PropertyInfo info =
          jdbcTemplate.execute(
            call,
            (CallableStatementCallback<PropertyInfo>)
              cs -> {
                    cs.registerOutParameter(1, OracleTypes.CURSOR);
                    cs.setLong(2, propertyId);
                    cs.execute();

                    ResultSet rs = (ResultSet) cs.getObject(1);
                    if (rs == null) {
                      return null;
                    }
                    try (rs) {
                      if (!rs.next()) {
                        return null;
                      }
                      Long id = rs.getObject("PROJECT_PROPERTY_ID", Long.class);
                      Long owningProjectId = rs.getObject("REPT_PROJECT_ID", Long.class);
                      String parcelIdentifier = trim(rs.getString("PARCEL_IDENTIFIER"));
                      String titleNumber = trim(rs.getString("TITLE_NUMBER"));
                      String legalDescription = rs.getString("LEGAL_DESCRIPTION");
                      String acquisitionCode = trim(rs.getString("PROPERTY_ACQUISITION_CODE"));
                      String acquisitionLabel = labelFor(acquisitionCodes, acquisitionCode);
                      String ltoCode = trim(rs.getString("LAND_TITLE_OFFICE_CODE"));
                      String ltoLabel = labelFor(ltoCodes, ltoCode);
                      return new PropertyInfo(
                          id,
                          owningProjectId,
                          parcelIdentifier,
                          titleNumber,
                          legalDescription,
                          acquisitionCode,
                          acquisitionLabel,
                          ltoCode,
                          ltoLabel);
                    }
                  });
      if (info != null) {
        cache.put(propertyId, info);
      }
      return info;
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_GET,
          projectPackage,
          e.getMessage(),
          e);
      return null;
    }
  }

  private PropertyContactRecord loadPropertyContact(
      Long propertyContactId, Map<Long, PropertyContactRecord> cache) {
    if (propertyContactId == null) {
      return null;
    }
    PropertyContactRecord cached = cache.get(propertyContactId);
    if (cached != null) {
      return cached;
    }

    final String call = qualifyProjectProcedure(PROC_PROPERTY_CONTACT_GET);
    try {
      PropertyContactRecord record =
        jdbcTemplate.execute(
          call,
          (CallableStatementCallback<PropertyContactRecord>)
            cs -> {
                    cs.registerOutParameter(1, OracleTypes.CURSOR);
                    cs.setLong(2, propertyContactId);
                    cs.execute();

                    ResultSet rs = (ResultSet) cs.getObject(1);
                    if (rs == null) {
                      return null;
                    }
                    try (rs) {
                      if (!rs.next()) {
                        return null;
                      }
                      Long id = rs.getObject("PROJECT_PROPERTY_CONTACT_ID", Long.class);
                      Long propertyId = rs.getObject("PROJECT_PROPERTY_ID", Long.class);
                      Long contactId = rs.getObject("REPT_CONTACT_ID", Long.class);
                      String contactTypeCode = trim(rs.getString("REPT_CONTACT_TYPE_CODE"));
                      return new PropertyContactRecord(id, propertyId, contactId, contactTypeCode);
                    }
                  });
      if (record != null) {
        cache.put(propertyContactId, record);
      }
      return record;
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_CONTACT_GET,
          projectPackage,
          e.getMessage(),
          e);
      return null;
    }
  }

  private ContactInfo loadContact(Long contactId, Map<Long, ContactInfo> cache) {
    if (contactId == null) {
      return null;
    }
    ContactInfo cached = cache.get(contactId);
    if (cached != null) {
      return cached;
    }

    final String call = qualifyProjectProcedure(PROC_CONTACT_GET);
    try {
      ContactInfo contact =
        jdbcTemplate.execute(
          call,
          (CallableStatementCallback<ContactInfo>)
            cs -> {
                    cs.registerOutParameter(1, OracleTypes.CURSOR);
                    cs.setLong(2, contactId);
                    cs.execute();

                    ResultSet rs = (ResultSet) cs.getObject(1);
                    if (rs == null) {
                      return null;
                    }
                    try (rs) {
                      if (!rs.next()) {
                        return null;
                      }
                      Long id = rs.getObject("REPT_CONTACT_ID", Long.class);
                      Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);
                      String firstName = trim(rs.getString("FIRST_NAME"));
                      String lastName = trim(rs.getString("LAST_NAME"));
                      String companyName = trim(rs.getString("COMPANY_NAME"));
                      String phone = trim(rs.getString("PHONE"));
                      String fax = trim(rs.getString("FAX"));
                      String email = trim(rs.getString("EMAIL"));
                      String address = trim(rs.getString("ADDRESS"));
                      String city = trim(rs.getString("CITY"));
                      String provinceState = trim(rs.getString("PROVINCE_STATE"));
                      String country = trim(rs.getString("COUNTRY"));
                      String postalZipCode = trim(rs.getString("POSTAL_ZIP_CODE"));
                      String displayName =
                          buildDisplayName(companyName, lastName, firstName);
                      return new ContactInfo(
                          id,
                          revisionCount,
                          firstName,
                          lastName,
                          companyName,
                          phone,
                          fax,
                          email,
                          address,
                          city,
                          provinceState,
                          country,
                          postalZipCode,
                          displayName);
                    }
                  });
      if (contact != null) {
        cache.put(contactId, contact);
      }
      return contact;
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_CONTACT_GET,
          projectPackage,
          e.getMessage(),
          e);
      return null;
    }
  }

  private BigDecimal loadTaxRatePercent(Long taxRateId, Map<Long, BigDecimal> cache) {
    if (taxRateId == null) {
      return null;
    }
    if (cache.containsKey(taxRateId)) {
      return cache.get(taxRateId);
    }

    final String call = qualifyProjectProcedure(PROC_TAX_RATE_GET);
    try {
      BigDecimal pct =
        jdbcTemplate.execute(
          call,
          (CallableStatementCallback<BigDecimal>)
            cs -> {
                    cs.registerOutParameter(1, OracleTypes.CURSOR);
                    cs.setLong(2, taxRateId);
                    cs.execute();

                    ResultSet rs = (ResultSet) cs.getObject(1);
                    if (rs == null) {
                      return null;
                    }
                    try (rs) {
                      if (!rs.next()) {
                        return null;
                      }
                      return rs.getBigDecimal("TAX_RATE_PCT");
                    }
                  });
      if (pct != null) {
        cache.put(taxRateId, pct);
      }
      return pct;
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_TAX_RATE_GET,
          projectPackage,
          e.getMessage(),
          e);
      return null;
    }
  }

  private ReptAgreementPaymentTaxRateDto fetchCurrentTaxRate() {
    final String call = qualifyProjectProcedure(PROC_TAX_RATE_FIND, 0);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<ReptAgreementPaymentTaxRateDto>)
              cs -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return null;
                }

                try (rs) {
                  if (!rs.next()) {
                    return null;
                  }
                  Long taxRateId = rs.getObject("REPT_TAX_RATE_ID", Long.class);
                  BigDecimal percent = rs.getBigDecimal("TAX_RATE_PCT");
                  return new ReptAgreementPaymentTaxRateDto(taxRateId, percent);
                }
              });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_TAX_RATE_FIND,
          projectPackage,
          e.getMessage(),
          e);
      return null;
    }
  }

  private PaymentRecord mapPaymentRecord(ResultSet rs) throws SQLException {
    Long id = rs.getObject("REPT_AGREEMENT_PAYMENT_ID", Long.class);
    Long agreementId = rs.getObject("REPT_AGREEMENT_ID", Long.class);
    Boolean rescinded = readIndicator(rs, "RESCIND_PAYMENT_IND");
    LocalDate requestDate = toLocalDate(rs.getDate("PAYMENT_REQUEST_DATE"));
    BigDecimal amount = rs.getBigDecimal("PAYMENT_AMOUNT");
    BigDecimal gstAmount = rs.getBigDecimal("TAXABLE_AMOUNT");
    BigDecimal totalAmount = rs.getBigDecimal("TOTAL_INVOICE_AMOUNT");
    String paymentTermTypeCode = trim(rs.getString("PAYMENT_TERM_TYPE_CODE"));
    String paymentTypeCode = trim(rs.getString("REPT_PAYMENT_TYPE_CODE"));
    String processingInstructions = rs.getString("PROCESSING_INSTRUCTIONS");
    String casClient = rs.getString("CAS_CLIENT");
    String casResponsibilityCentre = rs.getString("CAS_RESPONSIBILITY_CENTRE");
    String casServiceLine = rs.getString("CAS_SERVICE_LINE");
    String casStob = rs.getString("CAS_STOB");
    String casProjectNumber = rs.getString("CAS_PROJECT_NUMBER");
    Long taxRateId = rs.getObject("REPT_TAX_RATE_ID", Long.class);
    String expenseAuthorityCode = trim(rs.getString("EXPENSE_AUTHORITY_ID"));
    String qualifiedReceiverCode = trim(rs.getString("QUALIFIED_RECEIVER_ID"));
    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);

    return new PaymentRecord(
        id,
        agreementId,
        rescinded,
        requestDate,
        amount,
        gstAmount,
        totalAmount,
        paymentTermTypeCode,
        paymentTypeCode,
        processingInstructions,
        casClient,
        casResponsibilityCentre,
        casServiceLine,
        casStob,
        casProjectNumber,
        taxRateId,
        expenseAuthorityCode,
        qualifiedReceiverCode,
        revisionCount);
  }

  private ReptAgreementPaymentDto toPaymentDto(
      PaymentRecord record,
      Map<String, String> paymentTermCodes,
      Map<String, String> paymentTypeCodes,
      Map<String, String> expenseAuthorityCodes,
      Map<String, String> qualifiedReceiverCodes,
      BigDecimal taxRatePercent,
      List<ReptAgreementPayeeDto> payees) {
    return new ReptAgreementPaymentDto(
        record.id(),
        record.agreementId(),
        record.rescinded(),
        record.requestDate(),
        record.amount(),
        record.gstAmount(),
        record.totalAmount(),
        record.paymentTermTypeCode(),
        labelFor(paymentTermCodes, record.paymentTermTypeCode()),
        record.paymentTypeCode(),
        labelFor(paymentTypeCodes, record.paymentTypeCode()),
        record.processingInstructions(),
        record.casClient(),
        record.casResponsibilityCentre(),
        record.casServiceLine(),
        record.casStob(),
        record.casProjectNumber(),
        record.taxRateId(),
        taxRatePercent,
        record.expenseAuthorityCode(),
        labelFor(expenseAuthorityCodes, record.expenseAuthorityCode()),
        record.qualifiedReceiverCode(),
        labelFor(qualifiedReceiverCodes, record.qualifiedReceiverCode()),
        record.revisionCount(),
        payees);
  }

  private Optional<PaymentRecord> loadPaymentRecord(Long paymentId) {
    if (paymentId == null) {
      return Optional.empty();
    }

    final String call = qualifyProjectProcedure(PROC_PAYMENT_GET);
    try {
      Optional<PaymentRecord> result =
          jdbcTemplate.execute(
              call,
              (CallableStatementCallback<Optional<PaymentRecord>>)
                  cs -> {
                    cs.registerOutParameter(1, OracleTypes.CURSOR);
                    cs.setLong(2, paymentId);
                    cs.execute();

                    ResultSet rs = (ResultSet) cs.getObject(1);
                    if (rs == null) {
                      return Optional.empty();
                    }

                    try (rs) {
                      if (!rs.next()) {
                        return Optional.empty();
                      }
                      return Optional.of(mapPaymentRecord(rs));
                    }
                  });
      return result == null ? Optional.empty() : result;
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PAYMENT_GET,
          projectPackage,
          e.getMessage(),
          e);
      return Optional.empty();
    }
  }

  private List<ReptAgreementPayeeDto> loadPayees(
      Long paymentId,
      Long projectId,
      Map<Long, PropertyInfo> propertyCache,
      Map<Long, ContactInfo> contactCache,
      Map<Long, PropertyContactRecord> propertyContactCache,
      Map<String, String> propertyAcquisitionCodes,
      Map<String, String> landTitleCodes,
      Map<String, String> contactTypeCodes) {
    if (paymentId == null) {
      return List.of();
    }

    List<ReptAgreementPayeeDto> results = new ArrayList<>();
    final String call = qualifyProjectProcedure(PROC_PAYEE_FIND);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Void>)
              cs -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                cs.setLong(2, paymentId);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return null;
                }

                try (rs) {
                  while (rs.next()) {
                    Long payeeId = rs.getObject("REPT_AGRMNT_PAYMENT_PAYEE_ID", Long.class);
                    Long propertyContactId = rs.getObject("PROJECT_PROPERTY_CONTACT_ID", Long.class);

                    PropertyContactRecord propertyContact =
                        loadPropertyContact(propertyContactId, propertyContactCache);
                    if (propertyContact == null) {
                      continue;
                    }
                    PropertyInfo property =
                        loadProperty(
                            propertyContact.propertyId(),
                            propertyCache,
                            propertyAcquisitionCodes,
                            landTitleCodes);
                    if (property == null || !Objects.equals(property.projectId(), projectId)) {
                      continue;
                    }
                    ContactInfo contact = loadContact(propertyContact.contactId(), contactCache);
                    if (contact == null) {
                      continue;
                    }

                    String contactTypeLabel =
                        labelFor(contactTypeCodes, propertyContact.contactTypeCode());

                    results.add(
                        new ReptAgreementPayeeDto(
                            payeeId,
                            paymentId,
                            propertyContactId,
                            property.id(),
                            property.parcelIdentifier(),
                            property.titleNumber(),
                            contact.id(),
                            propertyContact.contactTypeCode(),
                            contactTypeLabel,
                            contact.displayName(),
                            contact.firstName(),
                            contact.lastName(),
                            contact.companyName(),
                            contact.phone(),
                            contact.fax(),
                            contact.email(),
                            contact.address(),
                            contact.city(),
                            contact.provinceState(),
                            contact.country(),
                            contact.postalZipCode()));
                  }
                }
                return null;
              });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PAYEE_FIND,
          projectPackage,
          e.getMessage(),
          e);
    }

    results.sort(
        Comparator.comparing(
            ReptAgreementPayeeDto::parcelIdentifier,
            Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));
    return List.copyOf(results);
  }

  private int compareDatesDesc(LocalDate left, LocalDate right) {
    if (left == null && right == null) {
      return 0;
    }
    if (left == null) {
      return 1;
    }
    if (right == null) {
      return -1;
    }
    return right.compareTo(left);
  }

  private String labelFor(Map<String, String> map, String key) {
    if (map == null || key == null) {
      return key;
    }
    return map.getOrDefault(key, key);
  }

  private String buildDisplayName(String companyName, String lastName, String firstName) {
    if (companyName != null && !companyName.isBlank()) {
      return companyName;
    }
    if (lastName == null && firstName == null) {
      return null;
    }
    if (lastName == null) {
      return firstName;
    }
    if (firstName == null) {
      return lastName;
    }
    return lastName + ", " + firstName;
  }

  private record AgreementRecord(
      Long id,
      Long projectId,
      String acquisitionAgreementCode,
      String dispositionAgreementCode,
      Boolean active,
      String paymentTerms,
      Long agreementTerm,
      LocalDate expiryDate,
      LocalDate bringForwardDate,
      LocalDate anniversaryDate,
      LocalDate renegotiationDate,
      String lessorsFile,
      String commitmentDescription,
      Long coUserId,
      Long revisionCount) {}

  private record PropertyInfo(
      Long id,
      Long projectId,
      String parcelIdentifier,
      String titleNumber,
      String legalDescription,
      String acquisitionCode,
      String acquisitionLabel,
      String landTitleOfficeCode,
      String landTitleOfficeLabel) {}

  private record PropertyContactRecord(Long id, Long propertyId, Long contactId, String contactTypeCode) {}

  private record ContactInfo(
      Long id,
      Long revisionCount,
      String firstName,
      String lastName,
      String companyName,
      String phone,
      String fax,
      String email,
      String address,
      String city,
      String provinceState,
      String country,
      String postalZipCode,
      String displayName) {}

  private record PaymentRecord(
      Long id,
      Long agreementId,
      Boolean rescinded,
      LocalDate requestDate,
      BigDecimal amount,
      BigDecimal gstAmount,
      BigDecimal totalAmount,
      String paymentTermTypeCode,
      String paymentTypeCode,
      String processingInstructions,
      String casClient,
      String casResponsibilityCentre,
      String casServiceLine,
      String casStob,
      String casProjectNumber,
      Long taxRateId,
      String expenseAuthorityCode,
      String qualifiedReceiverCode,
      Long revisionCount) {}

  public record PropertyAssociationLink(Long associationId, Long propertyId, Long revisionCount) {}

  public record PaymentCreateCommand(
      Long agreementId,
      LocalDate requestDate,
      BigDecimal amount,
      String paymentTermTypeCode,
      String paymentTypeCode,
      String processingInstructions,
      String casClient,
      String casResponsibilityCentre,
      String casServiceLine,
      String casStob,
      String casProjectNumber,
      Boolean rescinded,
      BigDecimal gstAmount,
      BigDecimal totalAmount,
      Long taxRateId,
      String expenseAuthorityCode,
      String qualifiedReceiverCode,
      String userId) {}

  public record PaymentReferenceData(
      Map<String, String> paymentTypes,
      Map<String, String> paymentTerms,
      Map<String, String> expenseAuthorities,
      Map<String, String> qualifiedReceivers,
      ReptAgreementPaymentTaxRateDto taxRate) {}

  public record AgreementCreateCommand(
      Long projectId,
      Boolean active,
      String paymentTerms,
      Long agreementTerm,
      LocalDate expiryDate,
      LocalDate bringForwardDate,
      LocalDate anniversaryDate,
      LocalDate renegotiationDate,
      String lessorsFile,
      String commitmentDescription,
      Long coUserId,
      String acquisitionAgreementCode,
      String dispositionAgreementCode,
      String userId) {}
}
