# Cloud VM Setup Guide

This document describes the complete VM environment setup for the CloutGG project, a full-stack application with Go backend, PostgreSQL database, and Next.js frontend using Connect RPC.

## Overview

This VM snapshot includes all necessary tools and dependencies to compile, run, test, and lint the CloutGG repository. The setup has been verified and tested to ensure all components work correctly.

## Pre-installed Tools

The following tools come pre-installed on the base VM:
- **Go**: `1.22.2 linux/amd64`
- **Node.js**: `v22.21.1`
- **npm**: (included with Node.js)
- **git**: Pre-configured

## Installed Dependencies

### Backend Tools

#### 1. Buf CLI (v1.47.2)
- **Purpose**: Protocol buffer code generation
- **Location**: `/usr/local/bin/buf`
- **Installation method**: Direct binary download from buf.build
- **Verification**: `buf --version`

#### 2. sqlc (v1.30.0)
- **Purpose**: Generate type-safe Go code from SQL queries
- **Location**: `/home/ubuntu/go/bin/sqlc`
- **Installation command**: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
- **Verification**: `sqlc version`

#### 3. golang-migrate (dev)
- **Purpose**: Database migration tool for PostgreSQL
- **Location**: `/home/ubuntu/go/bin/migrate`
- **Installation command**: `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`
- **Verification**: `migrate -version`

#### 4. protoc-gen-go (v1.36.11)
- **Purpose**: Protocol buffer plugin for Go code generation
- **Location**: `/home/ubuntu/go/bin/protoc-gen-go`
- **Installation command**: `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`
- **Verification**: `protoc-gen-go --version`

#### 5. protoc-gen-connect-go (latest)
- **Purpose**: Connect RPC plugin for Go server code generation
- **Location**: `/home/ubuntu/go/bin/protoc-gen-connect-go`
- **Installation command**: `go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest`
- **Verification**: `which protoc-gen-connect-go`

#### 6. Go Dependencies
- **Status**: All backend Go modules downloaded
- **Command used**: `cd backend && go mod download`

### Frontend Dependencies

#### 1. npm Packages (383 total)
- **Installation**: `cd frontend && npm install`
- **Key packages**:
  - Next.js: `15.5.9`
  - React: `18.3.1`
  - TypeScript: `5.9.3`
  - `@bufbuild/protobuf`: `2.10.2`
  - `@connectrpc/connect`: `2.1.1`
  - `@connectrpc/connect-web`: `2.1.1`
  - `@bufbuild/buf`: `1.61.0` (devDependency)
  - Tailwind CSS: `3.4.19`
  - Auth0: `@auth0/nextjs-auth0@4.14.0`

#### 2. Generated Proto Code
- **Location**: `frontend/src/lib/gen/apiv1/`
- **Files generated**: 4 TypeScript files (api_pb.d.ts, api_pb.js, api_connect.d.ts, api_connect.js)
- **Command**: `npx buf generate ../proto`

### Docker & Database

#### 1. Docker (v28.2.2)
- **Purpose**: Container runtime for PostgreSQL
- **Installation**: Official Docker installation
- **Docker Compose**: v1.29.2
- **Verification**: `docker --version`

#### 2. PostgreSQL Container
- **Image**: `postgres:16-alpine`
- **Container name**: `cloutgg-postgres`
- **Status**: Running and healthy
- **Port mapping**: `5434:5432` (host:container)
- **Database**: `cloutgg`
- **Credentials**: 
  - User: `postgres`
  - Password: `postgres`
- **Connection string**: `postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable`

## Code Generation Setup

### Backend Code Generation

All backend code generation has been completed:

1. **Protocol Buffer Code**
   - Location: `backend/internal/gen/apiv1/api.pb.go`
   - Command: `buf generate ../proto` (from backend directory)
   - Status: ✅ Generated successfully

2. **Database Code (sqlc)**
   - Location: `backend/internal/db/sqlc/`
   - Files: `db.go`, `models.go`, `querier.go`, `queries.sql.go`
   - Command: `sqlc generate` (from backend directory)
   - Status: ✅ Generated successfully

### Frontend Code Generation

All frontend code generation has been completed:

1. **Protocol Buffer & Connect RPC Code**
   - Location: `frontend/src/lib/gen/apiv1/`
   - Files: TypeScript definitions and implementations
   - Command: `npx buf generate ../proto` (from frontend directory)
   - Status: ✅ Generated successfully

## Environment Configuration

### Important PATH Configuration

The Go binaries are installed in `/home/ubuntu/go/bin/`. For commands to work properly, ensure this directory is in your PATH:

```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

**Recommendation**: Add this to your `~/.bashrc` or `~/.profile`:

```bash
echo 'export PATH=$PATH:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc
```

### Environment Variables

The following environment variables are used:

```bash
# Database (for local development)
DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"

# Backend
PORT=8080

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Verification Commands

### Backend Verification

