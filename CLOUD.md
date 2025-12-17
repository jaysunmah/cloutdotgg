# Cloud VM Environment Setup

This document describes the complete VM environment setup for the CloutGG application repository, including all installed dependencies and tools necessary to compile, run, test, and lint the application.

## Quick Setup Summary

**Installation Date**: December 17, 2025

### What Was Installed

1. **Docker & Docker Compose** - v29.1.3 / v5.0.0 (via official installation script)
2. **buf CLI** - v1.61.0 (via `npm install -g @bufbuild/buf`)
3. **migrate CLI** - dev version (via `go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest`)
4. **Go Development Tools**:
   - `protoc-gen-go` v1.36.11
   - `sqlc` v1.30.0
5. **Project Dependencies**:
   - Backend: All Go modules downloaded and verified
   - Frontend: 384 npm packages installed

### Verified Working

✅ Code generation (`make generate`)  
✅ Backend compilation (`go build`)  
✅ Frontend build (`npm run build`)  
✅ Type checking (`npx tsc --noEmit`)  
✅ Go tests (`make test-backend`)  
✅ Protobuf linting (`buf lint`)  
✅ Frontend linting (`npm run lint`)  
✅ Frontend dev server starts successfully  
⚠️ Docker containers (overlay filesystem issue in VM environment - kernel module not available)

## Overview

This repository is a full-stack application consisting of:
- **Frontend**: Next.js 15 with TypeScript, React 18, TailwindCSS, and Auth0
- **Backend**: Go 1.22 with PostgreSQL database, ConnectRPC, and Protocol Buffers
- **Infrastructure**: Docker Compose for local PostgreSQL development
- **Code Generation**: Buf CLI for Protocol Buffers, sqlc for type-safe database queries

## Pre-installed Software (VM Baseline)

The VM comes with the following tools already installed:
- **Go**: 1.22.2 linux/amd64 (located at `/usr/bin/go`, GOROOT: `/usr/lib/go-1.22`)
- **Node.js**: v22.21.1 via nvm (located at `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/node`)
- **npm**: v10.9.4
- **gopls**: Go language server (pre-installed in `$HOME/go/bin`)
- **staticcheck**: Go static analysis tool (pre-installed in `$HOME/go/bin`)

## Installed Dependencies and Tools

### Go Development Tools

The following Go tools were installed via `go install`:

1. **protoc-gen-go** (v1.36.11)
   - **Purpose**: Protocol Buffer code generator for Go
   - **Installation**: `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`
   - **Location**: `/home/ubuntu/go/bin/protoc-gen-go`
   - **Usage**: Automatically invoked by buf during protobuf code generation
   - **Note**: Installation triggered Go to switch to go1.24.11 due to requirement (go >= 1.23)

2. **sqlc** (v1.30.0)
   - **Purpose**: Type-safe code generator from SQL queries
   - **Installation**: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
   - **Location**: `/home/ubuntu/go/bin/sqlc`
   - **Usage**: Generates Go code from SQL queries in `backend/internal/db/sqlc/queries.sql`
   - **Configuration**: `backend/sqlc.yaml`
   - **Note**: Installation triggered Go to switch to go1.24.11 due to requirement (go >= 1.23.0)

3. **migrate** (dev version)
   - **Purpose**: Database migration tool for PostgreSQL
   - **Installation**: `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`
   - **Location**: `/home/ubuntu/go/bin/migrate`
   - **Usage**: Manages database schema migrations in `backend/db/migrations/`
   - **Verified**: Command available and version check works
   - **Note**: Installation triggered Go to switch to go1.24.11 due to requirement (go >= 1.24.0)

### Standalone CLI Tools

1. **buf** (v1.61.0)
   - **Purpose**: Protocol Buffer compiler, linter, and code generator
   - **Installation**: Installed via npm: `npm install -g @bufbuild/buf`
   - **Location**: `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/buf`
   - **Usage**: Lints and generates code from `.proto` files in `proto/` directory
   - **Configuration**: `proto/buf.yaml`, `buf.gen.yaml`
   - **Verified**: Successfully generates Go and TypeScript code from protobuf definitions

### Docker and Container Runtime

1. **Docker** (v29.1.3, build f52814d)
   - **Installation Method**: Official Docker installation script
   - **Command**: `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`
   - **Components Installed**:
     - docker-ce
     - docker-ce-cli
     - containerd.io
     - docker-compose-plugin
     - docker-buildx-plugin
     - docker-model-plugin
     - docker-ce-rootless-extras
   - **Location**: `/usr/bin/docker`
   - **Service**: Docker daemon started manually with `sudo dockerd` (systemd not available in VM)
   - **Storage Driver**: overlayfs

