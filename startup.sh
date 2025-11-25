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

# Check if server.js exists
if [ ! -f "server.js" ]; then
  echo "ERROR: server.js not found!"
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

