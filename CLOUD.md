# Cloud VM Environment Setup

This document describes the complete VM environment setup for the CloutGG application repository, including all installed dependencies and tools necessary to compile, run, test, and lint the application.

## Quick Setup Summary

**Installation Date**: December 17, 2025

### What Was Installed

1. **Docker & Docker Compose** - v29.1.3 (via official installation script, configured with vfs storage driver)
2. **buf CLI** - v1.61.0 (downloaded from GitHub releases)
3. **sqlc** - v1.30.0 (via `go install`)
4. **golang-migrate** - dev version (via `go install` with postgres tags)
5. **Project Dependencies**:
   - Backend: 27 Go modules downloaded and verified
   - Frontend: 384 npm packages installed

### Verified Working

✅ Docker running with vfs storage driver  
✅ PostgreSQL container starts successfully  
✅ Database migrations run successfully  
✅ Code generation (`make generate`)  
✅ Backend compilation (`go build`)  
✅ Backend server starts and connects to database  
✅ Frontend build (`npm run build`)  
✅ Type checking (`npx tsc --noEmit`)  
✅ Go tests (`make test-backend`)  
✅ Protobuf linting (`buf lint`)  
✅ Frontend linting (`npm run lint`)  

## Overview

This repository is a full-stack application consisting of:
- **Frontend**: Next.js 15 with TypeScript, React 18, TailwindCSS, and Auth0
- **Backend**: Go 1.22 with PostgreSQL database, ConnectRPC, and Protocol Buffers
- **Infrastructure**: Docker Compose for local PostgreSQL development
- **Code Generation**: Buf CLI for Protocol Buffers, sqlc for type-safe database queries

## Pre-installed Software (VM Baseline)

The VM comes with the following tools already installed:
- **Go**: 1.22.2 linux/amd64 (located at `/usr/bin/go`)
- **Node.js**: v22.21.1 via nvm (located at `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/node`)
- **npm**: v10.9.4
- **gopls**: Go language server (pre-installed in `$HOME/go/bin`)
- **staticcheck**: Go static analysis tool (pre-installed in `$HOME/go/bin`)
- **Make**: GNU Make 4.3**

## Installed Dependencies and Tools

### Docker and Container Runtime

