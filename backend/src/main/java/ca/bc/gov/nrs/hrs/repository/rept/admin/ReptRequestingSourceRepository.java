package ca.bc.gov.nrs.hrs.repository.rept.admin;

import ca.bc.gov.nrs.hrs.exception.DuplicateDataException;
import ca.bc.gov.nrs.hrs.repository.rept.AbstractReptRepository;
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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Profile("oracle")
public class ReptRequestingSourceRepository extends AbstractReptRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptRequestingSourceRepository.class);

  private static final String PROC_SEARCH = "REPT_REQUESTING_SOURCE_SEARCH";
  private static final String PROC_GET = "REPT_REQUESTING_SOURCE_GET";
  private static final String PROC_INSERT = "REPT_REQUESTING_SOURCE_INS";
  private static final String PROC_UPDATE = "REPT_REQUESTING_SOURCE_UPD";
  private static final String PROC_DELETE = "REPT_REQUESTING_SOURCE_DEL";

  public ReptRequestingSourceRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public List<RequestingSourceRecord> search(String name, Boolean external) {
    final String call = qualifyProjectProcedure(PROC_SEARCH, 2);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<List<RequestingSourceRecord>>) cs -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            setStringOrNull(cs, 2, name);
            setOptionalIndicator(cs, 3, external);
            cs.execute();
            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return List.of();
            }
            List<RequestingSourceRecord> rows = new ArrayList<>();
            try (rs) {
              while (rs.next()) {
                rows.add(mapRow(rs));
              }
            }
            rows.sort((a, b) -> compareSafe(a.name(), b.name()));
            return Collections.unmodifiableList(rows);
          });
    } catch (DataAccessException ex) {
      LOGGER.warn("{} search failed for package {}: {}", PROC_SEARCH, projectPackage, ex.getMessage(), ex);
      return List.of();
    }
  }

  @Transactional(readOnly = true)
  public Optional<RequestingSourceRecord> findById(Long id) {
    if (id == null) {
      return Optional.empty();
    }
    final String call = qualifyProjectProcedure(PROC_GET);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Optional<RequestingSourceRecord>>) cs -> {
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
      LOGGER.warn("{} get failed for package {}: {}", PROC_GET, projectPackage, ex.getMessage(), ex);
      return Optional.empty();
    }
  }

  @Transactional
  public RequestingSourceRecord insert(String name, boolean external, Long orgUnitNumber, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_INSERT, 6);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<RequestingSourceRecord>) cs -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setNull(1, Types.NUMERIC);
            cs.setNull(2, Types.NUMERIC);
            setIndicator(cs, 3, external);
            setStringOrNull(cs, 4, name);
            setLongOrNull(cs, 5, orgUnitNumber);
            setStringOrNull(cs, 6, userId);
            cs.execute();
            Long generatedId = cs.getObject(1, Long.class);
            Long revision = cs.getObject(2, Long.class);
            return new RequestingSourceRecord(generatedId, trim(name), external, orgUnitNumber, revision);
          });
    } catch (DuplicateKeyException ex) {
      throw new DuplicateDataException("This requesting source already exists", ex);
    }
  }

  @Transactional
  public RequestingSourceRecord update(
      Long id,
      Long revisionCount,
      String name,
      boolean external,
      Long orgUnitNumber,
      String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_UPDATE, 6);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<RequestingSourceRecord>) cs -> {
            cs.registerOutParameter(1, Types.NUMERIC);
            cs.registerOutParameter(2, Types.NUMERIC);
            cs.setLong(1, id);
            setLongOrNull(cs, 2, revisionCount);
            setIndicator(cs, 3, external);
            setStringOrNull(cs, 4, name);
            setLongOrNull(cs, 5, orgUnitNumber);
            setStringOrNull(cs, 6, userId);
            cs.execute();
            Long updatedId = cs.getObject(1, Long.class);
            Long updatedRevision = cs.getObject(2, Long.class);
            return new RequestingSourceRecord(
                updatedId != null ? updatedId : id,
                trim(name),
                external,
                orgUnitNumber,
                updatedRevision != null ? updatedRevision : revisionCount);
          });
    } catch (DuplicateKeyException ex) {
      throw new DuplicateDataException("This requesting source already exists", ex);
    }
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

  private RequestingSourceRecord mapRow(ResultSet rs) throws java.sql.SQLException {
    Long id = rs.getObject("REPT_REQUESTING_SOURCE_ID", Long.class);
    String name = trim(rs.getString("SOURCE_NAME"));
    Boolean external = readIndicator(rs, "EXTERNAL_ORG_IND");
    Long orgUnitNumber = rs.getObject("ORG_UNIT_NO", Long.class);
    Long revision = rs.getObject("REVISION_COUNT", Long.class);
    return new RequestingSourceRecord(id, name, Boolean.TRUE.equals(external), orgUnitNumber, revision);
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

  public record RequestingSourceRecord(
      Long id, String name, boolean external, Long orgUnitNumber, Long revisionCount) {}
}
