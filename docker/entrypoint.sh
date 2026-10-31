#!/usr/bin/env sh
set -e

echo "Starting Next.js app..."
# server.js est généré par Next en mode standalone
exec node server.js