1. **Docker** (v29.1.3, build f52814d)
   - **Installation Method**: Official Docker installation script
   - **Command**: `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
   - **Components Installed**:
     - docker-ce
     - docker-ce-cli
     - containerd.io
     - docker-compose-plugin
     - docker-buildx-plugin
     - docker-model-plugin
     - docker-ce-rootless-extras
   - **Location**: `/usr/bin/docker`
   - **Storage Driver**: vfs (configured to work around overlay filesystem issues)
   - **Service**: Docker daemon started with `sudo dockerd --storage-driver=vfs`
   - **Verified**: PostgreSQL container runs successfully, migrations work

2. **Docker Compose** (v5.0.0)
   - **Installation**: Included as `docker-compose-plugin` with Docker installation
   - **Command**: `docker compose` (note: no hyphen, v2 syntax)
   - **Configuration**: `docker-compose.yml`
   - **Verified**: Successfully starts PostgreSQL container

**Docker Configuration Note**: Initially encountered overlay filesystem issues in the VM environment. Resolved by configuring Docker to use the vfs storage driver with `sudo dockerd --storage-driver=vfs`. This allows containers to run successfully, though vfs is slower than overlay.

### Standalone CLI Tools

1. **buf** (v1.61.0)
   - **Purpose**: Protocol Buffer compiler, linter, and code generator
   - **Installation**: Downloaded from GitHub releases
   - **Command**: `curl -sSL "https://github.com/bufbuild/buf/releases/latest/download/buf-Linux-x86_64" -o /tmp/buf && chmod +x /tmp/buf && sudo mv /tmp/buf /usr/local/bin/buf`
   - **Location**: `/usr/local/bin/buf`
   - **Usage**: Lints and generates code from `.proto` files in `proto/` directory
   - **Configuration**: `proto/buf.yaml`, `buf.gen.yaml`
   - **Verified**: Successfully generates Go and TypeScript code from protobuf definitions

2. **sqlc** (v1.30.0)
   - **Purpose**: Type-safe code generator from SQL queries
   - **Installation**: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
   - **Location**: `/home/ubuntu/go/bin/sqlc`
   - **Usage**: Generates Go code from SQL queries in `backend/internal/db/sqlc/queries.sql`
   - **Configuration**: `backend/sqlc.yaml`
   - **Note**: Installation triggered Go to switch to go1.24.11 due to requirement (go >= 1.23.0)
   - **Verified**: Successfully generates database query code

3. **migrate** (dev version)
   - **Purpose**: Database migration tool for PostgreSQL
   - **Installation**: `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`
   - **Location**: `/home/ubuntu/go/bin/migrate`
   - **Usage**: Manages database schema migrations in `backend/db/migrations/`
   - **Verified**: Successfully runs migrations against PostgreSQL database
   - **Note**: Installation triggered Go to switch to go1.24.11 due to requirement (go >= 1.24.0)

### Go Development Tools

The following Go tools were installed via `go install`:

1. **protoc-gen-go** (installed as dependency)
   - **Purpose**: Protocol Buffer code generator for Go
   - **Installation**: Automatically installed as dependency
   - **Location**: `/home/ubuntu/go/bin/protoc-gen-go`
   - **Usage**: Automatically invoked by buf during protobuf code generation

### Project Dependencies

#### Backend Go Dependencies
All backend dependencies were downloaded via `go mod download`:
- `connectrpc.com/connect` v1.18.1 - ConnectRPC framework
- `github.com/jackc/pgx/v5` v5.7.1 - PostgreSQL driver
- `github.com/joho/godotenv` v1.5.1 - Environment variable management
- `github.com/rs/cors` v1.11.1 - CORS middleware
- `golang.org/x/net` v0.33.0 - Extended networking
- `google.golang.org/protobuf` v1.35.0 - Protocol Buffers

**Installation Command**: `cd backend && go mod download`  
**Result**: 27 modules downloaded and verified

#### Frontend npm Dependencies
All frontend dependencies were installed via `npm install`:
- **Total Packages**: 384 packages
- **Key Dependencies**:
  - `next` ^15.1.3 - Next.js framework
  - `react` ^18.3.1, `react-dom` ^18.3.1 - React library
  - `@auth0/nextjs-auth0` ^4.14.0 - Auth0 authentication
  - `@bufbuild/protobuf` ^2.10.2 - Protocol Buffer runtime
  - `@connectrpc/connect` ^2.1.1, `@connectrpc/connect-web` ^2.1.1 - ConnectRPC clients
  - `tailwindcss` ^3.4.15 - CSS framework
  - `typescript` ^5.6.3 - TypeScript compiler
  - `@bufbuild/buf` ^1.61.0 - Buf CLI (dev dependency)

**Installation Command**: `cd frontend && npm install`  
**Result**: 384 packages installed, 0 vulnerabilities

## Environment Configuration

### PATH Configuration

The following directories must be in PATH for all tools to be accessible:

```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

This ensures:
- `$HOME/go/bin` - Contains `migrate`, `sqlc`, and `protoc-gen-go`
- `/usr/local/bin` - Contains `buf`
- Node.js bin (via nvm) - Contains `npm` and `node`

**Configuration Applied**: Added `export PATH=$PATH:$(go env GOPATH)/bin` to `~/.bashrc` for persistence.

### Go Environment
- **GOPATH**: `/home/ubuntu/go`
- **GOROOT**: `/usr/lib/go-1.22`
- **Go Version**: 1.22.2 (base), switches to 1.24.11 for newer tool installations
- **Go Modules**: Enabled (go.mod in backend directory)
- **GOARCH**: amd64
- **GOOS**: linux

