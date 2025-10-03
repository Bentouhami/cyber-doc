#!/usr/bin/env sh
set -e

# Optionnel : migrations Prisma en prod
if [ -f "./node_modules/.bin/prisma" ]; then
  echo "Applying Prisma migrations..."
  npx prisma migrate deploy
fi

echo "Starting Next.js app..."
# server.js est généré par Next en mode standalone
exec node server.js
