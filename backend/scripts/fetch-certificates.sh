#!/bin/bash
# ===========================================
# Certificate Fetch Script for REPT Backend
# ===========================================
# This script downloads SSL certificates from Jasper reporting servers
# and imports them into a Java keystore for HTTPS connections.
#
# Usage: ./scripts/fetch-certificates.sh [keystore-path] [keystore-password]
#

set -e

KEYSTORE_PATH="${1}"
KEYSTORE_PASSWORD="${2}"

# Jasper Reports server certificates (HTTPS endpoints)
CERT_HOSTS=(
    "testapps.nrs.bcgov:443"
    "apps.nrs.bcgov:443"
    "devapps.nrs.bcgov:443"
)

echo "🔐 REPT Certificate Fetch Script"
echo "=================================="
echo "Keystore: $KEYSTORE_PATH"
echo ""

# Create a temporary directory for certificates
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Note: Keystore should already be initialized with system cacerts
# We will only add custom certificates to it

# Fetch and import certificates
for HOST_PORT in "${CERT_HOSTS[@]}"; do
    HOST=$(echo $HOST_PORT | cut -d: -f1)
    PORT=$(echo $HOST_PORT | cut -d: -f2)
    ALIAS=$(echo $HOST | tr '.' '-')
    CERT_FILE="$TEMP_DIR/${ALIAS}.crt"

    echo "📥 Fetching certificate from $HOST:$PORT..."

    # Fetch the certificate
    if echo | openssl s_client -showcerts -connect "$HOST_PORT" -servername "$HOST" 2>/dev/null | \
       openssl x509 -outform PEM > "$CERT_FILE" 2>/dev/null; then

        # Check if certificate was actually retrieved
        if [ -s "$CERT_FILE" ]; then
            echo "📦 Importing certificate as alias: $ALIAS"
            keytool -importcert \
                -alias "$ALIAS" \
                -file "$CERT_FILE" \
                -keystore "$KEYSTORE_PATH" \
                -storepass "$KEYSTORE_PASSWORD" \
                -storetype JKS \
                -noprompt 2>/dev/null
            echo "✅ Successfully imported $HOST"
        else
            echo "⚠️  Warning: Could not fetch certificate from $HOST (empty response)"
        fi
    else
        echo "⚠️  Warning: Could not connect to $HOST:$PORT"
    fi
    echo ""
done

# List certificates in keystore
echo "📋 Certificates in keystore:"
echo "----------------------------"
keytool -list -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASSWORD" 2>/dev/null | grep -E "^[a-z]" || true

echo ""
echo "✅ Certificate fetch complete!"
echo "   Keystore location: $KEYSTORE_PATH"