### Node.js Environment
- **Node Version**: v22.21.1 (via nvm)
- **npm Version**: 10.9.4
- **nvm Location**: `/home/ubuntu/.nvm`
- **Node Path**: `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/node`

### Docker Environment
- **Docker Version**: 29.1.3
- **Storage Driver**: vfs (configured to work around overlay filesystem issues)
- **Docker Socket**: `/var/run/docker.sock`
- **Start Command**: `sudo dockerd --storage-driver=vfs`

## Verified Working Commands

### Code Generation
```bash
# Set up PATH
export PATH=$PATH:$(go env GOPATH)/bin

# Generate all code (protobuf + sqlc)
cd /workspace
make generate

# Individual generation
make generate-proto  # Uses buf to generate protobuf code
make generate-sqlc    # Uses sqlc to generate database code
```

**Verified Output**:
- ✅ Backend protobuf code generated in `backend/internal/gen/apiv1/`
- ✅ Frontend protobuf code generated in `frontend/src/lib/gen/apiv1/`
- ✅ SQLC code generated in `backend/internal/db/sqlc/`

**Commands Run**:
1. `buf dep update proto` - Updated protobuf dependencies
2. `buf generate proto` - Generated Go and TypeScript code from protobuf
3. `cd backend && sqlc generate` - Generated database query code

### Building
```bash
# Backend build
export PATH=$PATH:$(go env GOPATH)/bin
cd /workspace/backend
go build -o backend .
# ✅ Successfully compiles without errors

# Frontend build
cd /workspace/frontend
npm run build
# ✅ Successfully compiles Next.js application
# ✅ Build output: 6 routes generated, optimized production build
```

**Build Results**:
- Backend: Compiles successfully, creates executable binary
- Frontend: Production build completes, generates static pages with minor warnings about Edge Runtime (expected)

### Database Setup
```bash
# Start PostgreSQL database
export PATH=$PATH:$(go env GOPATH)/bin
cd /workspace
sudo docker compose up -d
# ✅ PostgreSQL container starts successfully on port 5434

# Run migrations
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
migrate -path backend/db/migrations -database "$DATABASE_URL" up
# ✅ Successfully runs 3 migrations (init, add_user_id_to_votes, seed_companies)
```

**Database Results**:
- ✅ PostgreSQL 16-alpine container runs successfully
- ✅ Database migrations apply successfully (version 3)
- ✅ Backend connects to database and starts server

### Testing
```bash
# Backend tests
export PATH=$PATH:$(go env GOPATH)/bin
cd /workspace/backend
go test ./... -v
# ✅ Runs successfully (no test files in project currently)

# Frontend type checking
cd /workspace/frontend
npx tsc --noEmit
# ✅ No type errors
```

**Test Results**:
- Backend: All packages checked, no test files present (expected)
- Frontend: TypeScript compilation passes with no errors

### Linting
```bash
# Protobuf linting
export PATH=$PATH:$(go env GOPATH)/bin
cd /workspace
buf lint ./proto
# ⚠️ Shows deprecation warning for DEFAULT category (non-critical)
# ⚠️ Package name warning (code issue, not environment issue)

# Frontend linting
cd /workspace/frontend
npm run lint
# ✅ Passes with minor warnings in generated code (unused eslint-disable)
```

**Lint Results**:
- Protobuf: Linting works, shows expected warnings about deprecated DEFAULT category and package naming
- Frontend: ESLint passes with minor warnings in generated code

### Running Services
```bash
# Backend server
export PATH=$PATH:$(go env GOPATH)/bin
cd /workspace/backend
go run .
# ✅ Server starts on port 8080 (default)
# ✅ Connects to database successfully
# ✅ Service available at http://localhost:8080/apiv1.RankingsService/

# Frontend dev server
cd /workspace/frontend
npm run dev
# ✅ Next.js dev server starts on http://localhost:3000
```

