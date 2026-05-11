package ca.bc.gov.nrs.hrs.repository.rept.admin;

import ca.bc.gov.nrs.hrs.repository.rept.AbstractReptRepository;
import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
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
public class ReptContactAdminRepository extends AbstractReptRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptContactAdminRepository.class);

  private static final String PROC_SEARCH = "REPT_CONTACT_SEARCH";
  private static final String PROC_GET = "REPT_CONTACT_GET";
  private static final String PROC_INSERT = "REPT_CONTACT_INS";
  private static final String PROC_UPDATE = "REPT_CONTACT_UPD";
  private static final String PROC_DELETE = "REPT_CONTACT_DEL";

  public ReptContactAdminRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public List<ContactRecord> search(String firstName, String lastName, String companyName) {
    final String call = qualifyProjectProcedure(PROC_SEARCH, 3);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<List<ContactRecord>>) cs -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            setStringOrNull(cs, 2, firstName);
            setStringOrNull(cs, 3, lastName);
            setStringOrNull(cs, 4, companyName);
            cs.execute();
            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return List.of();
            }
            List<ContactRecord> rows = new ArrayList<>();
            try (rs) {
              while (rs.next()) {
                rows.add(mapRow(rs));
              }
            }
            rows.sort((a, b) -> compareSafe(a.displayName(), b.displayName()));
            return Collections.unmodifiableList(rows);
          });
    } catch (DataAccessException ex) {
      LOGGER.warn("{} search failed for package {}: {}", PROC_SEARCH, projectPackage, ex.getMessage(), ex);
      return List.of();
    }
  }

  @Transactional(readOnly = true)
  public Optional<ContactRecord> findById(Long id) {
    if (id == null) {
      return Optional.empty();
    }
    final String call = qualifyProjectProcedure(PROC_GET);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Optional<ContactRecord>>) cs -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, id);
            cs.execute();
            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return Optional.empty();
            }
            try (rs) {
              if (rs.next()) {
                return Optional.of(mapRow(rs));
              }
            }
            return Optional.empty();
          });
    } catch (DataAccessException ex) {
      LOGGER.warn("{} lookup failed for package {}: {}", PROC_GET, projectPackage, ex.getMessage(), ex);
      return Optional.empty();
    }
  }

  @Transactional
  public ContactRecord insert(ContactPayload payload, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_INSERT, 14);
    return jdbcTemplate.execute(
        call,
        (CallableStatementCallback<ContactRecord>) cs -> {
          cs.registerOutParameter(1, Types.NUMERIC);
          cs.registerOutParameter(2, Types.NUMERIC);
          cs.setNull(1, Types.NUMERIC);
          cs.setNull(2, Types.NUMERIC);
          bindContactFields(cs, 3, payload);
          setStringOrNull(cs, 14, userId);
          cs.execute();
          Long id = cs.getObject(1, Long.class);
          Long revision = cs.getObject(2, Long.class);
          return new ContactRecord(
              id,
              revision,
              payload.firstName(),
              payload.lastName(),
              payload.companyName(),
              payload.address(),
              payload.city(),
              payload.provinceState(),
              payload.country(),
              payload.postalZipCode(),
              payload.email(),
              payload.phone(),
              payload.fax(),
              computeDisplayName(payload.companyName(), payload.lastName(), payload.firstName()));
        });
  }

  @Transactional
  public ContactRecord update(Long id, Long revisionCount, ContactPayload payload, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_UPDATE, 14);
    return jdbcTemplate.execute(
        call,
        (CallableStatementCallback<ContactRecord>) cs -> {
          cs.registerOutParameter(1, Types.NUMERIC);
          cs.registerOutParameter(2, Types.NUMERIC);
          cs.setLong(1, id);
          setLongOrNull(cs, 2, revisionCount);
          bindContactFields(cs, 3, payload);
          setStringOrNull(cs, 14, userId);
          cs.execute();
          Long updatedId = cs.getObject(1, Long.class);
          Long updatedRevision = cs.getObject(2, Long.class);
          return new ContactRecord(
              updatedId != null ? updatedId : id,
              updatedRevision != null ? updatedRevision : revisionCount,
              payload.firstName(),
              payload.lastName(),
              payload.companyName(),
              payload.address(),
              payload.city(),
              payload.provinceState(),
              payload.country(),
              payload.postalZipCode(),
              payload.email(),
              payload.phone(),
              payload.fax(),
              computeDisplayName(payload.companyName(), payload.lastName(), payload.firstName()));
        });
  }

  @Transactional
  public void delete(Long id, Long revisionCount) {
    if (id == null || revisionCount == null) {
      return;
    }
    final String call = qualifyProjectProcedureWithoutReturn(PROC_DELETE, 2);
    jdbcTemplate.execute(
        call,
        (CallableStatementCallback<Void>) cs -> {
          cs.setLong(1, id);
          cs.setLong(2, revisionCount);
          cs.execute();
          return null;
        });
  }

  private void bindContactFields(CallableStatement cs, int startIndex, ContactPayload payload)
      throws java.sql.SQLException {
    int index = startIndex;
    setStringOrNull(cs, index++, payload.firstName());
    setStringOrNull(cs, index++, payload.lastName());
    setStringOrNull(cs, index++, payload.companyName());
    setStringOrNull(cs, index++, payload.address());
    setStringOrNull(cs, index++, payload.city());
    setStringOrNull(cs, index++, payload.provinceState());
    setStringOrNull(cs, index++, payload.country());
    setStringOrNull(cs, index++, payload.postalZipCode());
    setStringOrNull(cs, index++, payload.phone());
    setStringOrNull(cs, index++, payload.fax());
    setStringOrNull(cs, index++, payload.email());
  }

  private ContactRecord mapRow(ResultSet rs) throws java.sql.SQLException {
    Long id = rs.getObject("REPT_CONTACT_ID", Long.class);
    Long revision = rs.getObject("REVISION_COUNT", Long.class);
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
    return new ContactRecord(
        id,
        revision,
        firstName,
        lastName,
        companyName,
        address,
        city,
        provinceState,
        country,
        postalZipCode,
        email,
        phone,
        fax,
        computeDisplayName(companyName, lastName, firstName));
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

  /** Lightweight holder for the mutable fields used by both insert and update operations. */
  public record ContactPayload(
      String firstName,
      String lastName,
      String companyName,
      String address,
      String city,
      String provinceState,
      String country,
      String postalZipCode,
      String email,
      String phone,
      String fax) {}

  public record ContactRecord(
      Long id,
      Long revisionCount,
      String firstName,
      String lastName,
      String companyName,
      String address,
      String city,
      String provinceState,
      String country,
      String postalZipCode,
      String email,
      String phone,
      String fax,
      String displayName) {}
}
