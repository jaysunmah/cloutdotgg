#!/bin/sh
set -e

echo "Running database migrations..."

# Run migrations using golang-migrate
# The -path flag points to the migrations directory
# The -database flag uses the DATABASE_URL environment variable
# The "up" command applies all pending migrations
migrate -path /app/migrations -database "$DATABASE_URL" up

echo "Migrations complete. Starting server..."
exec /app/server