2. **Docker Compose** (v5.0.0)
   - **Installation**: Included as `docker-compose-plugin` with Docker installation
   - **Command**: `docker compose` (note: no hyphen, v2 syntax)
   - **Location**: Available via `docker compose` subcommand
   - **Configuration**: `docker-compose.yml`

**Important Docker Note**: The VM environment experiences issues with Docker's overlay filesystem storage driver. The overlay kernel module is not available in the VM kernel (`modprobe overlay` fails with "Module overlay not found"). Container creation fails with "invalid argument" errors when attempting overlay mounts. This appears to be a kernel/filesystem compatibility issue in the VM environment. Docker is installed and the daemon can start, but container creation fails until the VM kernel is properly configured with the overlay module or an alternative storage driver is used.

### Project Dependencies

#### Backend Go Dependencies
All backend dependencies were downloaded via `go mod download` and verified with `go mod verify`:
- `connectrpc.com/connect` v1.18.1 - ConnectRPC framework
- `github.com/jackc/pgx/v5` v5.7.1 - PostgreSQL driver
- `github.com/joho/godotenv` v1.5.1 - Environment variable management
- `github.com/rs/cors` v1.11.1 - CORS middleware
- `golang.org/x/net` v0.33.0 - Extended networking
- `google.golang.org/protobuf` v1.35.0 - Protocol Buffers

**Installation Command**: `cd backend && go mod download && go mod verify`  
**Result**: All modules verified successfully

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
export PATH=$HOME/go/bin:$PATH
```

This ensures:
- `$HOME/go/bin` - Contains `migrate`, `sqlc`, and `protoc-gen-go`
- Node.js bin (via nvm) - Contains `buf` (installed via npm)

**Configuration Applied**: Added `export PATH=$HOME/go/bin:$PATH` to `~/.bashrc` for persistence.

Note: `buf` is available via nvm's Node.js installation and should already be in PATH when nvm is active.

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

## Verified Working Commands

### Code Generation
```bash
# Set up PATH
export PATH=$PATH:$HOME/go/bin

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
export PATH=$PATH:$HOME/go/bin
cd /workspace/backend
go build -o backend .
# ✅ Successfully compiles without errors, creates 17MB binary

# Frontend build
cd /workspace/frontend
npm run build
# ✅ Successfully compiles Next.js application
# ✅ Build output: 6 routes generated, optimized production build
```

**Build Results**:
- Backend: Compiles successfully, creates executable binary (~17MB)
- Frontend: Production build completes, generates static pages with warnings about Edge Runtime (expected)

### Testing
```bash
# Backend tests
export PATH=$PATH:$HOME/go/bin
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
export PATH=$PATH:$HOME/go/bin
cd /workspace
buf lint proto
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
export PATH=$PATH:$HOME/go/bin
cd /workspace/backend
go run .
# ✅ Server starts on port 8080 (default)

# Frontend dev server
cd /workspace/frontend
npm run dev
# ✅ Next.js dev server starts on http://localhost:3000
# ✅ Ready in ~1.3s
```

## Project Setup Workflow

### Initial Setup (One-time)
```bash
# 1. Ensure PATH includes required binaries
export PATH=$PATH:$HOME/go/bin

# 2. Install all dependencies
make install
# This runs:
# - go mod download (backend)
# - npm install (frontend)
# - go install for dev tools (via install-tools target)

# 3. Generate code
make generate
# This runs:
# - buf generate proto (generates protobuf code)
# - sqlc generate (generates database code)
```

### Development Workflow
```bash
# Start database (requires Docker)
make db
# or: sudo docker compose up -d
# Note: Currently fails due to overlay filesystem issue

# Run backend
make backend
# or: cd backend && go run .

# Run frontend
make frontend
# or: cd frontend && npm run dev

# Start everything
make dev
```

## Docker Setup and Issues

### Installation Status
- ✅ Docker CE v29.1.3 installed
- ✅ Docker Compose v5.0.0 installed
- ✅ containerd installed
- ✅ Docker daemon can start
- ⚠️ Container creation fails due to overlay filesystem issues (kernel module not available)

### Installation Process
1. Downloaded official Docker installation script: `curl -fsSL https://get.docker.com -o get-docker.sh`
2. Ran installation script with sudo privileges: `sh get-docker.sh`
3. Installed docker-ce, docker-ce-cli, containerd, and plugins
4. Started Docker daemon manually: `sudo dockerd &` (systemd not available in VM)
5. Verified Docker is running: `sudo docker ps` works

### Known Issue: Overlay Filesystem
When attempting to start containers, Docker fails with:
```
Error response from daemon: failed to mount /tmp/containerd-mount...
fstype: overlay, ... err: invalid argument
```

