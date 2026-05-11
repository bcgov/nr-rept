### Builder Stage
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Copy Maven wrapper and pom.xml first for better caching
COPY pom.xml mvnw ./
COPY .mvn/ ./.mvn

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src
COPY scripts ./scripts

# Build the application
RUN ./mvnw package -DskipTests -Dskip.unit.tests=true

### Runtime Stage
FROM eclipse-temurin:21-jre-alpine

ARG PORT=3000

# Install required tools (openssl for certificate fetching)
RUN apk add --no-cache openssl curl bash

WORKDIR /app

# Copy the built JAR file
COPY --from=build /app/target/rept-backend.jar ./app.jar

# Copy certificate fetch script for Jasper Reports HTTPS
COPY --from=build /app/scripts/fetch-certificates.sh ./scripts/fetch-certificates.sh
RUN chmod +x ./scripts/fetch-certificates.sh

# Create startup script that fetches Jasper certs before starting the app
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Fetch Jasper Reports SSL certificates into Java truststore' >> /app/start.sh && \
    echo 'echo "Fetching Jasper Reports SSL certificates..."' >> /app/start.sh && \
    echo '/app/scripts/fetch-certificates.sh "$JAVA_HOME/lib/security/cacerts" changeit || echo "Warning: Certificate fetch had issues, continuing..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start the application' >> /app/start.sh && \
    echo 'echo "Starting REPT Backend..."' >> /app/start.sh && \
    echo 'exec java -jar /app/app.jar' >> /app/start.sh && \
    chmod +x /app/start.sh

# Create non-root user
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
USER appuser

# Expose port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

# Environment variables
ENV SPRING_PROFILES_ACTIVE=container \
    SERVER_PORT=${PORT}

ENTRYPOINT ["/app/start.sh"]