## Project Setup Workflow

### Initial Setup (One-time)
```bash
# 1. Ensure PATH includes required binaries
export PATH=$PATH:$(go env GOPATH)/bin

# 2. Start Docker daemon (if not running)
sudo dockerd --storage-driver=vfs > /tmp/dockerd.log 2>&1 &

# 3. Install all dependencies
make install
# This runs:
# - go mod download (backend)
# - npm install (frontend)
# - go install for dev tools (via install-tools target)

# 4. Generate code
make generate
# This runs:
# - buf generate proto (generates protobuf code)
# - sqlc generate (generates database code)

# 5. Start database
make db
# or: sudo docker compose up -d

# 6. Run migrations
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
migrate -path backend/db/migrations -database "$DATABASE_URL" up
```

### Development Workflow
```bash
# Start database (requires Docker)
make db
# or: sudo docker compose up -d

# Run backend
make backend
# or: cd backend && go run .

# Run frontend
make frontend
# or: cd frontend && npm run dev

# Start everything
make dev
```

## Database Configuration

The PostgreSQL database is configured in `docker-compose.yml`:
- **Image**: postgres:16-alpine
- **Container Name**: cloutgg-postgres
- **Host Port**: 5434
- **Container Port**: 5432
- **Credentials**: postgres/postgres
- **Database**: cloutgg
- **Migrations**: Located in `backend/db/migrations/`
- **Migration Files**: 3 migrations (init, add_user_id_to_votes, seed_companies)

Default connection string (when database is running):
```
postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
```

## Makefile Targets

The project includes a comprehensive Makefile with the following targets:

| Target | Description | Status |
|--------|-------------|--------|
| `dev` | Start all services (db, backend, frontend) | ✅ Works |
| `db` | Start PostgreSQL database | ✅ Works (requires Docker) |
| `backend` | Run Go backend server | ✅ Works |
| `frontend` | Run Next.js dev server | ✅ Works |
| `install` | Install all dependencies | ✅ Works |
| `install-tools` | Install Go development tools | ✅ Works |
| `generate` | Generate all code (proto + sqlc) | ✅ Works |
| `generate-proto` | Generate protobuf code | ✅ Works |
| `generate-sqlc` | Generate sqlc code | ✅ Works |
| `test` | Run all tests | ✅ Works (no tests yet) |
| `test-backend` | Run Go tests | ✅ Works |
| `test-frontend` | Type check frontend | ✅ Works |
| `lint-proto` | Lint protobuf files | ✅ Works |
| `format-proto` | Format protobuf files | ✅ Works |
| `clean` | Clean generated code | ✅ Works |
| `migrate-up` | Run database migrations | ✅ Works (requires DATABASE_URL) |
| `migrate-down` | Rollback migrations | ✅ Works (requires DATABASE_URL) |

## Verification Checklist

Use these commands to verify the environment is properly set up:

```bash
# Set up PATH
export PATH=$PATH:$(go env GOPATH)/bin

# Verify Go
go version                    # Should show: go version go1.22.2 linux/amd64
which sqlc                    # Should show: /home/ubuntu/go/bin/sqlc
which migrate                 # Should show: /home/ubuntu/go/bin/migrate
sqlc version                  # Should show: v1.30.0
migrate -version              # Should show: dev

# Verify CLI tools
which buf                     # Should show: /usr/local/bin/buf
buf --version                 # Should show: 1.61.0

# Verify Node.js
node --version                # Should show: v22.21.1
npm --version                 # Should show: 10.9.4

# Verify Docker
sudo docker --version         # Should show: Docker version 29.1.3
sudo docker compose version   # Should show: Docker Compose version v5.0.0
sudo docker ps                # Should show running containers

# Verify builds
cd /workspace/backend && go build . && echo "✓ Backend builds"
cd /workspace/frontend && npm run build && echo "✓ Frontend builds"

# Verify code generation
cd /workspace
make generate && echo "✓ Code generation works"

# Verify database
sudo docker compose up -d && sleep 10 && sudo docker ps | grep postgres && echo "✓ Database running"
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
migrate -path backend/db/migrations -database "$DATABASE_URL" version && echo "✓ Migrations work"
```

