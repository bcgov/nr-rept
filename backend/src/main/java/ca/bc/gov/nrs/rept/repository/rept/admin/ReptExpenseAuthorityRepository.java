package ca.bc.gov.nrs.rept.repository.rept.admin;

import ca.bc.gov.nrs.rept.repository.rept.AbstractReptRepository;

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
public class ReptExpenseAuthorityRepository extends AbstractReptRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptExpenseAuthorityRepository.class);

  private static final String PROC_SEARCH = "REPT_EXPENSE_AUTHORITY_SEARCH";
  private static final String PROC_GET = "REPT_EXPENSE_AUTHORITY_GET";
  private static final String PROC_INSERT = "REPT_EXPENSE_AUTHORITY_INS";
  private static final String PROC_UPDATE = "REPT_EXPENSE_AUTHORITY_UPD";
  private static final String PROC_DELETE = "REPT_EXPENSE_AUTHORITY_DEL";

  public ReptExpenseAuthorityRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public List<ExpenseAuthorityRecord> search(String name, Boolean active) {
    final String call = qualifyProjectProcedure(PROC_SEARCH, 2);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<List<ExpenseAuthorityRecord>>) cs -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            setStringOrNull(cs, 2, name);
            setOptionalIndicator(cs, 3, active);
            cs.execute();
            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return List.of();
            }
            List<ExpenseAuthorityRecord> rows = new ArrayList<>();
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
  public Optional<ExpenseAuthorityRecord> findById(Long id) {
    if (id == null) {
      return Optional.empty();
    }
    final String call = qualifyProjectProcedure(PROC_GET);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Optional<ExpenseAuthorityRecord>>) cs -> {
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
  public ExpenseAuthorityRecord insert(String name, boolean active, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_INSERT, 4);
    return jdbcTemplate.execute(
        call,
        (CallableStatementCallback<ExpenseAuthorityRecord>) cs -> {
          cs.registerOutParameter(1, Types.NUMERIC);
          cs.setNull(1, Types.NUMERIC);
          setIndicator(cs, 2, active);
          setStringOrNull(cs, 3, name);
          setStringOrNull(cs, 4, userId);
          cs.execute();
          Long generatedId = cs.getObject(1, Long.class);
          return new ExpenseAuthorityRecord(generatedId, trim(name), active);
        });
  }

  @Transactional
  public ExpenseAuthorityRecord update(Long id, boolean active, String name, String userId) {
    final String call = qualifyProjectProcedureWithoutReturn(PROC_UPDATE, 4);
    return jdbcTemplate.execute(
        call,
        (CallableStatementCallback<ExpenseAuthorityRecord>) cs -> {
          cs.registerOutParameter(1, Types.NUMERIC);
          cs.setLong(1, id);
          setIndicator(cs, 2, active);
          setStringOrNull(cs, 3, name);
          setStringOrNull(cs, 4, userId);
          cs.execute();
          Long updatedId = cs.getObject(1, Long.class);
          return new ExpenseAuthorityRecord(updatedId != null ? updatedId : id, trim(name), active);
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

  private ExpenseAuthorityRecord mapRow(ResultSet rs) throws java.sql.SQLException {
    Long id = rs.getObject("EXPENSE_AUTHORITY_ID", Long.class);
    String name = trim(rs.getString("EXPENSE_AUTHORITY"));
    Boolean active = readIndicator(rs, "ACTIVE_IND");
    return new ExpenseAuthorityRecord(id, name, Boolean.TRUE.equals(active));
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

  public record ExpenseAuthorityRecord(Long id, String name, boolean active) {}
}