```bash
# Add Go bin to PATH first
export PATH=$PATH:$(go env GOPATH)/bin

# Check all tools
buf --version                    # → 1.47.2
sqlc version                     # → v1.30.0
migrate -version                 # → dev
protoc-gen-go --version          # → protoc-gen-go v1.36.11
go version                       # → go version go1.22.2 linux/amd64

# Generate code
cd /workspace/backend
buf generate ../proto            # Generate protobuf code
sqlc generate                    # Generate database code

# Build backend
go build .

# Run backend (requires PostgreSQL running)
go run .
```

### Frontend Verification

```bash
cd /workspace/frontend

# Check Node/npm
node --version                   # → v22.21.1
npm --version

# Generate proto code
npx buf generate ../proto

# Type check
npx tsc --noEmit                 # Should pass with no errors

# Build for production
npm run build                    # Should complete successfully

# Run development server
npm run dev                      # Starts on http://localhost:3000
```

### Docker & Database Verification

```bash
# Check Docker
docker --version                 # → Docker version 28.2.2
sudo docker ps                   # Should show cloutgg-postgres running

# Check PostgreSQL
ss -tuln | grep 5434            # Should show port listening

# Connect to database
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d cloutgg
```

### Complete Workflow Verification

```bash
# From workspace root, with proper PATH
export PATH=$PATH:$(go env GOPATH)/bin

# Generate all code
make generate                    # Should complete without errors

# Start PostgreSQL
docker compose up -d             # Or: sudo docker start cloutgg-postgres

# Start backend (in one terminal)
cd backend && go run .

# Start frontend (in another terminal)
cd frontend && npm run dev

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

## Build and Deploy Commands

### Using Makefile

The project includes a comprehensive Makefile:

```bash
# Install dependencies
make install                     # Installs Go and npm dependencies

# Generate all code (proto + sqlc)
make generate                    # Must have PATH configured

# Start PostgreSQL
make db                          # Starts docker compose

# Run backend
make backend                     # Runs Go server

# Run frontend
make frontend                    # Runs Next.js dev server

# Run all tests
make test                        # Runs backend tests and frontend type check

# Clean up
make clean                       # Stops containers, removes generated code
```

### Direct Commands

**Backend:**
```bash
cd /workspace/backend
export PATH=$PATH:$(go env GOPATH)/bin
buf generate ../proto
sqlc generate
go run .
```

**Frontend:**
```bash
cd /workspace/frontend
npm install
npx buf generate ../proto
npm run dev
# or
npm run build && npm start
```

## Known Issues and Warnings

### Non-Critical Warnings

1. **@bufbuild/protoc-gen-connect-es deprecation**: The package is deprecated but functional. Can be updated later with `npx @connectrpc/connect-migrate@latest`

2. **Auth0 Edge Runtime Warning**: The Auth0 crypto module shows a warning about Edge Runtime compatibility, but this doesn't affect functionality

3. **Unused buf dependency**: The proto/buf.yaml references googleapis which isn't used, but this is harmless

### Critical Requirements

1. **PATH Configuration**: The Go bin directory MUST be in PATH for tools like sqlc, migrate, and protoc plugins to work from Makefile or shell scripts

2. **PostgreSQL Must Be Running**: The backend requires PostgreSQL to be running on port 5434 before it can start

3. **Code Generation Required**: The generated code (`backend/internal/gen/` and `frontend/src/lib/gen/`) is not committed to the repository and must be generated after cloning

## Testing the Setup

### Backend Tests

```bash
cd /workspace/backend
export PATH=$PATH:$(go env GOPATH)/bin
go test ./... -v
```

### Frontend Type Checking

```bash
cd /workspace/frontend
npx tsc --noEmit
```

### Linting

```bash
# Lint proto files
buf lint proto

# Lint frontend
cd frontend && npm run lint
```

## Summary

This VM environment is fully configured with:

✅ **Backend Tools**
- Go 1.22.2
- Buf CLI 1.47.2
- sqlc 1.30.0
- golang-migrate
- protoc-gen-go 1.36.11
- protoc-gen-connect-go
- All Go dependencies downloaded

✅ **Frontend Tools**
- Node.js 22.21.1
- npm with 383 packages installed
- All TypeScript dependencies
- Buf CLI (via npm)

✅ **Database**
- Docker 28.2.2
- PostgreSQL 16 container running on port 5434

✅ **Code Generation**
- All protobuf code generated (backend + frontend)
- All sqlc database code generated
- Both builds verified to work

✅ **Verification**
- Backend compiles successfully
- Frontend builds successfully
- All type checks pass
- Database is accessible

The VM is ready for development, testing, and deployment of the CloutGG application!

## Quick Start (After VM Snapshot)

```bash
# 1. Set up PATH (add to ~/.bashrc for persistence)
export PATH=$PATH:$(go env GOPATH)/bin

# 2. Start PostgreSQL
sudo docker start cloutgg-postgres

# 3. Verify setup
cd /workspace
make generate  # Should complete without errors

# 4. Start backend (in one terminal)
cd backend && go run .

# 5. Start frontend (in another terminal)
cd frontend && npm run dev

# 6. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

---

**Last Updated**: December 16, 2025
**VM OS**: Linux 6.12.58+
**Shell**: bash
