# Cloud VM Environment Setup Guide

This document describes the complete VM environment setup for the CloutGG repository. This VM comes pre-configured with all necessary tools and dependencies for developing, building, and deploying the application.

## Overview

CloutGG is a full-stack web application with:
- **Backend**: Go 1.22+ with Connect RPC
- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Database**: PostgreSQL 16
- **Code Generation**: Buf CLI for Protocol Buffers, sqlc for database queries
- **Infrastructure**: Docker and Docker Compose

## Installed Components

### 1. Node.js & npm (Frontend)

**Version**: Node.js v22.21.1, npm 10.9.4
- **Installation Method**: Pre-installed via nvm (Node Version Manager)
- **Location**: `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/node`
- **Status**: ✅ Ready - Exceeds requirement (v20+)

**Frontend Dependencies**:
- 383 npm packages installed in `/workspace/frontend/node_modules`
- Key packages: Next.js 15, React 18, TypeScript, @connectrpc/connect
- All dev dependencies including ESLint, Tailwind CSS, TypeScript
- Zero vulnerabilities detected

**Verification**:
```bash
node --version  # v22.21.1
npm --version   # 10.9.4
cd frontend && npm run lint  # ✅ Passes
cd frontend && npm run build # ✅ Builds successfully
```

### 2. Go & Backend Tools

**Version**: Go 1.22.2 (linux/amd64)
- **Location**: `/usr/local/go/bin/go`
- **Status**: ✅ Ready - Meets requirement (v1.22+)

**Go Tools Installed** (in `/home/ubuntu/go/bin/`):
- `protoc-gen-go` (v1.36.11) - Protocol Buffers Go code generator
- `protoc-gen-connect-go` (latest) - Connect RPC Go service generator
- `sqlc` (v1.30.0) - Type-safe SQL to Go code generator

**Backend Dependencies**:
- All Go modules downloaded via `go mod download`
- Key modules: connectrpc.com/connect, github.com/jackc/pgx/v5, github.com/joho/godotenv

**PATH Configuration**:
- `/home/ubuntu/go/bin` added to `~/.bashrc` for persistent access to Go tools

**Verification**:
```bash
go version  # go1.22.2 linux/amd64
cd backend && go build  # ✅ Compiles successfully
cd backend && sqlc generate  # ✅ Generates type-safe Go code
```

### 3. Docker & PostgreSQL

**Docker Version**: 29.1.3 (build f52814d)
- **Installation Method**: Installed using `/workspace/get-docker.sh`
- **Daemon Status**: ✅ Running with `vfs` storage driver
- **Configuration**: `/etc/docker/daemon.json` configured for container environments

**Docker Configuration Details**:
- Storage driver: `vfs` (required for container-within-container environments)
- Socket permissions: Configured for non-root access (`chmod 666 /var/run/docker.sock`)
- Daemon runs in background via: `sudo dockerd > /tmp/dockerd.log 2>&1 &`

**PostgreSQL Container**:
- **Container Name**: `cloutgg-postgres`
- **Image**: postgres:16-alpine (PostgreSQL 16.11)
- **Status**: ✅ Running and healthy
- **Port**: Host 5434 → Container 5432
- **Credentials**:
  - Username: `postgres`
  - Password: `postgres`
  - Database: `cloutgg`
- **Volume**: `workspace_postgres_data` (persistent storage)

**Verification**:
```bash
docker --version  # Docker version 29.1.3
docker ps  # Shows cloutgg-postgres running
docker exec cloutgg-postgres pg_isready -U postgres  # ✅ Accepting connections
```

### 4. Buf CLI & Protocol Buffers

**Buf Version**: 1.61.0
- **Installation Method**: Installed globally via npm (`npm install -g @bufbuild/buf`)
- **Status**: ✅ Ready for code generation

**Protobuf Code Generation**:
- Uses Buf's managed mode with remote plugin execution
- No local protoc installation required
- Generates code for both backend (Go) and frontend (TypeScript)

**Generated Files**:

Backend (Go):
- `/workspace/backend/internal/gen/apiv1/api.pb.go` - Protocol Buffers Go code
- `/workspace/backend/internal/gen/apiv1/apiv1connect/api.connect.go` - Connect-Go handlers

Frontend (TypeScript):
- `/workspace/frontend/src/lib/gen/apiv1/api_pb.js` - Protocol Buffers JS code
- `/workspace/frontend/src/lib/gen/apiv1/api_pb.d.ts` - TypeScript definitions
- `/workspace/frontend/src/lib/gen/apiv1/api_connect.js` - Connect-ES client
- `/workspace/frontend/src/lib/gen/apiv1/api_connect.d.ts` - TypeScript definitions

