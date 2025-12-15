#!/bin/sh
set -e

echo "Running database migrations..."

# Run migrations in order
for migration in /app/migrations/*.sql; do
    echo "Applying migration: $migration"
    psql "$DATABASE_URL" -f "$migration"
done

echo "Migrations complete. Starting server..."
exec /app/server
