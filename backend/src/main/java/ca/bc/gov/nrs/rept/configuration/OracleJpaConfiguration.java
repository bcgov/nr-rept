package ca.bc.gov.nrs.rept.configuration;

import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Oracle-profile configuration. Spring Boot's standard DataSourceAutoConfiguration
 * builds the {@code DataSource}, {@code JdbcTemplate}, {@code EntityManagerFactory},
 * and {@code PlatformTransactionManager} from {@code spring.datasource.*} in
 * application-oracle.yml (URL, credentials, Hikari pool tuning, TCPS truststore properties).
 *
 * <p>The only thing this class adds on top is {@link #warmOraclePool}, which forces eager
 * pool initialization at startup so connectivity failures are caught at boot rather than
 * deferred to the first request.</p>
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
}