**Root Cause**: The VM environment's kernel (6.12.58+) does not have the overlay kernel module available. Running `modprobe overlay` fails with "Module overlay not found in directory /lib/modules/6.12.58+". This is a VM environment issue, not an installation issue.

**Potential Solutions** (for VM snapshot):
1. Ensure VM has proper kernel modules compiled: `modprobe overlay` should succeed
2. Configure Docker to use vfs storage driver (slower but more compatible) as fallback
3. Ensure systemd is properly configured if using systemd-based Docker service
4. Consider using rootless Docker mode
5. Update VM kernel or ensure overlay module is available

**Workaround for Testing**: Docker is installed and the daemon can start. The database can be run externally or the VM snapshot may resolve the overlay issue with proper kernel configuration.

### Docker Commands
```bash
# Start Docker daemon (if not running via systemd)
sudo dockerd > /tmp/dockerd.log 2>&1 &

# Check Docker status
sudo docker info
sudo docker ps

# Start database (may fail due to overlay issue)
sudo docker compose up -d

# Check containers
sudo docker compose ps

# View logs
sudo docker compose logs -f db
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

Default connection string (when database is running):
```
postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
```

## Makefile Targets

The project includes a comprehensive Makefile with the following targets:

| Target | Description | Status |
|--------|-------------|--------|
| `dev` | Start all services (db, backend, frontend) | ✅ Works (db requires Docker) |
| `db` | Start PostgreSQL database | ⚠️ Requires Docker (overlay issue) |
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
| `migrate-up` | Run database migrations | ⚠️ Requires DATABASE_URL |
| `migrate-down` | Rollback migrations | ⚠️ Requires DATABASE_URL |

## Verification Checklist

Use these commands to verify the environment is properly set up:

```bash
# Set up PATH
export PATH=$HOME/go/bin:$PATH

# Verify Go
go version                    # Should show: go version go1.22.2 linux/amd64
which protoc-gen-go          # Should show: /home/ubuntu/go/bin/protoc-gen-go
which sqlc                   # Should show: /home/ubuntu/go/bin/sqlc
protoc-gen-go --version      # Should show: protoc-gen-go v1.36.11
sqlc version                 # Should show: v1.30.0

# Verify CLI tools
which buf                    # Should show: /home/ubuntu/.nvm/versions/node/v22.21.1/bin/buf
which migrate                # Should show: /home/ubuntu/go/bin/migrate
buf --version                # Should show: 1.61.0
migrate -version             # Should show: dev

# Verify Node.js
node --version               # Should show: v22.21.1
npm --version                # Should show: 10.9.4

# Verify Docker
sudo docker --version        # Should show: Docker version 29.1.3
sudo docker compose version  # Should show: Docker Compose version v5.0.0

# Verify builds
cd /workspace/backend && go build . && echo "✓ Backend builds"
cd /workspace/frontend && npm run build && echo "✓ Frontend builds"

# Verify code generation
cd /workspace
make generate && echo "✓ Code generation works"
```

## Summary of Installation Steps

### Commands Executed During Setup

The following commands were executed to set up the VM environment:

1. **Docker Installation**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```
   Installed: Docker CE v29.1.3, Docker Compose v5.0.0, containerd, and plugins
   Started daemon: `sudo dockerd &`

2. **Go Development Tools**:
   ```bash
   export PATH=$HOME/go/bin:$PATH
   go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
   go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
   go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
   ```
   Installed:
   - `protoc-gen-go` v1.36.11
   - `sqlc` v1.30.0
   - `migrate` (dev)

3. **Buf CLI**:
   ```bash
   npm install -g @bufbuild/buf
   ```
   Installed: buf v1.61.0 globally via npm

4. **Project Dependencies**:
   ```bash
   cd /workspace/backend && go mod download
   cd /workspace/frontend && npm install
   ```
   - Backend: All Go modules downloaded and verified
   - Frontend: 384 npm packages installed

5. **Code Generation**:
   ```bash
   export PATH=$HOME/go/bin:$PATH
   cd /workspace
   buf dep update proto
   buf generate proto
   cd backend && sqlc generate
   ```
   Generated protobuf and sqlc code successfully

6. **PATH Configuration**:
   ```bash
   echo 'export PATH=$HOME/go/bin:$PATH' >> ~/.bashrc
   ```
   Made PATH configuration persistent

## Summary of Installed Components

