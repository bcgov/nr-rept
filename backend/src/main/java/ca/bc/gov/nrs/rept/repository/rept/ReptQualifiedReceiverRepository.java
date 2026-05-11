package ca.bc.gov.nrs.rept.repository.rept;

import java.sql.ResultSet;
import java.sql.Types;
import java.util.ArrayList;
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
public class ReptQualifiedReceiverRepository extends AbstractReptRepository {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ReptQualifiedReceiverRepository.class);

  private static final String PROC_SEARCH = "REPT_QUALIFIED_RECEIVER_SEARCH";
  private static final String PROC_GET = "REPT_QUALIFIED_RECEIVER_GET";
  private static final String PROC_INSERT = "REPT_QUALIFIED_RECEIVER_INS";
  private static final String PROC_UPDATE = "REPT_QUALIFIED_RECEIVER_UPD";
  private static final String PROC_DELETE = "REPT_QUALIFIED_RECEIVER_DEL";

  public ReptQualifiedReceiverRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public List<QualifiedReceiverRecord> search(String name, Boolean active) {
    final String call = qualifyProjectProcedure(PROC_SEARCH, 2);

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<List<QualifiedReceiverRecord>>) cs -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            setStringOrNull(cs, 2, name);
            setOptionalIndicator(cs, 3, active);
            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return List.of();
            }

            List<QualifiedReceiverRecord> results = new ArrayList<>();
            try (rs) {
              while (rs.next()) {
                results.add(mapRow(rs));
              }
            }
            return List.copyOf(results);
          });
    } catch (DataAccessException ex) {
      LOGGER.warn("{} failed for package {}: {}", PROC_SEARCH, projectPackage, ex.getMessage(), ex);
      return List.of();
    }
  }

  @Transactional(readOnly = true)
  public Optional<QualifiedReceiverRecord> findById(Long id) {
    if (id == null) {
      return Optional.empty();
    }

    final String call = qualifyProjectProcedure(PROC_GET);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Optional<QualifiedReceiverRecord>>) cs -> {
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
      LOGGER.warn("{} failed for package {}: {}", PROC_GET, projectPackage, ex.getMessage(), ex);
      return Optional.empty();
    }
  }

  @Transactional
  public QualifiedReceiverRecord insert(String name, boolean active, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_INSERT, 4);
    String normalizedName = trim(name);

    return jdbcTemplate.execute(
        call,
        (CallableStatementCallback<QualifiedReceiverRecord>) cs -> {
          cs.registerOutParameter(1, Types.NUMERIC);
          cs.setNull(1, Types.NUMERIC);
          setIndicator(cs, 2, active);
          setStringOrNull(cs, 3, normalizedName);
          setStringOrNull(cs, 4, userId);

          cs.execute();
          Long generatedId = cs.getObject(1, Long.class);
          return new QualifiedReceiverRecord(generatedId, normalizedName, active);
        });
  }

  @Transactional
  public QualifiedReceiverRecord update(Long id, boolean active, String name, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_UPDATE, 4);
    String normalizedName = trim(name);

    return jdbcTemplate.execute(
        call,
        (CallableStatementCallback<QualifiedReceiverRecord>) cs -> {
          cs.registerOutParameter(1, Types.NUMERIC);
          cs.setLong(1, id);
          setIndicator(cs, 2, active);
          setStringOrNull(cs, 3, normalizedName);
          setStringOrNull(cs, 4, userId);

          cs.execute();
          Long updatedId = cs.getObject(1, Long.class);
          return new QualifiedReceiverRecord(updatedId != null ? updatedId : id, normalizedName, active);
        });
  }

  @Transactional
  public void delete(Long id) {
    if (id == null) {
      return;
    }

    final String call = qualifyProjectProcedureWithoutReturn(PROC_DELETE, 1);
    jdbcTemplate.execute(
        call,
        (CallableStatementCallback<Void>) cs -> {
          cs.setLong(1, id);
          cs.execute();
          return null;
        });
  }

  private QualifiedReceiverRecord mapRow(ResultSet rs) throws java.sql.SQLException {
    Long id = rs.getObject("QUALIFIED_RECEIVER_ID", Long.class);
    String name = trim(rs.getString("QUALIFIED_RECEIVER"));
    Boolean active = readIndicator(rs, "ACTIVE_IND");
    return new QualifiedReceiverRecord(id, name, Boolean.TRUE.equals(active));
  }

  public record QualifiedReceiverRecord(Long id, String name, boolean active) {
  }
}
