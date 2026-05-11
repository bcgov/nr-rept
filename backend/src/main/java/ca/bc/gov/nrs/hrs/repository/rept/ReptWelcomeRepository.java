package ca.bc.gov.nrs.hrs.repository.rept;

import ca.bc.gov.nrs.hrs.dto.rept.ReptRecentProjectDto;
import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Profile("oracle")
public class ReptWelcomeRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(ReptWelcomeRepository.class);

  private static final RowMapper<ReptRecentProjectDto> ROW_MAPPER = (rs, rowNum) -> {
    Long id = rs.getObject("REPT_PROJECT_ID", Long.class);
    Long projectNumber = rs.getObject("PROJECT_NUMBER", Long.class);
    Timestamp requestTs = rs.getTimestamp("REQUEST_DATE");
    LocalDateTime requestDate = requestTs != null ? requestTs.toLocalDateTime() : null;

    String filePrefix = rs.getString("FILE_PREFIX");
    String fileSuffix = rs.getString("FILE_SUFFIX");
    String projectName = rs.getString("PROJECT_NAME");

    return new ReptRecentProjectDto(id, filePrefix, projectNumber, fileSuffix, projectName, requestDate);
  };

  private final JdbcTemplate jdbcTemplate;
  private final String packageName;

  public ReptWelcomeRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String packageName) {
    this.jdbcTemplate = jdbcTemplate;
    this.packageName = (packageName == null || packageName.isBlank())
        ? "REPT"
        : packageName.trim();
  }

  @Transactional(readOnly = true)
  public List<ReptRecentProjectDto> findRecentProjects(int limit) {
    final int sanitizedLimit = Math.max(1, limit);
    final String qualifiedCall = String.format("{? = call %s.REPT_PROJECT_FIND_RECENT(?)}", packageName);

    try {
      return jdbcTemplate.execute(
          qualifiedCall,
          (CallableStatement cs) -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setLong(2, sanitizedLimit);

            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            if (rs == null) {
              return List.of();
            }

            List<ReptRecentProjectDto> results = new ArrayList<>();
            try (rs) {
              int row = 0;
              while (rs.next()) {
                results.add(ROW_MAPPER.mapRow(rs, row++));
              }
            }
            return results;
          });
    } catch (DataAccessException e) {
      LOGGER.warn("REPT_PROJECT_FIND_RECENT failed for package {}: {}", packageName, e.getMessage(), e);
      return List.of();
    }
  }
}
