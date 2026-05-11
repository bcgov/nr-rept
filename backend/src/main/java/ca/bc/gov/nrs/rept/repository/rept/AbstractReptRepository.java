package ca.bc.gov.nrs.rept.repository.rept;

import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import oracle.jdbc.OracleTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Shared Oracle helper for REPT stored procedure access. Provides basic string/date conversion
 * utilities and a consistent way to call code-list packages. Concrete repositories should call
 * {@link #qualifyProjectProcedure(String)} for REPT package procedures and
 * {@link #loadCodeList(String)} when dereferencing code-table values.
 */
public abstract class AbstractReptRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(AbstractReptRepository.class);

  protected final JdbcTemplate jdbcTemplate;
  protected final String projectPackage;
  protected final String codeListPackage;

  protected AbstractReptRepository(
      @Qualifier("oracleJdbcTemplate") JdbcTemplate jdbcTemplate,
      @Value("${rept.package-name:REPT}") String projectPackage,
      @Value("${rept.codelist-package-name:REPT_CODELIST}") String codeListPackage) {
    this.jdbcTemplate = jdbcTemplate;
    this.projectPackage = normalizePackage(projectPackage, "REPT");
    this.codeListPackage = normalizePackage(codeListPackage, "REPT_CODELIST");
  }

  protected String qualifyProjectProcedure(String procedureName) {
    return buildProcedureCall(procedureName, 1, true);
  }

  protected String qualifyProjectProcedure(String procedureName, int parameterCount) {
    return buildProcedureCall(procedureName, parameterCount, true);
  }

  protected String qualifyProjectProcedureWithoutReturn(String procedureName, int parameterCount) {
    return buildProcedureCall(procedureName, parameterCount, false);
  }

  private String buildProcedureCall(String procedureName, int parameterCount, boolean hasReturn) {
    if (parameterCount < 0) {
      throw new IllegalArgumentException("parameterCount must be >= 0");
    }

    StringBuilder builder = new StringBuilder();
    if (hasReturn) {
      builder.append("{? = call ");
    } else {
      builder.append("{call ");
    }

    builder.append(projectPackage).append('.').append(procedureName);

    if (parameterCount > 0) {
      builder.append('(');
      for (int i = 0; i < parameterCount; i++) {
        if (i > 0) {
          builder.append(',');
        }
        builder.append('?');
      }
      builder.append(')');
    }

    builder.append('}');
    return builder.toString();
  }

  protected Map<String, String> loadCodeList(String procedureName) {
    return loadCodeList(procedureName, new Object[0]);
  }

  protected Map<String, String> loadCodeList(String procedureName, Object... extraArgs) {
    final int additionalArgs = extraArgs == null ? 0 : extraArgs.length;
    final String call = qualifyCodeListProcedure(procedureName, 1 + additionalArgs);
    final Timestamp now = new Timestamp(System.currentTimeMillis());

    try {
      return jdbcTemplate.execute(
          call,
          (CallableStatementCallback<Map<String, String>>) cs -> {
            cs.registerOutParameter(1, OracleTypes.CURSOR);
            cs.setTimestamp(2, now);

            int parameterIndex = 3;
            if (additionalArgs > 0) {
              for (Object arg : extraArgs) {
                if (arg == null) {
                  cs.setNull(parameterIndex++, Types.VARCHAR);
                } else {
                  cs.setObject(parameterIndex++, arg);
                }
              }
            }

            cs.execute();

            ResultSet rs = (ResultSet) cs.getObject(1);
            Map<String, String> results = new LinkedHashMap<>();
            if (rs == null) {
              return results;
            }

            try (rs) {
              while (rs.next()) {
                String key = trim(rs.getString(1));
                String value = trim(rs.getString(2));
                if (key != null) {
                  results.put(key, value);
                }
              }
            }
            return results;
          });
    } catch (DataAccessException e) {
      LOGGER.warn("{} lookup failed for package {}: {}", procedureName, codeListPackage, e.getMessage(), e);
      return Map.of();
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

  protected Optional<String> lookupLabel(String procedureName, String key) {
    if (key == null || key.isBlank()) {
      return Optional.empty();
    }
    Map<String, String> codes = loadCodeList(procedureName);
    String label = codes.get(key);
    return Optional.ofNullable(label != null ? label : key);
  }

  protected LocalDate toLocalDate(Timestamp timestamp) {
    if (timestamp == null) {
      return null;
    }
    LocalDateTime dateTime = timestamp.toLocalDateTime();
    return dateTime.toLocalDate();
  }

  protected LocalDate toLocalDate(java.sql.Date date) {
    if (date == null) {
      return null;
    }
    return date.toLocalDate();
  }

  protected void setStringOrNull(CallableStatement cs, int index, String value) throws SQLException {
    String normalized = trim(value);
    if (normalized == null || normalized.isBlank()) {
      cs.setNull(index, Types.VARCHAR);
    } else {
      cs.setString(index, normalized);
    }
  }

  protected void setLongOrNull(CallableStatement cs, int index, Long value) throws SQLException {
    if (value == null) {
      cs.setNull(index, Types.NUMERIC);
    } else {
      cs.setLong(index, value);
    }
  }

  protected void setIndicator(CallableStatement cs, int index, Boolean value) throws SQLException {
    cs.setString(index, indicatorValue(value));
  }

  protected void setOptionalIndicator(CallableStatement cs, int index, Boolean value)
      throws SQLException {
    String indicator = toNullableIndicator(value);
    if (indicator == null) {
      cs.setNull(index, Types.VARCHAR);
    } else {
      cs.setString(index, indicator);
    }
  }

  protected void setDateOrNull(CallableStatement cs, int index, java.time.LocalDate value)
      throws SQLException {
    if (value == null) {
      cs.setNull(index, Types.DATE);
    } else {
      cs.setDate(index, java.sql.Date.valueOf(value));
    }
  }

  protected Boolean readIndicator(ResultSet rs, String columnLabel) throws SQLException {
    String value = trim(rs.getString(columnLabel));
    if (value == null) {
      return null;
    }
    return Boolean.valueOf("Y".equalsIgnoreCase(value));
  }

  private String indicatorValue(Boolean value) {
    return Boolean.TRUE.equals(value) ? "Y" : "N";
  }

  private String toNullableIndicator(Boolean value) {
    if (value == null) {
      return null;
    }
    return indicatorValue(value);
  }

  protected String trim(String value) {
    return value == null ? null : value.trim();
  }

  protected String toCode(Long value) {
    return value == null ? null : Long.toString(value);
  }

  protected String toCode(java.math.BigDecimal value) {
    return value == null ? null : value.stripTrailingZeros().toPlainString();
  }

  protected String normalizePackage(String candidate, String defaultValue) {
    if (candidate == null || candidate.isBlank()) {
      return defaultValue;
    }
    return candidate.trim();
  }

}
