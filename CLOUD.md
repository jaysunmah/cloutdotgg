# Cloud VM Development Environment Setup

This document describes the VM environment setup for the CloutGG project, including all installed dependencies and development workflows.

## VM Environment Overview

This VM has been configured for full-stack development of the CloutGG application, which consists of:
- **Backend**: Go 1.22.2 with Connect RPC
- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Database**: PostgreSQL 16 (via Docker)
- **Code Generation**: Protocol Buffers with Buf CLI and sqlc

## Pre-installed Tools

The VM comes with the following tools already installed:

### Core Development Tools
- **Go**: `go version go1.22.2 linux/amd64`
- **Node.js**: `v22.21.1`
- **npm**: `10.9.4`

### Additional Tools Installed
- **Docker**: `29.1.3` - For running PostgreSQL and containerized services
- **Buf CLI**: `1.47.2` - For Protocol Buffer code generation
- **sqlc**: `v1.27.0` - For type-safe SQL query code generation
- **golang-migrate**: `4.18.1` - For database migrations
- **protoc-gen-go**: Latest - Go protobuf plugin (installed via `go install`)

## Docker Configuration

Docker is configured with the `vfs` storage driver due to VM filesystem limitations. The Docker daemon must be started manually on each VM session:

```bash
./start-docker-daemon.sh
```

This script:
1. Checks if Docker is already running
2. Starts the Docker daemon in the background if needed
3. Fixes socket permissions for non-root access

## Project Structure

```
/workspace/
├── backend/                 # Go backend with Connect RPC
│   ├── internal/
│   │   ├── gen/            # Generated protobuf/Connect code
│   │   ├── db/sqlc/        # Generated sqlc database code
│   │   └── service/        # RPC service implementations
│   ├── db/migrations/      # SQL migrations
│   └── main.go
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   └── lib/gen/       # Generated TypeScript API client
│   └── package.json
├── proto/                  # Protocol Buffer definitions
│   └── apiv1/api.proto
├── docker-compose.yml      # PostgreSQL container config
└── Makefile               # Build automation
```

## Quick Start

### 1. Initial Setup (First Time Only)

Install dependencies and generate code:

```bash
# Start Docker daemon
./start-docker-daemon.sh

# Install all dependencies
make install

# Generate protobuf and sqlc code
make generate
```

The `make install` command:
- Installs Go development tools (protoc-gen-go, sqlc)
- Downloads Go module dependencies
- Installs npm packages for the frontend

The `make generate` command:
- Generates Go server code from protobuf definitions
- Generates TypeScript client code from protobuf definitions
- Generates type-safe Go database queries from SQL files

### 2. Start Development Environment

Start all services:

```bash
# Start PostgreSQL
docker compose up -d

# Start backend (in one terminal)
cd backend && go run .

# Start frontend (in another terminal)
cd frontend && npm run dev
```

The services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5434

## Common Development Tasks

### Code Generation

After modifying proto files or SQL queries:

```bash
# Regenerate all code
make generate

# Or regenerate specific parts:
make generate-proto   # Just protobuf code
make generate-sqlc    # Just database code
```

### Database Management

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# Reset database (removes all data)
docker compose down -v
docker compose up -d
```

### Database Migrations

```bash
# Set database URL
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"

# Run migrations
make migrate-up

# Rollback migrations
make migrate-down

# Create new migration
make migrate-create
# Enter migration name when prompted
```

### Testing

```bash
# Run all tests
make test

# Run backend tests only
make test-backend

# Run frontend type checking only
make test-frontend
```

### Linting

```bash
# Lint proto files
make lint-proto

# Format proto files
make format-proto

# Lint frontend (ESLint)
cd frontend && npm run lint
```

### Building

```bash
# Build backend
cd backend && go build -o backend .

# Build frontend for production
cd frontend && npm run build

# Start production frontend
cd frontend && npm start
```

## Environment Variables

### Backend

The backend uses these environment variables (with defaults):

```bash
PORT=8080                                                            # API server port
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
```

### Frontend

The frontend uses these environment variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080                           # Backend API URL
AUTH0_SECRET=<your-auth0-secret>                                    # Auth0 configuration
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=<your-auth0-domain>
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_CLIENT_SECRET=<your-auth0-client-secret>
```

## Technology Stack Details

