package ca.bc.gov.nrs.rept.configuration;

import com.zaxxer.hikari.HikariDataSource;
import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateProperties;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateSettings;
import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * Oracle DataSource and optional JPA wiring. Active when Spring profile `oracle` is enabled.
 */
@Configuration
@Profile("oracle")
public class OracleJpaConfiguration {

  @Bean(name = "oracleDataSource")
  @ConfigurationProperties(prefix = "spring.oracle.hikari")
  public HikariDataSource oracleDataSource() {
    // Let Spring bind the Hikari properties (jdbcUrl, username, password, pool settings)
    return DataSourceBuilder.create().type(HikariDataSource.class).build();
  }

  @Bean
  public JdbcTemplate oracleJdbcTemplate(@Qualifier("oracleDataSource") DataSource ds) {
    return new JdbcTemplate(ds);
  }

  @Bean(name = "entityManagerFactory")
  public LocalContainerEntityManagerFactoryBean oracleEntityManagerFactory(
      @Qualifier("oracleDataSource") DataSource dataSource,
      JpaProperties jpaProperties,
      HibernateProperties hibernateProperties) {

    LocalContainerEntityManagerFactoryBean emf = new LocalContainerEntityManagerFactoryBean();
    emf.setDataSource(dataSource);
    // package scanning left broad — adjust if you have Oracle entities in a specific package
    emf.setPackagesToScan("ca.bc.gov.nrs.rept");
    emf.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

    Map<String, Object> props = new HashMap<>(jpaProperties.getProperties());
    props.putAll(hibernateProperties.determineHibernateProperties(new HashMap<>(), new HibernateSettings()));
    // sensible default for Oracle dialect; can be overridden in application-oracle.yml
    props.putIfAbsent("hibernate.dialect", "org.hibernate.dialect.OracleDialect");

    emf.setJpaPropertyMap(props);
    return emf;
  }

  @Bean(name = "transactionManager")
  public PlatformTransactionManager oracleTransactionManager(
      LocalContainerEntityManagerFactoryBean oracleEntityManagerFactory) {
    JpaTransactionManager tx = new JpaTransactionManager();
    tx.setEntityManagerFactory(oracleEntityManagerFactory.getObject());
    return tx;
  }

}
