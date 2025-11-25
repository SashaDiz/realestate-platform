#!/bin/sh
set -e

echo "========================================="
echo "Starting Real Estate Platform"
echo "========================================="
echo "Node version: $(node --version)"
echo "Environment: $NODE_ENV"
echo "Port: ${PORT:-3000}"
echo "Hostname: ${HOSTNAME:-0.0.0.0}"
echo ""

# Check critical environment variables
echo "Checking environment variables..."
MISSING_VARS=0

if [ -z "$DB_HOST" ]; then echo "❌ Missing: DB_HOST"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ DB_HOST is set"; fi
if [ -z "$DB_NAME" ]; then echo "❌ Missing: DB_NAME"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ DB_NAME is set"; fi
if [ -z "$DB_USER" ]; then echo "❌ Missing: DB_USER"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ DB_USER is set"; fi
if [ -z "$DB_PASSWORD" ]; then echo "❌ Missing: DB_PASSWORD"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ DB_PASSWORD is set"; fi
if [ -z "$JWT_SECRET" ]; then echo "❌ Missing: JWT_SECRET"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ JWT_SECRET is set"; fi
if [ -z "$ADMIN_PASSWORD" ]; then echo "❌ Missing: ADMIN_PASSWORD"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ ADMIN_PASSWORD is set"; fi
if [ -z "$S3_ENDPOINT" ]; then echo "❌ Missing: S3_ENDPOINT"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ S3_ENDPOINT is set"; fi
if [ -z "$S3_BUCKET_NAME" ]; then echo "❌ Missing: S3_BUCKET_NAME"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ S3_BUCKET_NAME is set"; fi
if [ -z "$S3_ACCESS_KEY" ]; then echo "❌ Missing: S3_ACCESS_KEY"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ S3_ACCESS_KEY is set"; fi
if [ -z "$S3_SECRET_KEY" ]; then echo "❌ Missing: S3_SECRET_KEY"; MISSING_VARS=$((MISSING_VARS + 1)); else echo "✓ S3_SECRET_KEY is set"; fi

if [ $MISSING_VARS -gt 0 ]; then
  echo ""
  echo "❌ ERROR: $MISSING_VARS required environment variable(s) missing!"
  echo "Please set all required environment variables."
  echo "See DEPLOYMENT.md for details."
  exit 1
fi

echo ""
echo "✓ All required environment variables are set"
echo ""

# Check if server.js exists
if [ ! -f "server.js" ]; then
  echo "❌ ERROR: server.js not found!"
  echo "Current directory contents:"
  ls -la
  exit 1
fi

echo "✓ server.js found"
echo "✓ Starting Node.js server..."
echo "========================================="
echo ""

# Use exec to replace the shell process with node
# This ensures proper signal handling (SIGTERM, SIGINT)
exec node server.js