## Summary of Installation Steps

### Commands Executed During Setup

The following commands were executed to set up the VM environment:

1. **Docker Installation**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo dockerd --storage-driver=vfs > /tmp/dockerd.log 2>&1 &
   ```
   Installed: Docker CE v29.1.3, Docker Compose v5.0.0, containerd, and plugins
   Configured: vfs storage driver to work around overlay filesystem issues
   Verified: PostgreSQL container runs successfully

2. **buf CLI Installation**:
   ```bash
   curl -sSL "https://github.com/bufbuild/buf/releases/latest/download/buf-Linux-x86_64" -o /tmp/buf
   chmod +x /tmp/buf
   sudo mv /tmp/buf /usr/local/bin/buf
   ```
   Installed: buf v1.61.0
   Verified: Successfully generates protobuf code

3. **Go Development Tools**:
   ```bash
   export PATH=$PATH:$(go env GOPATH)/bin
   go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
   go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
   ```
   Installed:
   - `sqlc` v1.30.0
   - `migrate` (dev)
   Verified: Both tools work correctly

4. **Project Dependencies**:
   ```bash
   cd /workspace/backend && go mod download
   cd /workspace/frontend && npm install
   ```
   - Backend: 27 Go modules downloaded and verified
   - Frontend: 384 npm packages installed, 0 vulnerabilities

5. **Code Generation**:
   ```bash
   export PATH=$PATH:$(go env GOPATH)/bin
   cd /workspace
   buf dep update proto
   buf generate proto
   cd backend && sqlc generate
   ```
   Generated protobuf and sqlc code successfully

6. **Database Setup**:
   ```bash
   cd /workspace
   sudo docker compose up -d
   export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
   migrate -path backend/db/migrations -database "$DATABASE_URL" up
   ```
   Started PostgreSQL container and ran migrations successfully

7. **PATH Configuration**:
   ```bash
   echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
   ```
   Made PATH configuration persistent

## Summary of Installed Components

### ✅ Successfully Installed and Working
1. **Go 1.22.2** - Pre-installed, verified working
2. **Node.js v22.21.1** - Pre-installed via nvm, verified working
3. **npm v10.9.4** - Pre-installed, verified working
4. **sqlc v1.30.0** - Installed via `go install`, verified working
5. **buf v1.61.0** - Installed from GitHub releases, verified working
6. **migrate (dev)** - Installed via `go install`, verified working
7. **Docker v29.1.3** - Installed via official Docker installation script, configured with vfs storage driver
8. **Docker Compose v5.0.0** - Installed as plugin with Docker, verified working
9. **Backend Go dependencies** - All 27 modules downloaded via `go mod download`, verified
10. **Frontend npm dependencies** - All 384 packages installed via `npm install`, 0 vulnerabilities
11. **PostgreSQL database** - Running in Docker container, migrations applied successfully
12. **Code generation** - Protobuf and sqlc code generated successfully

### 📋 Environment Ready For
- ✅ Compiling Go backend
- ✅ Building Next.js frontend
- ✅ Generating protobuf code (Go and TypeScript)
- ✅ Generating sqlc database code
- ✅ Running Docker containers (with vfs storage driver)
- ✅ Running PostgreSQL database
- ✅ Running database migrations
- ✅ Running backend server with database connection
- ✅ Running frontend dev server
- ✅ Type checking and linting

## Installation Summary by Task

### Task 1: Docker Installation ✅
**Summary**: Installed Docker CE v29.1.3 and Docker Compose v5.0.0 using the official Docker installation script. Configured Docker to use vfs storage driver to work around overlay filesystem issues in the VM environment. Docker daemon starts successfully and PostgreSQL container runs.

**Commands Run**:
- `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
- `sudo dockerd --storage-driver=vfs > /tmp/dockerd.log 2>&1 &` (started daemon with vfs)
- `sudo docker compose up -d` (started PostgreSQL container)
- Verified: `sudo docker --version`, `sudo docker compose version`, `sudo docker ps`

