#!/bin/sh
set -e
if [ -n "$DATABASE_URL" ]; then
  echo "Applying Prisma schema to database..."
  npx prisma db push --skip-generate
fi
exec npx next start -p 3005 -H 0.0.0.0
