# Clout.gg

A full-stack application with a Go backend, Next.js frontend, and PostgreSQL database.

## Quick Start with Docker

The easiest way to run the entire stack is with Docker Compose:

```bash
# Build and start all services (db, backend, frontend)
make docker-up

# Or run in detached mode
make docker-up-d
```

This will start:
- **PostgreSQL** database on port `5434`
- **Go backend** API on port `8080`
- **Next.js frontend** on port `3000`

Open http://localhost:3000 in your browser to access the application.

### Docker Commands

```bash
# Start all services
make docker-up

# Start in background
make docker-up-d

# View logs
make docker-logs

# View logs for specific service
make docker-logs-backend
make docker-logs-frontend
make docker-logs-db

# Stop all services
make docker-down

# Full cleanup (including images and volumes)
make clean-all
```

## Local Development

For local development with hot reloading, you can run services individually:

### Prerequisites

- Go 1.22+
- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
# Install dependencies
make install

# Generate protobuf and sqlc code
make generate
```

### Running Locally

```bash
# Start just the database
make db

# In one terminal, run the backend
make backend

# In another terminal, run the frontend
make frontend
```

Or run everything at once:

```bash
make dev
```

## Project Structure

```
.
├── backend/           # Go backend with Connect-RPC
│   ├── db/           # Database migrations
│   ├── internal/     # Internal packages
│   │   ├── db/       # Database connection and sqlc
│   │   ├── gen/      # Generated protobuf code
│   │   └── service/  # Business logic
│   └── main.go       # Entry point
├── frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/      # Next.js app router
│   │   └── lib/      # Shared utilities and generated code
│   └── package.json
├── proto/            # Protobuf definitions
│   └── apiv1/        # API v1 service definitions
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── Makefile
```

## Database Migrations

Migrations are managed with [golang-migrate](https://github.com/golang-migrate/migrate).

```bash
# Create a new migration
make migrate-create

# Run migrations (requires DATABASE_URL)
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up

# Rollback migrations
make migrate-down
```

## API

The backend uses [Connect-RPC](https://connectrpc.com/) for type-safe APIs. The API is defined in `proto/apiv1/api.proto`.

To regenerate the API client/server code after modifying protos:

```bash
make generate-proto
```

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable` | PostgreSQL connection string |
| `PORT` | `8080` | Server port |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API URL |