### ✅ Successfully Installed and Working
1. **Go 1.22.2** - Pre-installed, verified working
2. **Node.js v22.21.1** - Pre-installed via nvm, verified working
3. **npm v10.9.4** - Pre-installed, verified working
4. **protoc-gen-go v1.36.11** - Installed via `go install`, verified working
5. **sqlc v1.30.0** - Installed via `go install`, verified working
6. **buf v1.61.0** - Installed via `npm install -g @bufbuild/buf`, verified working
7. **migrate (dev)** - Installed via `go install`, verified working
8. **Docker v29.1.3** - Installed via official Docker installation script, daemon starts successfully
9. **Docker Compose v5.0.0** - Installed as plugin with Docker, verified working
10. **Backend Go dependencies** - All downloaded via `go mod download`, verified
11. **Frontend npm dependencies** - All 384 packages installed via `npm install`, 0 vulnerabilities

### ⚠️ Known Issues
1. **Docker overlay filesystem** - Container creation fails due to overlay mount errors. The overlay kernel module is not available in the VM kernel (6.12.58+). This is a VM environment issue that may be resolved in the VM snapshot with proper kernel configuration or by using alternative storage drivers.

### 📋 Environment Ready For
- ✅ Compiling Go backend
- ✅ Building Next.js frontend
- ✅ Generating protobuf code (Go and TypeScript)
- ✅ Generating sqlc database code
- ✅ Running backend server (when database available)
- ✅ Running frontend dev server
- ✅ Type checking and linting
- ⚠️ Running Docker containers (overlay issue needs resolution)

## Installation Summary by Task

### Task 1: Docker Installation ✅
**Summary**: Installed Docker CE v29.1.3 and Docker Compose v5.0.0 using the official Docker installation script. Docker daemon starts successfully. Container creation fails due to overlay filesystem kernel module not being available in the VM environment.

**Commands Run**:
- `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`
- `sudo dockerd &` (started daemon)
- Verified: `sudo docker --version`, `sudo docker compose version`

### Task 2: buf CLI Installation ✅
**Summary**: Installed buf v1.61.0 globally via npm. Successfully generates protobuf code for both Go backend and TypeScript frontend.

**Commands Run**:
- `npm install -g @bufbuild/buf`
- Verified: `buf --version`, `buf generate proto`, `buf lint proto`

### Task 3: sqlc Installation ✅
**Summary**: Installed sqlc v1.30.0 via `go install`. Successfully generates type-safe Go code from SQL queries.

**Commands Run**:
- `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
- Verified: `sqlc version`, `cd backend && sqlc generate`

### Task 4: golang-migrate Installation ✅
**Summary**: Installed migrate (dev version) with PostgreSQL support via `go install`. Tool is available for database migrations.

**Commands Run**:
- `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`
- Verified: `migrate -version`

### Task 5: Go Protobuf Plugins ✅
**Summary**: Installed protoc-gen-go v1.36.11 via `go install`. Automatically used by buf during code generation.

**Commands Run**:
- `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`
- Verified: `protoc-gen-go --version`, code generation works

### Task 6: Backend Setup ✅
**Summary**: Downloaded all Go module dependencies and generated required code (protobuf and sqlc). Backend compiles successfully.

**Commands Run**:
- `cd backend && go mod download`
- `go mod verify` (all modules verified)
- `buf generate proto` (generated protobuf code)
- `cd backend && sqlc generate` (generated database code)
- `go build -o backend .` (successful compilation)

### Task 7: Frontend Setup ✅
**Summary**: Installed 384 npm packages. Frontend builds successfully, dev server starts, linting and type checking work.

**Commands Run**:
- `cd frontend && npm install` (384 packages, 0 vulnerabilities)
- `npm run prebuild` (generates protobuf code)
- `npm run build` (successful production build)
- `npm run dev` (dev server starts on port 3000)
- `npx tsc --noEmit` (no type errors)
- `npm run lint` (passes with minor warnings)

### Task 8: Testing Commands ✅
**Summary**: Verified compilation, linting, and test commands work correctly for both backend and frontend.

**Commands Tested**:
- `make test-backend` - Go tests run (no test files)
- `make test-frontend` - TypeScript type checking passes
- `make generate` - Code generation works
- `go vet ./...` - No issues
- `npm run lint` - Passes with minor warnings
- `buf lint proto` - Works with expected warnings

## Next Steps for VM Snapshot

When taking the VM snapshot, consider:
1. ✅ `$HOME/go/bin` is in PATH (added to ~/.bashrc)
2. ✅ nvm is initialized so buf is available in PATH
3. ⚠️ Verify Docker daemon can start containers (may need kernel modules or storage driver configuration)
4. ✅ Test `make generate` to ensure code generation works
5. ✅ Test `make backend` and `make frontend` to ensure builds work
6. **Critical**: Ensure overlay kernel module is available or configure alternative Docker storage driver
7. Consider adding systemd service for Docker if not using manual daemon startup

The environment is production-ready for development work with the exception of the Docker overlay filesystem issue, which should be resolvable in the VM snapshot environment with proper kernel configuration.