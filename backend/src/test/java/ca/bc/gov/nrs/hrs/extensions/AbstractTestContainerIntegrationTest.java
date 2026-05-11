package ca.bc.gov.nrs.hrs.extensions;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith({SpringExtension.class})
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ContextConfiguration
public abstract class AbstractTestContainerIntegrationTest {

  // Tests in the POC are not wired to start Testcontainers for Postgres.
  // Dynamic datasource wiring for Testcontainers has been removed to keep the test
  // harness lightweight for the proof-of-concept.

}
