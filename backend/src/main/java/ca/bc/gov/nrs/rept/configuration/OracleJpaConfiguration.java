package ca.bc.gov.nrs.rept.configuration;

import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Oracle-profile configuration. Spring Boot's standard DataSourceAutoConfiguration
 * builds the {@code DataSource}, {@code JdbcTemplate}, {@code EntityManagerFactory},
 * and {@code PlatformTransactionManager} from {@code spring.datasource.*} in
 * application-oracle.yml (URL, credentials, Hikari pool tuning, TCPS truststore properties).
 *
 * <p>This class adds two things on top:
 * <ul>
 *   <li>{@link #warmOraclePool} — forces eager pool initialization at startup so
 *       connectivity failures are caught at boot rather than deferred to the first request.</li>
 *   <li>{@link #oracleJdbcTemplate} — a named {@code JdbcTemplate} alias that repositories
 *       and {@code OracleSmokeController} inject via {@code @Qualifier("oracleJdbcTemplate")}.
 *       Wraps the same auto-configured {@code DataSource} that the default {@code jdbcTemplate}
 *       bean uses.</li>
 * </ul>
 */
@Configuration
@Profile("oracle")
public class OracleJpaConfiguration {

  /**
   * Forces eager Hikari pool initialization once the DataSource has its
   * properties fully bound. Throws on startup if the DB is unreachable, making
   * connectivity failures loud instead of deferred.
   */
  @Bean
  public InitializingBean warmOraclePool(DataSource dataSource) {
    return () -> {
      try (var ignored = dataSource.getConnection()) {
        // first getConnection() triggers Hikari pool initialization
      } catch (SQLException ex) {
        throw new IllegalStateException("Failed to validate Oracle DataSource at startup", ex);
      }
    };
  }

  /**
   * Named JdbcTemplate exposed for {@code @Qualifier("oracleJdbcTemplate")} consumers
   * (the repositories under {@code repository.rept} and {@code OracleSmokeController}).
   * Shares the auto-configured Hikari DataSource — there is no second pool.
   */
  @Bean(name = "oracleJdbcTemplate")
  public JdbcTemplate oracleJdbcTemplate(DataSource dataSource) {
    return new JdbcTemplate(dataSource);
  }
}
