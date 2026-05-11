# REPT Backend

Spring Boot backend service for the Real Estate Project Tracking application.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 | Runtime |
| Spring Boot | 3.5.x | Framework |
| Spring Security | 6.x | Authentication/Authorization |
| Oracle JDBC | 21.x | Database connectivity |
| Lombok | - | Boilerplate reduction |
| Resilience4j | 2.3.x | Circuit breaker/retry |

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Maven 3.9+
- Oracle Database access

### Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   # Required variables
   DATABASE_HOST=your-oracle-host
   DATABASE_PORT=1521
   SERVICE_NAME=your-service
   DATABASE_USER=your-user
   DATABASE_PASSWORD=your-password
   AWS_COGNITO_ISSUER_URI=https://cognito-idp.ca-central-1.amazonaws.com/YOUR_POOL_ID
   IDENTITY_LOOKUP_BASE_URL=<FAM API URL>
   J_URL_FETCH=https://testapps.nrs.bcgov/ext/jcrs/rest_v2/reports/JCRS/REPT/
   J_USERNAME=your-jasper-user
   J_PASSWORD=your-jasper-password
   ```

### Running Locally

**Option 1: Using environment variables**
```bash
# Export all variables from .env
export $(grep -v '^#' .env | xargs)

# Run the application
./mvnw spring-boot:run
```

**Option 2: Using shell script**
```bash
# Set environment variables
export DATABASE_HOST='your-host'
export SERVICE_NAME='your-service'
export DATABASE_USER='your-user'
export DATABASE_PASSWORD='your-password'
export AWS_COGNITO_ISSUER_URI='https://cognito-idp.ca-central-1.amazonaws.com/YOUR_POOL_ID'
export IDENTITY_LOOKUP_BASE_URL='FAM-API-URL'
export SPRING_PROFILES_ACTIVE=oracle
export J_URL_FETCH='https://testapps.nrs.bcgov/ext/jcrs/rest_v2/reports/JCRS/REPT/'
export J_USERNAME='your-jasper-user'
export J_PASSWORD='your-jasper-password'

# Run
./mvnw spring-boot:run
```

### Running with Docker

```bash
# Build the image
docker build -t rept-backend .

# Run with environment variables
docker run -p 8080:8080 \
  -e DATABASE_HOST=your-host \
  -e SERVICE_NAME=your-service \
  -e DATABASE_USER=your-user \
  -e DATABASE_PASSWORD=your-password \
  -e AWS_COGNITO_ISSUER_URI=https://cognito-idp.ca-central-1.amazonaws.com/YOUR_POOL_ID \
  -e IDENTITY_LOOKUP_BASE_URL=fam-api-url \
  -e J_URL_FETCH=https://testapps.nrs.bcgov/ext/jcrs/rest_v2/reports/JCRS/REPT/ \
  -e J_USERNAME=your-jasper-user \
  -e J_PASSWORD=your-jasper-password \
  rept-backend
```

## 🔧 Configuration

### Environment Variables

| Variable | Description             | Default |
|----------|-------------------------|---------|
| `SERVER_PORT` | Server port             | 8080 |
| `SPRING_PROFILES_ACTIVE` | Active profiles         | oracle |
| `AWS_COGNITO_ISSUER_URI` | Cognito issuer URI      | - |
| `IDENTITY_LOOKUP_BASE_URL` | FAM API URI             | - |
| `DATABASE_HOST` | Oracle DB host          | - |
| `SERVICE_NAME` | Oracle service name     | - |
| `DATABASE_USER` | DB username             | - |
| `DATABASE_PASSWORD` | DB password             | - |
| `J_URL_FETCH` | Jasper Reports URL      | - |
| `J_USERNAME` | Jasper username         | - |
| `J_PASSWORD` | Jasper password         | - |
| `APP_SECURITY_DISABLED` | Disable auth (dev only) | false |
| `ALLOWED_ORIGINS` | CORS origins            | http://localhost:3000 |

### Spring Profiles

| Profile | Description |
|---------|-------------|
| `oracle` | Oracle database connection |
| `container` | Container-optimized settings |

##  API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/actuator/health` | GET | Health check |
| `/api/rept/welcome/recent` | GET | Recent projects |
| `/api/rept/projects` | GET | Project search |
| `/api/rept/projects/{id}` | GET | Project details |
| `/api/rept/reports/**` | GET | Report endpoints |

## 🧪 Testing

```bash
# Run all tests
./mvnw test

# Run with coverage
./mvnw test -Pall-tests

# Skip tests during build
./mvnw package -DskipTests
```

## 📁 Project Structure

```
backend/
├── src/main/java/ca/bc/gov/nrs/hrs/
│   ├── configuration/    # Spring configuration
│   ├── controller/       # REST controllers
│   ├── dto/              # Data transfer objects
│   ├── entity/           # JPA entities
│   ├── exception/        # Custom exceptions
│   ├── provider/         # External service providers
│   ├── repository/       # Data repositories
│   ├── security/         # Security customizers
│   ├── service/          # Business logic
│   └── util/             # Utilities
└── src/main/resources/
    ├── application.yml         # Main config
    └── application-oracle.yml  # Oracle profile
```

<!-- README.md.tpl:START -->

## Working With the Polaris Pipeline

This repository uses the Polaris Pipeline to build and deploy.

Refer to [nr-polaris-docs](https://github.com/bcgov/nr-polaris-docs) for more information about how to use the Polaris Pipeline.

## Resources

[NRM Architecture Confluence: GitHub Repository Best Practices](https://apps.nrs.gov.bc.ca/int/confluence/x/TZ_9CQ)

<!-- README.md.tpl:END -->
