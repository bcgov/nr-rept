package ca.bc.gov.nrs.rept.repository.rept;

import java.sql.ResultSet;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
public class ReptContactRepository extends AbstractReptRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptContactRepository.class);

  private static final String PROC_PROJECT_CONTACT_FIND = "RPC_FIND_BY_PROJECT";
  private static final String PROC_PROJECT_CONTACT_INSERT = "REPT_PROJECT_CONTACT_INS";
  private static final String PROC_PROJECT_CONTACT_DELETE = "REPT_PROJECT_CONTACT_DEL";
  private static final String PROC_PROPERTY_CONTACT_FIND_BY_PROJECT = "PPC_FIND_BY_PROJECT";
  private static final String PROC_PROPERTY_CONTACT_FIND_BY_PROPERTY = "PPC_FIND_BY_PROPERTY";
  private static final String PROC_CONTACT_GET = "REPT_CONTACT_GET";
  private static final String PROC_CONTACT_SEARCH = "REPT_CONTACT_SEARCH";
  private static final String PROC_PROPERTY_GET = "PROJECT_PROPERTY_GET";
  private static final String PROC_PROPERTY_CONTACT_INSERT = "PROJECT_PROPERTY_CONTACT_INS";
  private static final String PROC_PROPERTY_CONTACT_DELETE = "PROJECT_PROPERTY_CONTACT_DEL";
  private static final String PROC_CONTACT_TYPE_CODES = "REPT_CONTACT_TYPE_CODE_LST";

  public ReptContactRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public List<ContactAssociationRecord> findContactsForProject(Long projectId) {
    if (projectId == null) {
      return List.of();
    }

    Map<String, String> typeCodes = loadCodeList(PROC_CONTACT_TYPE_CODES);
    Map<Long, ContactRecord> contactCache = new HashMap<>();
    Map<Long, PropertyInfo> propertyCache = new HashMap<>();
    List<ContactAssociationRecord> records = new ArrayList<>();

    records.addAll(loadProjectContactRows(projectId, typeCodes, contactCache));
    records.addAll(
        loadPropertyContactRowsForProject(projectId, typeCodes, contactCache, propertyCache));

    records.sort((left, right) -> compareIgnoreCase(left.contact().displayName(), right.contact().displayName()));
    return List.copyOf(records);
  }

  @Transactional(readOnly = true)
  public List<ContactAssociationRecord> findContactsForProperty(Long propertyId) {
    if (propertyId == null) {
      return List.of();
    }

    Map<String, String> typeCodes = loadCodeList(PROC_CONTACT_TYPE_CODES);
    Map<Long, ContactRecord> contactCache = new HashMap<>();
    Map<Long, PropertyInfo> propertyCache = new HashMap<>();

    List<ContactAssociationRecord> records =
        loadPropertyContactRowsForProperty(propertyId, typeCodes, contactCache, propertyCache);

    records.sort((left, right) -> compareIgnoreCase(left.contact().displayName(), right.contact().displayName()));
    return List.copyOf(records);
  }

  private List<ContactAssociationRecord> loadProjectContactRows(
      Long projectId,
      Map<String, String> typeCodes,
      Map<Long, ContactRecord> contactCache) {
    List<ContactAssociationRecord> records = new ArrayList<>();
    final String call = qualifyProjectProcedure(PROC_PROJECT_CONTACT_FIND);

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
                    Long associationId = rs.getObject("REPT_PROJECT_CONTACT_ID", Long.class);
                    Long contactId = rs.getObject("REPT_CONTACT_ID", Long.class);
                    Long resultProjectId = rs.getObject("REPT_PROJECT_ID", Long.class);
                    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);
                    String contactTypeCode = trim(rs.getString("REPT_CONTACT_TYPE_CODE"));
                    if (!Objects.equals(resultProjectId, projectId)) {
                      continue;
                    }
                    ContactRecord contact = loadContact(contactId, contactCache);
                    if (contact == null) {
                      continue;
                    }
                    String contactTypeLabel = resolveLabel(typeCodes, contactTypeCode);
                    records.add(
                        new ContactAssociationRecord(
                            associationId,
                            AssociationType.PROJECT,
                            resultProjectId,
                            null,
                            contactTypeCode,
                            contactTypeLabel,
                            contact,
                            null,
                            revisionCount));
                  }
                }
                return null;
              });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROJECT_CONTACT_FIND,
          projectPackage,
          e.getMessage());
    }

    return records;
  }

  private List<ContactAssociationRecord> loadPropertyContactRowsForProject(
      Long projectId,
      Map<String, String> typeCodes,
      Map<Long, ContactRecord> contactCache,
      Map<Long, PropertyInfo> propertyCache) {
    List<ContactAssociationRecord> records = new ArrayList<>();
    final String call = qualifyProjectProcedure(PROC_PROPERTY_CONTACT_FIND_BY_PROJECT);

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
                    Long associationId = rs.getObject("PROJECT_PROPERTY_CONTACT_ID", Long.class);
                    Long contactId = rs.getObject("REPT_CONTACT_ID", Long.class);
                    Long propertyId = rs.getObject("PROJECT_PROPERTY_ID", Long.class);
                    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);
                    String contactTypeCode = trim(rs.getString("REPT_CONTACT_TYPE_CODE"));

                    PropertyInfo property = loadProperty(propertyId, propertyCache);
                    if (property == null || !Objects.equals(property.projectId(), projectId)) {
                      continue;
                    }
                    ContactRecord contact = loadContact(contactId, contactCache);
                    if (contact == null) {
                      continue;
                    }

                    String contactTypeLabel = resolveLabel(typeCodes, contactTypeCode);
                    records.add(
                        new ContactAssociationRecord(
                            associationId,
                            AssociationType.PROPERTY,
                            property.projectId(),
                            property.id(),
                            contactTypeCode,
                            contactTypeLabel,
                            contact,
                            property,
                            revisionCount));
                  }
                }
                return null;
              });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_CONTACT_FIND_BY_PROJECT,
          projectPackage,
          e.getMessage());
    }

    return records;
  }

  private List<ContactAssociationRecord> loadPropertyContactRowsForProperty(
      Long propertyId,
      Map<String, String> typeCodes,
      Map<Long, ContactRecord> contactCache,
      Map<Long, PropertyInfo> propertyCache) {
    List<ContactAssociationRecord> records = new ArrayList<>();
    final String call = qualifyProjectProcedure(PROC_PROPERTY_CONTACT_FIND_BY_PROPERTY);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Void>)
              cs -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                cs.setLong(2, propertyId);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return null;
                }

                try (rs) {
                  while (rs.next()) {
                    Long associationId = rs.getObject("PROJECT_PROPERTY_CONTACT_ID", Long.class);
                    Long contactId = rs.getObject("REPT_CONTACT_ID", Long.class);
                    Long resultPropertyId = rs.getObject("PROJECT_PROPERTY_ID", Long.class);
                    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);
                    String contactTypeCode = trim(rs.getString("REPT_CONTACT_TYPE_CODE"));

                    ContactRecord contact = loadContact(contactId, contactCache);
                    if (contact == null) {
                      continue;
                    }
                    PropertyInfo property = loadProperty(resultPropertyId, propertyCache);

                    String contactTypeLabel = resolveLabel(typeCodes, contactTypeCode);
                    records.add(
                        new ContactAssociationRecord(
                            associationId,
                            AssociationType.PROPERTY,
                            property != null ? property.projectId() : null,
                            resultPropertyId,
                            contactTypeCode,
                            contactTypeLabel,
                            contact,
                            property,
                            revisionCount));
                  }
                }
                return null;
              });
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} failed for package {}: {}",
          PROC_PROPERTY_CONTACT_FIND_BY_PROPERTY,
          projectPackage,
          e.getMessage());
    }

    return records;
  }

  private ContactRecord loadContact(Long contactId, Map<Long, ContactRecord> cache) {
    if (contactId == null) {
      return null;
    }
    ContactRecord cached = cache.get(contactId);
    if (cached != null) {
      return cached;
    }

    final String call = qualifyProjectProcedure(PROC_CONTACT_GET);
    try {
      ContactRecord contact =
          jdbcTemplate.execute(
              call,
              (CallableStatementCallback<ContactRecord>)
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
                      String address = trim(rs.getString("ADDRESS"));
                      String city = trim(rs.getString("CITY"));
                      String provinceState = trim(rs.getString("PROVINCE_STATE"));
                      String country = trim(rs.getString("COUNTRY"));
                      String postalZipCode = trim(rs.getString("POSTAL_ZIP_CODE"));
                      String phone = trim(rs.getString("PHONE"));
                      String fax = trim(rs.getString("FAX"));
                      String email = trim(rs.getString("EMAIL"));
                      String displayName = computeDisplayName(companyName, lastName, firstName);
                      return new ContactRecord(
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
          "{} lookup failed for package {}: {}",
          PROC_CONTACT_GET,
          projectPackage,
          e.getMessage());
      return null;
    }
  }

  private PropertyInfo loadProperty(Long propertyId, Map<Long, PropertyInfo> cache) {
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
                      Long projectId = rs.getObject("REPT_PROJECT_ID", Long.class);
                      String parcelIdentifier = trim(rs.getString("PARCEL_IDENTIFIER"));
                      String titleNumber = trim(rs.getString("TITLE_NUMBER"));
                      return new PropertyInfo(id, projectId, parcelIdentifier, titleNumber);
                    }
                  });
      if (info != null) {
        cache.put(propertyId, info);
      }
      return info;
    } catch (DataAccessException e) {
      LOGGER.warn(
          "{} lookup failed for package {}: {}",
          PROC_PROPERTY_GET,
          projectPackage,
          e.getMessage());
      return null;
    }
  }

  private String resolveLabel(Map<String, String> map, String key) {
    if (key == null || key.isBlank()) {
      return null;
    }
    return map.getOrDefault(key, key);
  }

  private int compareIgnoreCase(String left, String right) {
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

  private String computeDisplayName(String companyName, String lastName, String firstName) {
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

  public enum AssociationType {
    PROJECT,
    PROPERTY
  }

  public record ContactAssociationRecord(
      Long associationId,
      AssociationType associationType,
      Long projectId,
      Long propertyId,
      String contactTypeCode,
      String contactTypeLabel,
      ContactRecord contact,
      PropertyInfo propertyInfo,
      Long revisionCount) {}

  public record ContactRecord(
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

  public record PropertyInfo(
      Long id, Long projectId, String parcelIdentifier, String titleNumber) {}

  @Transactional(readOnly = true)
  public Map<String, String> listContactTypes() {
    return new LinkedHashMap<>(loadCodeList(PROC_CONTACT_TYPE_CODES));
  }

  @Transactional(readOnly = true)
  public List<ContactRecord> searchContacts(String firstName, String lastName, String companyName) {
    boolean hasFirstName = firstName != null && !firstName.isBlank();
    boolean hasLastName = lastName != null && !lastName.isBlank();
    boolean hasCompanyName = companyName != null && !companyName.isBlank();

    if (!hasFirstName && !hasLastName && !hasCompanyName) {
      return List.of();
    }

    final String call = qualifyProjectProcedure(PROC_CONTACT_SEARCH, 3);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<List<ContactRecord>>)
              cs -> {
                cs.registerOutParameter(1, OracleTypes.CURSOR);
                // Pass values directly - stored procedure handles wildcard matching internally
                setStringOrNull(cs, 2, hasFirstName ? firstName.trim() : null);
                setStringOrNull(cs, 3, hasLastName ? lastName.trim() : null);
                setStringOrNull(cs, 4, hasCompanyName ? companyName.trim() : null);
                cs.execute();

                ResultSet rs = (ResultSet) cs.getObject(1);
                if (rs == null) {
                  return List.of();
                }

                List<ContactRecord> results = new ArrayList<>();
                try (rs) {
                  while (rs.next()) {
                    Long id = rs.getObject("REPT_CONTACT_ID", Long.class);
                    Long revisionCount = rs.getObject("REVISION_COUNT", Long.class);
                    String contactFirstName = trim(rs.getString("FIRST_NAME"));
                    String contactLastName = trim(rs.getString("LAST_NAME"));
                    String contactCompanyName = trim(rs.getString("COMPANY_NAME"));
                    String address = trim(rs.getString("ADDRESS"));
                    String city = trim(rs.getString("CITY"));
                    String provinceState = trim(rs.getString("PROVINCE_STATE"));
                    String country = trim(rs.getString("COUNTRY"));
                    String postalZipCode = trim(rs.getString("POSTAL_ZIP_CODE"));
                    String phone = trim(rs.getString("PHONE"));
                    String fax = trim(rs.getString("FAX"));
                    String email = trim(rs.getString("EMAIL"));
                    String displayName = computeDisplayName(contactCompanyName, contactLastName, contactFirstName);
                    results.add(new ContactRecord(
                        id, revisionCount, contactFirstName, contactLastName, contactCompanyName,
                        phone, fax, email, address, city, provinceState,
                        country, postalZipCode, displayName));
                  }
                }
                return results;
              });
    } catch (DataAccessException e) {
      LOGGER.warn("{} failed: {}", PROC_CONTACT_SEARCH, e.getMessage());
      return List.of();
    }
  }

  @Transactional
  public void addProjectContact(Long projectId, Long contactId, String contactTypeCode, String entryUserId)
      throws ProjectCreationException {
    if (projectId == null || contactId == null) {
      throw new IllegalArgumentException("projectId and contactId are required");
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROJECT_CONTACT_INSERT, 6);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Long>)
              cs -> {
                cs.registerOutParameter(1, Types.NUMERIC);
                cs.registerOutParameter(2, Types.NUMERIC);

                int paramIndex = 1;
                cs.setNull(paramIndex++, Types.NUMERIC); // id (OUT)
                cs.setNull(paramIndex++, Types.NUMERIC); // revisionCount (OUT)
                cs.setLong(paramIndex++, projectId);
                cs.setLong(paramIndex++, contactId);
                if (contactTypeCode == null || contactTypeCode.isBlank()) {
                  cs.setNull(paramIndex++, Types.VARCHAR);
                } else {
                  cs.setString(paramIndex++, contactTypeCode);
                }
                if (entryUserId == null || entryUserId.isBlank()) {
                  cs.setNull(paramIndex, Types.VARCHAR);
                } else {
                  cs.setString(paramIndex, entryUserId);
                }

                cs.execute();
                return cs.getLong(1);
              });
    } catch (DataAccessException ex) {
      throw translateException(ex, "add contact to project");
    }
  }

  @Transactional
  public void removeProjectContact(Long associationId, Long revisionCount)
      throws ProjectCreationException {
    if (associationId == null) {
      throw new IllegalArgumentException("associationId is required");
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROJECT_CONTACT_DELETE, 2);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Void>)
              cs -> {
                cs.setLong(1, associationId);
                if (revisionCount == null) {
                  cs.setNull(2, Types.NUMERIC);
                } else {
                  cs.setLong(2, revisionCount);
                }

                cs.execute();
                return null;
              });
    } catch (DataAccessException ex) {
      throw translateException(ex, "remove contact from project");
    }
  }

  @Transactional
  public void addPropertyContact(Long propertyId, Long contactId, String contactTypeCode, String entryUserId)
      throws ProjectCreationException {
    if (propertyId == null || contactId == null) {
      throw new IllegalArgumentException("propertyId and contactId are required");
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROPERTY_CONTACT_INSERT, 6);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Long>)
              cs -> {
                cs.registerOutParameter(1, Types.NUMERIC);
                cs.registerOutParameter(2, Types.NUMERIC);

                int paramIndex = 1;
                cs.setNull(paramIndex++, Types.NUMERIC); // id (OUT)
                cs.setNull(paramIndex++, Types.NUMERIC); // revisionCount (OUT)
                cs.setLong(paramIndex++, propertyId);
                cs.setLong(paramIndex++, contactId);
                if (contactTypeCode == null || contactTypeCode.isBlank()) {
                  cs.setNull(paramIndex++, Types.VARCHAR);
                } else {
                  cs.setString(paramIndex++, contactTypeCode);
                }
                if (entryUserId == null || entryUserId.isBlank()) {
                  cs.setNull(paramIndex, Types.VARCHAR);
                } else {
                  cs.setString(paramIndex, entryUserId);
                }

                cs.execute();
                return cs.getLong(1);
              });
    } catch (DataAccessException ex) {
      throw translateException(ex, "add contact to property");
    }
  }

  @Transactional
  public void removePropertyContact(Long associationId, Long revisionCount)
      throws ProjectCreationException {
    if (associationId == null) {
      throw new IllegalArgumentException("associationId is required");
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_PROPERTY_CONTACT_DELETE, 2);

    try {
      jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Void>)
              cs -> {
                cs.setLong(1, associationId);
                if (revisionCount == null) {
                  cs.setNull(2, Types.NUMERIC);
                } else {
                  cs.setLong(2, revisionCount);
                }

                cs.execute();
                return null;
              });
    } catch (DataAccessException ex) {
      throw translateException(ex, "remove contact from property");
    }
  }

  private ProjectCreationException translateException(DataAccessException ex, String operation) {
    java.sql.SQLException sqlException = findSqlException(ex);
    ProjectCreationException.Reason reason = ProjectCreationException.Reason.DATABASE_ERROR;
    String message = null;

    if (sqlException != null) {
      int errorCode = Math.abs(sqlException.getErrorCode());
      switch (errorCode) {
        case 1:
          reason = ProjectCreationException.Reason.DUPLICATE;
          message = "This contact is already associated with the project.";
          break;
        case 20001:
          reason = ProjectCreationException.Reason.DATA_NOT_CURRENT;
          message = "The contact information is out of date. Refresh and try again.";
          break;
        case 2290:
          reason = ProjectCreationException.Reason.CHECK_CONSTRAINT;
          message = "Contact data violates a database rule.";
          break;
        default:
          break;
      }
    }

    if (message == null) {
      message = "Failed to " + operation + " due to a database error.";
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
