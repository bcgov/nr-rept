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
| `KEYCLOAK_ISSUER_URI` | BC Gov SSO realm issuer URI | - |
| `KEYCLOAK_CLIENT_ID` | CSS integration client id; checked as the token's `azp` | - |
| `USER_LOOKUP_BASE_URL` | nr-user-lookup-api base URL (IDIR directory) | - |
| `USER_LOOKUP_TOKEN_URL` | Keycloak token endpoint for `client_credentials` | - |
| `USER_LOOKUP_CLIENT_ID` | REPT's Keycloak service-account client id | - |
| `USER_LOOKUP_CLIENT_SECRET` | REPT's Keycloak service-account secret | - |
| `USER_LOOKUP_SCOPE` | Optional explicit scope request (normally blank) | - |
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

## 🔐 Authentication

The backend is a **resource server only** — it validates BC Gov SSO (Keycloak) access tokens and never performs a login redirect. All of it lives in `security/Oauth2SecurityCustomizer`.

### Roles come from `client_roles`

CSS emits the caller's roles for the client the token was issued to as `client_roles`; stock Keycloak puts the same information under `resource_access.<azp>.roles`. **Both are read**, `client_roles` first, because which one appears depends on the realm's mappers.

Role codes are unchanged from the Cognito groups they replace — `REPT_ADMIN` and `REPT_VIEWER`, matched verbatim by `ApiAuthorizationCustomizer`. REPT scopes no role by district, region or forest client, so FAM's scope-suffix grammar (`<CODE>_DISTRICT-DCC`) never appears on a REPT token and exact matching stays correct.

FAM's own bookkeeping roles do reach the token, though: a grant given an expiry date is recorded in CSS as a role assigned to the person, shaped `FAM:EXPIRES:2026-09-30:REPT_ADMIN`. Anything `FAM:`-prefixed is filtered out before authorities are built.

### The `azp` check

Every token must carry `KEYCLOAK_CLIENT_ID` as its `azp` claim, or it is refused with `invalid_token`.

**Why it's needed.** The BC Gov standard realm is shared. Other applications' clients issue tokens signed by the same issuer and verifiable against the same JWKS, so *signature and issuer validation alone do not establish that a token was meant for REPT* — only that the realm minted it.

`client_roles` limits the blast radius in practice, since another client's token carries that client's roles and wouldn't hold `REPT_ADMIN`. But that's a property of how CSS happens to populate the claim rather than a control this service enforces, and it's exactly the sort of implicit guarantee that stops holding the moment someone adds a role mapper. FAM enforces the same rule through its `FamClientTokenFilter`.

The expected client id is configuration rather than a constant: it differs per environment, and a deployment pointed at the wrong realm should fail loudly instead of accepting whatever that realm signs. The refusal message names no client id — the caller holds a valid token for *some* client and doesn't need to be told which one this API wants; the mismatch is logged instead.

> This check replaced a Cognito-era validator that rejected any token whose `token_use` claim wasn't `"access"`. **Keycloak emits no `token_use` claim at all**, so that validator would have failed every single request.

### Identity claims

Profile claims ride the access token, following the [SSO identity-mappers reference](https://bcgov.github.io/sso-docs/advanced/identity-mappers#idir---mfa) for the **IDIR - MFA** integration: `idir_username`, `idir_user_guid`, `identity_provider`, `display_name`, `given_name`, `family_name`, `email`.

That's what let `CognitoUserInfoService` be deleted — Cognito carried these on the ID token only, so the backend used to call `/oauth2/userInfo` on every request behind a five-minute cache. One external dependency is now gone from the request path.

> **`azureidir` is normalised to `IDIR`.** `JwtPrincipalUtil.getUserId()` builds the `IDIR\jsmith` string written to `create_user` / `update_user` across ten services, and those columns hold years of `IDIR\`-prefixed rows. The realm reports `azureidir`, so passing it through would start writing `AZUREIDIR\jsmith` for the same person — nothing would error, no test would fail, and the audit trail would simply stop joining up from the day of the cutover.

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
| Users | `/api/rept/users/search` | IDIR user search via [nr-user-lookup-api](#user-directory-nr-user-lookup-api). |

## User directory (nr-user-lookup-api)

REPT resolves IDIR user details — display name, email — from
[nr-user-lookup-api](https://github.com/bcgov/nr-user-lookup-api), the shared BC Gov identity
service. This **replaces the FAM identity-lookup integration** REPT used previously: the app no
longer calls FAM for user lookups. FAM (through BC Gov SSO) is still where *authorisation* comes
from — it administers the REPT roles — just not the directory.

All calls go through `client/UserLookupClient`, against base path `/api/v1/user-lookup`:

| Method | Endpoint | Used for |
|--------|----------|----------|
| `searchIdir(userId, firstName, lastName, pageSize)` | `POST /idir-users/search` | partial-match IDIR search behind `GET /api/rept/users/search` (the "Find user" modal) |
| `getIdirDetail(userId)` | `GET /idir-account-detail` | exact IDIR lookup by username (`findByUserId`) |

### Authentication — service account, not the caller's token

The old FAM integration forwarded the caller's JWT downstream. That's gone. **Every**
nr-user-lookup-api call now authenticates with REPT's own Keycloak
`grant_type=client_credentials` bearer token (`client/ClientCredentialsTokenSource`, which caches
the access token until ~60s before expiry). nr-user-lookup-api validates the service account's
default client scopes, not an end-user token.

If the token-url / client-id / client-secret trio is unset the client has no credentials and calls
go out unauthenticated; `UserLookupClient` logs its active mode at startup. Set all three or none —
a partial trio fails fast at startup.

### Keycloak provisioning

`.github/scripts/ensure-keycloak-service-account.sh` idempotently creates the `nr-rept-backend`
confidential service-account client in each environment's realm and assigns the scopes REPT needs
(`user-lookup:idir:search`, `user-lookup:idir:read`) as **default** client scopes. It runs from
`reusable-deploy.yml` before the backend deploy and hands the resulting client id/secret to the
deploy step as masked outputs. The scopes themselves are owned by nr-user-lookup-api — this script
only wires our client to scopes that already exist, and errors if one is missing.

The step is skipped when `KEYCLOAK_SA_CLIENT_ID` isn't configured (e.g. PR previews), so those
deploys go out with blank `USER_LOOKUP_*` and degrade to an empty directory.

Repository/environment secrets it needs: `KEYCLOAK_SA_CLIENT_ID`, `KEYCLOAK_SA_CLIENT_SECRET`
(an admin service account holding realm-management `manage-clients`), `KEYCLOAK_ISSUER_URI`
(`…/realms/<realm>` — the token URL is derived from it), and `USER_LOOKUP_BASE_URL`.

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
- Per-PR redirect URIs handled via slot bucketing (see root README).

Upstream conventions for build/deploy actions, OpenShift templates, and PR preview environments still apply where unmodified; check the quickstart for context if something looks unfamiliar.

## Resources

[NRM Architecture Confluence: GitHub Repository Best Practices](https://apps.nrs.gov.bc.ca/int/confluence/x/TZ_9CQ)
