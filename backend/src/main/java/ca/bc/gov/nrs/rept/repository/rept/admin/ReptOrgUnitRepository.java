package ca.bc.gov.nrs.rept.repository.rept.admin;

import ca.bc.gov.nrs.rept.repository.rept.AbstractReptRepository;

import java.sql.ResultSet;
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
public class ReptOrgUnitRepository extends AbstractReptRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptOrgUnitRepository.class);

  private static final String PROC_ORG_UNIT_GET = "ORG_UNIT_GET";
  private static final String PROC_ORG_UNIT_SEARCH = "ORG_UNIT_SEARCH";

  public ReptOrgUnitRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    super(jdbcTemplate, projectPackage, codeListPackage);
  }

  @Transactional(readOnly = true)
  public Optional<OrgUnitRecord> findByNumber(Long number) {
    if (number == null) {
      return Optional.empty();
    }

    final String call = qualifyProjectProcedure(PROC_ORG_UNIT_GET);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Optional<OrgUnitRecord>>) cs -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, number);
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
      LOGGER.warn("{} lookup failed for package {}: {}", PROC_ORG_UNIT_GET, projectPackage, ex.getMessage(), ex);
      return Optional.empty();
    }
  }

  @Transactional(readOnly = true)
  public List<OrgUnitRecord> searchByName(String name) {
    final String call = qualifyProjectProcedure(PROC_ORG_UNIT_SEARCH);
    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<List<OrgUnitRecord>>) cs -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            setStringOrNull(cs, 2, name);
            cs.execute();
            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return List.of();
            }
            List<OrgUnitRecord> rows = new ArrayList<>();
            try (rs) {
              while (rs.next()) {
                rows.add(mapRow(rs));
              }
            }
            rows.sort((a, b) -> compareSafe(a.name(), b.name()));
            return Collections.unmodifiableList(rows);
          });
    } catch (DataAccessException ex) {
      LOGGER.warn("{} search failed for package {}: {}", PROC_ORG_UNIT_SEARCH, projectPackage, ex.getMessage(), ex);
      return List.of();
    }
  }

  private OrgUnitRecord mapRow(ResultSet rs) throws java.sql.SQLException {
    Long number = rs.getObject("ORG_UNIT_NO", Long.class);
    String code = trim(rs.getString("ORG_UNIT_CODE"));
    String name = trim(rs.getString("ORG_UNIT_NAME"));
    return new OrgUnitRecord(number, code, name);
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

  public record OrgUnitRecord(Long number, String code, String name) {}
}