### Backend
- **Language**: Go 1.22.2
- **RPC Framework**: Connect RPC (supports gRPC, gRPC-Web, and Connect protocols)
- **Database Driver**: pgx v5 (PostgreSQL)
- **Database Query Generator**: sqlc (type-safe SQL queries)
- **Code Generation**: Buf (Protocol Buffers)

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **API Client**: @connectrpc/connect-web
- **Authentication**: Auth0 Next.js SDK

### Database
- **Database**: PostgreSQL 16 (Alpine Linux via Docker)
- **Migration Tool**: golang-migrate
- **Port**: 5434 (mapped from container's 5432)

### Code Generation
- **Proto Plugins**:
  - `buf.build/protocolbuffers/go` - Go protobuf messages
  - `buf.build/connectrpc/go` - Go Connect RPC server code
  - `buf.build/bufbuild/es` - TypeScript protobuf messages
  - `buf.build/connectrpc/es` - TypeScript Connect RPC client code

## Troubleshooting

### Docker Issues

**Problem**: Docker daemon not starting
```bash
# Check Docker logs
cat /tmp/dockerd.log

# Restart Docker
sudo pkill dockerd
./start-docker-daemon.sh
```

**Problem**: Permission denied connecting to Docker socket
```bash
sudo chmod 666 /var/run/docker.sock
```

**Problem**: Container fails to start with overlay error
- The VM is configured to use `vfs` storage driver (in `/etc/docker/daemon.json`)
- This is slower but more compatible with VM filesystems

### Code Generation Issues

**Problem**: Generated code is missing
```bash
# Ensure buf and sqlc are installed
make install-tools

# Regenerate all code
make generate
```

**Problem**: Import errors after regenerating code
```bash
# Clean and regenerate
make clean
make generate

# Restart your editor/LSP
```

### Database Connection Issues

**Problem**: Backend can't connect to database
```bash
# Check if PostgreSQL is running
docker ps

# Check container logs
docker logs cloutgg-postgres

# Restart PostgreSQL
docker compose restart
```

**Problem**: Port 5434 already in use
```bash
# Find what's using the port
sudo lsof -i :5434

# Stop the conflicting process or change the port in docker-compose.yml
```

### Build Issues

**Problem**: Go build fails with missing dependencies
```bash
cd backend
go mod download
go mod tidy
```

**Problem**: Frontend build fails
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## CI/CD Notes

This project is deployed on Railway. The Railway configuration:

- **Auto-deployment**: Pushes to `main` branch trigger automatic deployments
- **Build Process**: Each service (backend/frontend) has its own build configuration
- **Code Generation**: Proto code is generated automatically during builds (not committed to repo)
- **Environment Variables**: Set in Railway dashboard

See `railway.toml` and the Dockerfiles for deployment configuration.

## Maintenance

### Updating Dependencies

**Go dependencies:**
```bash
cd backend
go get -u ./...
go mod tidy
```

**Node dependencies:**
```bash
cd frontend
npm update
npm audit fix
```

**System tools:**
- Buf: Download from https://github.com/bufbuild/buf/releases
- sqlc: Download from https://github.com/sqlc-dev/sqlc/releases
- golang-migrate: Download from https://github.com/golang-migrate/migrate/releases

### Updating Generated Code

After updating proto files:
1. Edit `proto/apiv1/api.proto`
2. Run `make generate-proto`
3. Update service implementations in `backend/internal/service/`
4. Update frontend API calls as needed

After updating SQL queries:
1. Edit `backend/internal/db/sqlc/queries.sql`
2. Run `make generate-sqlc`
3. Update service code to use new queries

## VM Snapshot Recommendations

When creating a snapshot of this VM, ensure:

1. ✅ Docker daemon is stopped (will be started on-demand)
2. ✅ No containers are running (`docker compose down`)
3. ✅ Generated code is present in:
   - `backend/internal/gen/`
   - `frontend/src/lib/gen/`
   - `backend/internal/db/sqlc/`
4. ✅ Dependencies are installed:
   - `backend/go.mod` dependencies downloaded
   - `frontend/node_modules/` present
5. ✅ All tools verified working:
   - Go, Node.js, npm
   - Docker, Buf, sqlc, golang-migrate

## Summary

This VM environment is fully configured for CloutGG development with all necessary tools and dependencies. The setup supports:

- ✅ Full-stack development (Go backend + Next.js frontend)
- ✅ Protocol Buffer code generation
- ✅ Type-safe database queries
- ✅ Local PostgreSQL via Docker
- ✅ Testing and linting
- ✅ Production builds

Simply run `./start-docker-daemon.sh && make install && make generate` to get started!
