# VM Environment Setup Summary

This document summarizes the complete VM environment setup for the CloutGG repository.

## Overview

This repository is a full-stack web application with:
- **Backend**: Go 1.22+ with Connect RPC and PostgreSQL
- **Frontend**: Next.js 15 with TypeScript and React 18
- **Database**: PostgreSQL 16 (via Docker)
- **API**: Protocol Buffers with Buf CLI for code generation
- **Infrastructure**: Docker Compose for local development

## Pre-installed Tools

The VM came with these tools already installed:
- **Go 1.22.2** (`/usr/bin/go`)
- **Node.js v22.21.1** (via NVM)
- **npm v10.9.4**
- Git and basic Linux utilities

## Tools Installed During Setup

### 1. Go Backend Tools

| Tool | Version | Purpose | Installation Method |
|------|---------|---------|-------------------|
| **sqlc** | v1.30.0 | Type-safe SQL code generation | `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest` |
| **protoc-gen-go** | v1.36.11 | Protocol Buffer Go code generation | `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest` |

**Installation Path**: `/home/ubuntu/go/bin/`

### 2. Node.js Frontend Dependencies

- **383 npm packages** installed in `/workspace/frontend/node_modules`
- **0 vulnerabilities** detected
- Key packages:
  - Next.js v15.5.9
  - TypeScript v5.9.3
  - React v18.3.1
  - Auth0 v4.14.0
  - Tailwind CSS v3.4.15
  - Buf/Protobuf tools

**Installation Method**: `npm install` in frontend directory

### 3. Docker Infrastructure

| Tool | Version | Purpose | Installation Method |
|------|---------|---------|-------------------|
| **Docker Engine** | v29.1.3 | Container runtime | Official Docker install script |
| **Docker Compose** | v5.0.0 | Multi-container orchestration | Docker CLI plugin |
| **golang-migrate** | v4.17.0 | Database migration tool | Binary download from GitHub |

**Docker Configuration**:
- Storage driver: `vfs` (for nested container compatibility)
- Config location: `/etc/docker/daemon.json`
- Startup script: `/workspace/start-docker.sh`

### 4. Protocol Buffer Tools

| Tool | Version | Purpose | Installation Method |
|------|---------|---------|-------------------|
| **Buf CLI** | v1.61.0 | Modern protobuf tooling | Binary download from GitHub |

**Installation Path**: `/usr/local/bin/buf`

## Container Services

### PostgreSQL Database

- **Image**: postgres:16-alpine
- **Container Name**: cloutgg-postgres
- **Port**: 5434 (host) → 5432 (container)
- **Status**: ✅ Running and Healthy
- **Database**: cloutgg
- **Tables Created**: 6 (companies, company_comments, company_ratings, users, votes, schema_migrations)
- **Migrations Applied**: 3/3 successful

**Connection String**:
```
postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
```

## Code Generation

### Generated Files (Not Committed to Git)

#### Backend Go Code
- **Location**: `backend/internal/gen/apiv1/`
- **Files**:
  - `api.pb.go` (75 KB, ~2,425 lines) - Protocol buffer messages
  - `apiv1connect/api.connect.go` (28 KB, ~502 lines) - Connect RPC handlers
- **Generator**: protoc-gen-go v1.36.11 + protoc-gen-connect-go

#### Frontend TypeScript Code
- **Location**: `frontend/src/lib/gen/apiv1/`
- **Files**:
  - `api_pb.d.ts` + `api_pb.js` (40 KB, ~1,327 lines) - Protocol buffer types
  - `api_connect.d.ts` + `api_connect.js` (10 KB, ~322 lines) - Connect client
- **Generator**: protoc-gen-es v2.10.2 + protoc-gen-connect-es v1.6.1

#### Backend Database Code
- **Location**: `backend/internal/db/sqlc/`
- **Files**: Type-safe Go code for SQL queries
- **Generator**: sqlc v1.30.0

## Issues Resolved

### 1. Docker Overlay Filesystem Error
**Problem**: Nested container environment didn't support overlayfs  
**Solution**: Configured Docker to use `vfs` storage driver  
**Config**: `/etc/docker/daemon.json`

### 2. Docker Daemon Auto-Start
**Problem**: systemd not available in container environment  
**Solution**: Use custom startup script (`/workspace/start-docker.sh`)

### 3. Backend Import Path Mismatch
**Problem**: Code imported from wrong generated path  
**Solution**: Fixed imports in `backend/main.go` and `backend/internal/service/rankings.go`

### 4. Missing Protobuf Files
**Problem**: Frontend build failed without generated proto files  
**Solution**: Run `buf generate proto` before building

## Verification Steps Completed

### Backend
- ✅ Go dependencies downloaded (`go mod download`)
- ✅ sqlc code generation successful
- ✅ Protocol buffer generation successful
- ✅ Backend compiles successfully (`go build -v`)
- ✅ Go vet passes (`go vet ./...`)

