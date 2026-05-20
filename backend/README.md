# REPT Backend

Spring Boot backend service for the Real Estate Project Tracking application.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 | Runtime |
| Spring Boot | 3.5.x | Framework |
| Spring Security | 6.5.x | OAuth2 Resource Server + JWT |
| Oracle JDBC | 21.3.x (ojdbc11) | Database connectivity (TCPS to BC Gov shared Oracle) |
| Undertow | 2.3.x | Embedded HTTP server (Tomcat excluded) |
| JasperReports | 6.21.5 | PDF report generation (embedded library) |
| Lombok | 1.18.x | Boilerplate reduction |
| Resilience4j | 2.3.x | Circuit breaker / retry |

## 🚀 Running Locally

See the [root README's Local Development section](../README.md#local-development) — both the direct (`mvn spring-boot:run`) and Docker Compose workflows are documented there in one place, alongside the property-file setup (`application-local.yml`, `jssecacerts` truststore).

## 🔧 Configuration

### Environment Variables

In OpenShift deployments these come from the K8s Secret built by `openshift.deploy.yml`. For local dev they live in `application-local.yml` (see root README for setup).

| Variable | Description             | Default |
|----------|-------------------------|---------|
| `SERVER_PORT` | Server port             | 8080 |
| `SPRING_PROFILES_ACTIVE` | Active profiles         | oracle |
| `AWS_COGNITO_ISSUER_URI` | Cognito issuer URI      | - |
| `COGNITO_USERINFO_URI` | Cognito /oauth2/userInfo endpoint | - |
| `IDENTITY_LOOKUP_BASE_URL` | FAM IDIR lookup API     | - |
| `DATABASE_HOST` | Oracle DB host          | - |
| `DATABASE_SERVICE_NAME` | Oracle service name     | - |
| `DATABASE_USER` | DB username             | - |
| `DATABASE_PASSWORD` | DB password             | - |
| `TRUSTSTORE_PATH` | Path to `jssecacerts` JKS | - |
| `KEYSTORE_SECRET` | Truststore passphrase   | - |
| `ALLOWED_ORIGINS` | CORS origins            | http://localhost:3000 |

### Spring Profiles

| Profile | Description |
|---------|-------------|
| `oracle` | Oracle datasource + JPA dialect; required in all environments. |
| `local`  | Local-dev only. Loads `application-local.yml` so credentials don't need to be exported as env vars. Activate alongside `oracle` (`SPRING_PROFILES_ACTIVE=local,oracle`). |

## API Endpoints

Grouped by area; see the `controller/` package for full request/response shapes. All `/api/rept/*` routes are bearer-token-protected and require either `REPT_ADMIN` or `REPT_VIEWER` (writes are admin-only).

| Area | Base path | Notes |
|---|---|---|
| Actuator | `/actuator/health`, `/actuator/prometheus` | Public; used by OpenShift probes + Prometheus scrape. |
| Reports | `POST /api/reports/{reportId}` | Generates a PDF via the embedded JasperReports engine. |
| Project search | `/api/rept/projects/search`, `.../options`, `.../file-suffixes` | List + filter-option lookups. |
| Project properties | `/api/rept/projects/{projectId}/properties` and `.../{propertyId}/contacts` | Property list + per-property contact CRUD. |
| Project contacts | `/api/rept/projects/{projectId}/contacts` (+`/options`, `/search`) | Per-project contact association CRUD. |
| Acquisition requests | `/api/rept/projects/{projectId}/acquisition-request` (+`/options`) | GET/POST/PUT — per-project AR record. |
| Admin: contacts | `/api/rept/admin/contacts` | CRUD; `REPT_ADMIN` only. |
| Admin: co-users | `/api/rept/admin/co-users` | CRUD; `REPT_ADMIN` only. |
| Admin: org units | `/api/rept/admin/org-units`, `.../{number}` | Read-only reference data. |
| Users | `/api/rept/users/search` | IDIR user search via FAM API. |

## 🧪 Testing

```bash
# Run all tests
mvn test

# Run with coverage
mvn test -Pcoverage

# Skip tests during build
mvn package -DskipTests
```

## 📁 Project Structure

```
backend/
├── src/main/java/ca/bc/gov/nrs/rept/
│   ├── ReptApiApplication.java # Spring Boot entry point
│   ├── ReptApiConstants.java   # Shared constants (role names, etc.)
│   ├── configuration/          # Spring + Web + Security config beans
│   ├── controller/             # REST controllers (see API Endpoints above)
│   ├── dto/                    # Request / response records
│   ├── entity/                 # JPA entities (Oracle-mapped)
│   ├── exception/              # @ControllerAdvice + custom exceptions
│   ├── repository/             # Spring Data repositories
│   ├── security/               # CSRF cookie filter, role mapper
│   ├── service/                # Business logic (incl. report.*)
│   └── util/                   # Utilities
└── src/main/resources/
    ├── application.yml         # Main config (always loaded)
    ├── application-oracle.yml  # `oracle` profile — datasource + JPA + TCPS
    ├── application-local.yml   # `local` profile — credentials (gitignored)
    ├── cert/jssecacerts        # Oracle TLS truststore (gitignored)
    └── reports/                # JRXML report templates compiled at runtime
```

## Origins

This repo was scaffolded from [bcgov/quickstart-openshift](https://github.com/bcgov/quickstart-openshift), then specialised for REPT's needs:

- Database swapped from Postgres to BC Gov shared Oracle (TCPS connection, JKS truststore).
- Reports run via the embedded JasperReports library — no remote Jasper server.
- Per-PR Cognito callback URIs handled via slot bucketing (see root README).

Upstream conventions for build/deploy actions, OpenShift templates, and PR preview environments still apply where unmodified; check the quickstart for context if something looks unfamiliar.

## Resources

[NRM Architecture Confluence: GitHub Repository Best Practices](https://apps.nrs.gov.bc.ca/int/confluence/x/TZ_9CQ)