**Note**: Generated files are `.gitignore`d and auto-generated during CI/CD builds.

**Verification**:
```bash
buf --version  # 1.61.0
buf generate proto  # ✅ Generates all code successfully
```

## Quick Start Commands

### Start Development Environment

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Generate all code (protobuf + sqlc)
make generate
# Or manually:
buf generate proto
cd backend && sqlc generate

# 3. Start backend (in one terminal)
cd backend && go run .

# 4. Start frontend (in another terminal)
cd frontend && npm run dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5434

### Environment Variables

```bash
# Backend
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
export PORT=8080

# Frontend
export NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Common Development Tasks

### Install Dependencies
```bash
make install
# Or manually:
cd backend && go mod download
cd frontend && npm install
```

### Generate Code
```bash
make generate
# Generates protobuf code (buf) and sqlc database code
```

### Build Projects
```bash
# Backend
cd backend && go build

# Frontend
cd frontend && npm run build
```

### Run Tests
```bash
# Backend
cd backend && go test ./... -v

# Frontend (type checking)
cd frontend && npx tsc --noEmit
```

### Lint Code
```bash
# Frontend
cd frontend && npm run lint

# Proto files
buf lint proto
```

## Docker Management

### Start PostgreSQL
```bash
docker compose up -d
```

### Stop PostgreSQL
```bash
docker compose down
```

### View Logs
```bash
docker logs cloutgg-postgres
```

### Access PostgreSQL Shell
```bash
docker exec -it cloutgg-postgres psql -U postgres -d cloutgg
```

### Clean Up (including volumes)
```bash
docker compose down -v
```

## Troubleshooting

### Docker Daemon Not Running

If Docker commands fail, start the daemon:
```bash
sudo dockerd > /tmp/dockerd.log 2>&1 &
# Wait a few seconds for startup
docker ps  # Should work now
```

### Go Tools Not in PATH

If `sqlc` or `protoc-gen-go` commands are not found:
```bash
export PATH=$PATH:/home/ubuntu/go/bin
# Or permanently:
echo 'export PATH=$PATH:/home/ubuntu/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### PostgreSQL Connection Refused

Ensure the container is running and healthy:
```bash
docker ps  # Check STATUS column shows "healthy"
docker logs cloutgg-postgres  # Check for errors
```

The database is exposed on port **5434** (not the default 5432):
```bash
psql "postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
```

### Generated Code Missing

Run code generation:
```bash
buf generate proto
cd backend && sqlc generate
```

## System Requirements

This VM setup requires:
- **OS**: Linux (Ubuntu/Debian recommended)
- **Disk Space**: ~2GB for dependencies and Docker images
- **Memory**: 2GB+ recommended for running all services
- **Network**: Internet access for downloading dependencies

## What's Not Included

These items are intentionally not set up on the VM:
- **Auth0 Configuration**: Requires environment variables (AUTH0_SECRET, AUTH0_BASE_URL, etc.)
- **Production SSL Certificates**: For Railway deployment
- **CI/CD Secrets**: GitHub Actions and Railway secrets
- **Migration Tools**: golang-migrate CLI (optional, for manual migrations)

## Version Summary

| Component | Version | Status |
|-----------|---------|--------|
| Node.js | v22.21.1 | ✅ Ready |
| npm | 10.9.4 | ✅ Ready |
| Go | 1.22.2 | ✅ Ready |
| Docker | 29.1.3 | ✅ Ready |
| PostgreSQL | 16.11 | ✅ Running |
| Buf CLI | 1.61.0 | ✅ Ready |
| sqlc | 1.30.0 | ✅ Ready |
| protoc-gen-go | 1.36.11 | ✅ Ready |

## Notes for VM Snapshots

When taking a snapshot of this VM:
1. **Stop running processes**: Stop the backend and frontend dev servers
2. **Keep Docker running**: The PostgreSQL container can remain running
3. **Generated code**: Will need regeneration after cloning to new environments
4. **Environment variables**: Will need to be set per environment

After restoring from snapshot:
```bash
# Verify Docker is running
docker ps

# If needed, start Docker daemon
sudo dockerd > /tmp/dockerd.log 2>&1 &

# Start PostgreSQL if not running
docker compose up -d

# Generate code if missing
make generate
```

---

**Last Updated**: December 16, 2025  
**VM Setup Completed By**: Automated Cloud Agent