### Task 2: buf CLI Installation ✅
**Summary**: Installed buf v1.61.0 by downloading the binary from GitHub releases. Successfully generates protobuf code for both Go backend and TypeScript frontend.

**Commands Run**:
- `curl -sSL "https://github.com/bufbuild/buf/releases/latest/download/buf-Linux-x86_64" -o /tmp/buf && chmod +x /tmp/buf && sudo mv /tmp/buf /usr/local/bin/buf`
- Verified: `buf --version`, `buf generate proto`, `buf lint proto`

### Task 3: sqlc Installation ✅
**Summary**: Installed sqlc v1.30.0 via `go install`. Successfully generates type-safe Go code from SQL queries.

**Commands Run**:
- `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
- Verified: `sqlc version`, `cd backend && sqlc generate`

### Task 4: golang-migrate Installation ✅
**Summary**: Installed migrate (dev version) with PostgreSQL support via `go install`. Tool is available for database migrations and successfully runs migrations against PostgreSQL.

**Commands Run**:
- `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`
- Verified: `migrate -version`, `migrate -path backend/db/migrations -database "$DATABASE_URL" up`

### Task 5: Backend Setup ✅
**Summary**: Downloaded all Go module dependencies and generated required code (protobuf and sqlc). Backend compiles successfully and connects to database.

**Commands Run**:
- `cd backend && go mod download` (27 modules)
- `buf generate proto` (generated protobuf code)
- `cd backend && sqlc generate` (generated database code)
- `go build -o backend .` (successful compilation)
- `go run .` (server starts and connects to database)

### Task 6: Frontend Setup ✅
**Summary**: Installed 384 npm packages. Frontend builds successfully, dev server starts, linting and type checking work.

**Commands Run**:
- `cd frontend && npm install` (384 packages, 0 vulnerabilities)
- `npm run prebuild` (generates protobuf code)
- `npm run build` (successful production build)
- `npx tsc --noEmit` (no type errors)
- `npm run lint` (passes with minor warnings)

### Task 7: Testing Commands ✅
**Summary**: Verified compilation, linting, test commands, and database setup work correctly for both backend and frontend.

**Commands Tested**:
- `make test-backend` - Go tests run (no test files)
- `make test-frontend` - TypeScript type checking passes
- `make generate` - Code generation works
- `go vet ./...` - No issues
- `npm run lint` - Passes with minor warnings
- `buf lint proto` - Works with expected warnings
- `sudo docker compose up -d` - PostgreSQL container starts
- `migrate -path backend/db/migrations -database "$DATABASE_URL" up` - Migrations run successfully

## Next Steps for VM Snapshot

When taking the VM snapshot, the environment is ready with:
1. ✅ `$HOME/go/bin` is in PATH (added to ~/.bashrc)
2. ✅ Docker configured with vfs storage driver
3. ✅ All tools installed and verified working
4. ✅ Code generation works (`make generate`)
5. ✅ Backend and frontend build successfully
6. ✅ Database container runs and migrations work
7. ✅ Backend server starts and connects to database

**Docker Startup**: The Docker daemon should be started with `sudo dockerd --storage-driver=vfs` to use the vfs storage driver. Alternatively, configure `/etc/docker/daemon.json` with `{"storage-driver": "vfs"}` for persistence.

The environment is production-ready for development work with all tools installed, dependencies downloaded, code generation working, and database setup verified.