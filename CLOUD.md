# Cloud VM Setup Guide

This document describes the complete VM environment setup for the CloutGG repository.

## Overview

This repository is a full-stack application with:
- **Frontend**: Next.js 15 with TypeScript and React 18
- **Backend**: Go 1.22 with Connect RPC
- **Database**: PostgreSQL 16 (via Docker)
- **Code Generation**: Buf CLI (protobuf), sqlc (database queries)

## Pre-installed Software

The VM comes with the following tools already installed and configured:

### Core Development Tools

| Tool | Version | Location | Purpose |
|------|---------|----------|---------|
| **Node.js** | v22.21.1 | `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/node` | JavaScript runtime for frontend |
| **npm** | v10.9.4 | `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/npm` | Package manager for frontend |
| **Go** | 1.22.2 | `/usr/bin/go` | Backend programming language |
| **Docker** | 28.2.2 | `/usr/bin/docker` | Container runtime for PostgreSQL |
| **Buf CLI** | 1.61.0 | `/usr/local/bin/buf` | Protobuf code generation |
| **sqlc** | 1.30.0 | `/home/ubuntu/go/bin/sqlc` | Type-safe SQL code generation |

### Go Development Tools

These Go tools are installed in `/home/ubuntu/go/bin/`:

- **protoc-gen-go** (v1.36.11) - Protocol buffer compiler plugin for Go
- **protoc-gen-connect-go** (v1.19.1) - Connect RPC code generator for Go
- **sqlc** (v1.30.0) - SQL compiler for type-safe Go code

### Frontend Dependencies

All npm packages are installed in `/workspace/frontend/node_modules/`:
- 383 packages installed with 0 vulnerabilities
- Key packages: next@15.5.9, react@18.3.1, typescript@5.9.3

### Backend Dependencies

All Go modules are downloaded via `go mod download` in `/workspace/backend/`.

## Environment Configuration

### PATH Configuration

The following PATH additions have been made to `~/.bashrc`:

```bash
export PATH=$PATH:/home/ubuntu/go/bin
```

This ensures all Go tools (sqlc, protoc-gen-go, protoc-gen-connect-go) are available in the shell.

### Node.js Configuration

Node.js is installed via nvm (Node Version Manager). The nvm configuration is automatically loaded in the shell profile.

## Quick Start

### 1. Generate Code

Generated code (protobuf and sqlc) is not committed to the repository. Generate it first:

```bash
make generate
```

This generates:
- Go server code in `backend/internal/gen/`
- TypeScript client code in `frontend/src/lib/gen/`
- sqlc database code in `backend/internal/db/sqlc/`

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL on port 5434 (mapped from container port 5432).

### 3. Start Backend

```bash
cd backend
go run .
```

The Connect RPC server runs on http://localhost:8080

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend runs on http://localhost:3000

## Development Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make generate` | Generate all code (proto + sqlc) |
| `make dev` | Start all services (db, backend, frontend) |
| `make test` | Run all tests |
| `make clean` | Clean up containers and generated code |
| `make lint-proto` | Lint proto files |

## Docker Notes

### Docker Daemon

Docker is installed but the system doesn't use systemd. If the Docker daemon is not running:

```bash
sudo dockerd &
```

### Docker Compose Compatibility

The apt-installed `docker-compose` (v1.29.2) has compatibility issues with the system's Python/requests libraries. As a workaround, you can:

1. Use native `docker` commands directly
2. Install Docker Compose V2 plugin (recommended for production)

The PostgreSQL container can be managed with direct docker commands:

```bash
# Start database
docker run -d \
  --name cloutgg-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cloutgg \
  -p 5434:5432 \
  postgres:16-alpine

# Stop database
docker stop cloutgg-postgres
docker rm cloutgg-postgres
```

However, for development, `docker compose up -d` should work despite the warning messages.

## Verification

To verify the VM setup is working correctly:

```bash
# Check all tools are available
which node npm go docker buf sqlc

# Check versions
node --version    # v22.21.1
npm --version     # 10.9.4
go version        # go1.22.2
docker --version  # 28.2.2
buf --version     # 1.61.0
sqlc version      # v1.30.0

# Generate code
make generate

# Build backend
cd backend && go build

# Lint frontend
cd frontend && npm run lint
```

All commands should complete successfully.

## Environment Variables

For local development, you may need to set:

```bash
# Database
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"

# Backend
export PORT=8080

# Frontend (in .env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Note: The database port is 5434 (not 5432) due to the docker-compose.yml configuration.

## Known Issues and Workarounds

### Issue 1: sqlc not in PATH

**Symptom**: `sqlc: not found` when running `make generate`

**Solution**: The PATH is configured in `~/.bashrc`. Either:
1. Start a new shell session to load the updated PATH
2. Run `source ~/.bashrc` in the current shell
3. Run with explicit PATH: `PATH=$PATH:/home/ubuntu/go/bin make generate`

### Issue 2: Docker daemon not running

**Symptom**: `Cannot connect to the Docker daemon`

**Solution**: Start the Docker daemon manually:
```bash
sudo dockerd &
```

### Issue 3: docker-compose warnings

**Symptom**: URLSchemeUnknown errors with docker-compose

**Solution**: These are warnings and can be ignored. The docker-compose commands still work. Alternatively, use direct docker commands.

## Railway Deployment

This repository is configured for deployment on Railway. The following files control the deployment:

- `railway.toml` - Railway configuration
- `.railwayignore` - Files to ignore during deployment
- `Dockerfile.backend` - Backend container image
- `Dockerfile.frontend` - Frontend container image

Railway automatically:
1. Generates proto code during build (via buf CLI)
2. Installs dependencies
3. Builds and deploys the services

## Additional Resources

- [Project README](/workspace/README.md)
- [Makefile](/workspace/Makefile)
- [Docker Compose Config](/workspace/docker-compose.yml)

## Summary

The VM is now fully configured with:
- ✅ Node.js 22.21.1 with npm 10.9.4
- ✅ Go 1.22.2 with required tools
- ✅ Docker 28.2.2 with PostgreSQL 16 support
- ✅ Buf CLI 1.61.0 for protobuf generation
- ✅ sqlc 1.30.0 for database code generation
- ✅ All frontend dependencies installed (383 packages)
- ✅ All backend dependencies downloaded
- ✅ Code generation verified and working
- ✅ Backend builds successfully
- ✅ Frontend lints successfully

The environment is ready for development!