### Frontend
- ✅ npm dependencies installed (383 packages)
- ✅ Protocol buffer generation successful
- ✅ ESLint passes (`npm run lint`)
- ✅ TypeScript type checking passes (`npx tsc --noEmit`)
- ✅ Production build succeeds (`npm run build`)

### Infrastructure
- ✅ Docker daemon running
- ✅ PostgreSQL container healthy
- ✅ Database initialized with migrations
- ✅ All 6 tables created
- ✅ Connection tests successful

### Buf CLI
- ✅ Code generation working (`buf generate proto`)
- ✅ Linting working (`buf lint proto`)
- ✅ Formatting working (`buf format proto --write`)
- ✅ Build working (`buf build proto`)
- ✅ Dependencies updating (`buf dep update proto`)

## Quick Start Commands

### Initial Setup (One-time)
```bash
# Start Docker daemon (if not running)
bash /workspace/start-docker.sh

# Start PostgreSQL
docker compose up -d

# Generate all code
make generate

# Install dependencies
make install
```

### Development Workflow
```bash
# Terminal 1: Start Docker & Database
docker compose up -d

# Terminal 2: Start Backend
cd backend
go run .

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

### After Modifying Proto Files
```bash
# Regenerate code
buf generate proto

# Or use Make
make generate-proto
```

### After Modifying SQL Queries
```bash
# Regenerate database code
cd backend && sqlc generate

# Or use Make
make generate-sqlc
```

## Environment Variables

### Backend
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
PORT=8080
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make generate` | Generate all code (proto + sqlc) |
| `make dev` | Start all services |
| `make db` | Start PostgreSQL container |
| `make backend` | Run Go backend server |
| `make frontend` | Run Next.js frontend |
| `make test` | Run all tests |
| `make clean` | Clean up containers and generated code |
| `make lint-proto` | Lint proto files |

## Testing Commands

### Backend Tests
```bash
cd backend
go test ./... -v
```

### Frontend Type Checking
```bash
cd frontend
npx tsc --noEmit
```

### Frontend Linting
```bash
cd frontend
npm run lint
```

## Build Commands

### Backend
```bash
cd backend
go build -v
# Creates: backend/backend (17 MB binary)
```

### Frontend
```bash
cd frontend
npm run build
# Creates: frontend/.next/ (optimized production build)
```

## Deployment Notes

This repository is configured for deployment on **Railway**:
- Backend root directory: `backend/`
- Frontend root directory: `frontend/`
- Proto code generation happens automatically during builds
- Each service has its own `buf.gen.yaml` for independent builds

## Tool Locations

```
Go:               /usr/bin/go
Node.js:          /home/ubuntu/.nvm/versions/node/v22.21.1/bin/node
npm:              /home/ubuntu/.nvm/versions/node/v22.21.1/bin/npm
sqlc:             /home/ubuntu/go/bin/sqlc
protoc-gen-go:    /home/ubuntu/go/bin/protoc-gen-go
buf:              /usr/local/bin/buf
docker:           /usr/bin/docker
migrate:          /usr/local/bin/migrate
```

## System Information

- **OS**: Linux 6.12.58+ (Ubuntu)
- **Architecture**: x86_64
- **Shell**: bash
- **Git Repository**: /workspace

## Status Summary

| Component | Status | Version |
|-----------|--------|---------|
| Go | ✅ Ready | 1.22.2 |
| Node.js | ✅ Ready | v22.21.1 |
| npm | ✅ Ready | 10.9.4 |
| Docker | ✅ Running | v29.1.3 |
| Docker Compose | ✅ Ready | v5.0.0 |
| PostgreSQL | ✅ Healthy | 16-alpine |
| Buf CLI | ✅ Ready | v1.61.0 |
| sqlc | ✅ Ready | v1.30.0 |
| protoc-gen-go | ✅ Ready | v1.36.11 |
| golang-migrate | ✅ Ready | v4.17.0 |
| Backend Build | ✅ Success | 17 MB |
| Frontend Build | ✅ Success | Optimized |
| Database | ✅ Initialized | 6 tables |
| Migrations | ✅ Applied | 3/3 |

## Notes for Future Use

1. **Docker Daemon**: Must be started manually with `/workspace/start-docker.sh` (systemd not available)
2. **Generated Code**: Not committed to git - run `make generate` after cloning
3. **Port 5434**: PostgreSQL runs on 5434 (not 5432) to avoid conflicts
4. **Build Order**: Proto generation → sqlc generation → Go build
5. **Frontend Build**: Proto files auto-generate via prebuild script if missing

---

**Environment Setup Complete!** 🎉

All tools installed, dependencies resolved, code generated, and builds verified. The VM is ready for development, testing, and deployment.
