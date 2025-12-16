# VM Environment Setup Summary

This document summarizes the complete VM environment setup for the CloutGG repository.

## Overview

This repository is a full-stack web application with:
- **Backend**: Go 1.23+ with Connect RPC and PostgreSQL
- **Frontend**: Next.js 15 with TypeScript and React 18
- **Database**: PostgreSQL 16 (via Docker)
- **API**: Protocol Buffers with Buf CLI for code generation
- **Infrastructure**: Docker Compose for local development

## Pre-installed Tools

The VM came with these tools already installed:
- **Node.js v22.21.1** (via NVM)
- **npm v10.9.4**
- Git and basic Linux utilities

## Tools Installed During Setup

### 1. Go Backend Tools

| Tool | Version | Purpose | Installation Method |
|------|---------|---------|-------------------|
| **Go** | 1.23.4 | Go programming language | Downloaded from golang.org |
| **sqlc** | v1.30.0 | Type-safe SQL code generation | `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest` |
| **protoc-gen-go** | v1.36.11 | Protocol Buffer Go code generation | `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest` |
| **protoc-gen-connect-go** | v1.19.1 | Connect RPC Go code generation | `go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest` |
| **golang-migrate** | dev | Database migration tool | `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest` |

**Installation Path**: `/home/ubuntu/go/bin/` (added to PATH in `~/.bashrc`)

### 2. Node.js Frontend Dependencies

- **383 npm packages** installed in `/workspace/frontend/node_modules`
- **0 vulnerabilities** detected
- Key packages:
  - Next.js v15.5.9
  - TypeScript v5.9.3
  - React v18.3.1
  - Auth0 v4.14.0
  - Tailwind CSS v3.4.15
  - Buf/Protobuf tools (@bufbuild/buf v1.61.0)
  - Connect RPC (@connectrpc/connect v2.1.1)

**Installation Method**: `npm install` in frontend directory

### 3. Docker Infrastructure

| Tool | Version | Purpose | Installation Method |
|------|---------|---------|-------------------|
| **Docker Engine** | v29.1.3 | Container runtime | Official Docker install script |
| **Docker Compose** | v5.0.0 | Multi-container orchestration | Docker CLI plugin |
| **Docker Buildx** | v0.30.1 | Docker build plugin | Included with Docker |

**Docker Configuration**:
- Storage driver: `vfs` (configured to work around overlayfs kernel limitations)
- Config location: `/etc/docker/daemon.json`
- Startup script: `/workspace/start-docker-daemon.sh`
- Daemon must be started manually (systemd not available in VM environment)

### 4. Protocol Buffer Tools

| Tool | Version | Purpose | Installation Method |
|------|---------|---------|-------------------|
| **Buf CLI** | v1.61.0 | Modern protobuf tooling | `go install github.com/bufbuild/buf/cmd/buf@latest` |

**Installation Path**: `/home/ubuntu/go/bin/buf`

## Container Services

### PostgreSQL Database

- **Image**: postgres:16-alpine
- **Container Name**: cloutgg-postgres
- **Port**: 5434 (host) → 5432 (container)
- **Status**: ✅ Running and Healthy
- **Database**: cloutgg
- **Tables Created**: 6 (companies, company_comments, company_ratings, users, votes, schema_migrations)
- **Seed Data**: 30 companies loaded
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
  - `api.pb.go` (~75 KB) - Protocol buffer messages
  - `apiv1connect/api.connect.go` - Connect RPC handlers
- **Generator**: protoc-gen-go v1.36.11 + protoc-gen-connect-go v1.19.1

#### Frontend TypeScript Code
- **Location**: `frontend/src/lib/gen/apiv1/`
- **Files**:
  - `api_pb.ts` - Protocol buffer types
  - `api_connect.ts` - Connect client
- **Generator**: @bufbuild/protoc-gen-es + @bufbuild/protoc-gen-connect-es

#### Backend Database Code
- **Location**: `backend/internal/db/sqlc/`
- **Files**: Type-safe Go code for SQL queries
- **Generator**: sqlc v1.30.0

## Issues Resolved

### 1. Docker Overlay Filesystem Error
**Problem**: Docker failed to start containers with "failed to mount /tmp/containerd-mount: invalid argument" error. The overlayfs storage driver hit kernel limitations with the number of image layers (11 layers in postgres:16-alpine).

**Root Cause**: The VM environment's kernel (6.12.58+) has limitations with overlayfs in nested virtualization scenarios, particularly when handling multi-layer images.

**Solution**: Configured Docker to use `vfs` storage driver instead of overlayfs.

**Implementation**:
1. Stopped Docker daemon
2. Created `/etc/docker/daemon.json` with `{"storage-driver": "vfs"}`
3. Removed `/var/lib/docker` directory
4. Restarted Docker daemon

**Trade-offs**: VFS is less efficient than overlayfs (no copy-on-write), but it works reliably in constrained environments.

### 2. Docker Daemon Auto-Start
**Problem**: systemd not available in container environment  
**Solution**: Use custom startup script (`/workspace/start-docker-daemon.sh`)  
**Usage**: Run `sudo bash /workspace/start-docker-daemon.sh` after VM restart

### 3. Go Version Upgrade
**Problem**: Initial Go 1.22.2 was below recommended 1.23+  
**Solution**: Upgraded to Go 1.23.4 from official downloads  
**Benefit**: Access to latest language features and performance improvements

## Verification Steps Completed

### Backend
- ✅ Go 1.23.4 installed and working
- ✅ Go dependencies downloaded (`go mod download`)
- ✅ sqlc code generation successful
- ✅ Protocol buffer generation successful
- ✅ Backend compiles successfully (`go build`)
- ✅ Backend starts and connects to database
- ✅ Connect RPC server listening on http://localhost:8080

### Frontend
- ✅ npm dependencies installed (383 packages, 0 vulnerabilities)
- ✅ Protocol buffer generation successful
- ✅ TypeScript type checking passes (`npx tsc --noEmit`)
- ✅ Production build succeeds (`npm run build`)
- ✅ Frontend prebuild script generates proto files automatically

### Infrastructure
- ✅ Docker daemon running (with vfs storage driver)
- ✅ PostgreSQL container healthy
- ✅ Database initialized with migrations
- ✅ All 6 tables created
- ✅ 30 companies seeded
- ✅ Connection tests successful (`pg_isready`)

### Code Generation
- ✅ `make generate` works end-to-end
- ✅ Buf linting working (`buf lint proto`)
- ✅ Go backend code generated
- ✅ TypeScript frontend code generated
- ✅ sqlc database code generated

## Quick Start Commands

### Initial Setup (One-time)
```bash
# Start Docker daemon (required after VM restart)
sudo bash /workspace/start-docker-daemon.sh

# Start PostgreSQL
sudo docker compose up -d

# Generate all code (proto + sqlc)
make generate

# Run database migrations
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up
```

### Development Workflow
```bash
# Terminal 1: Ensure Docker daemon is running
sudo bash /workspace/start-docker-daemon.sh
sudo docker compose up -d

# Terminal 2: Start Backend
cd backend
DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable" go run .

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

### After Modifying Proto Files
```bash
# Regenerate all proto code
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
| `make install` | Install all dependencies (Go modules + npm packages) |
| `make generate` | Generate all code (proto + sqlc) |
| `make generate-proto` | Generate only protobuf code |
| `make generate-sqlc` | Generate only sqlc database code |
| `make dev` | Start all services |
| `make db` | Start PostgreSQL container |
| `make backend` | Run Go backend server |
| `make frontend` | Run Next.js frontend |
| `make test` | Run all tests |
| `make clean` | Clean up containers and generated code |
| `make lint-proto` | Lint proto files |
| `make migrate-up` | Run database migrations |
| `make migrate-down` | Rollback database migrations |

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
go build -o backend .
# Creates: backend/backend (~18 MB binary)
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
- Railway uses Nixpacks for builds (doesn't use Docker)

## Tool Locations

```
Go:                    /usr/local/go/bin/go
Node.js:               /home/ubuntu/.nvm/versions/node/v22.21.1/bin/node
npm:                   /home/ubuntu/.nvm/versions/node/v22.21.1/bin/npm
sqlc:                  /home/ubuntu/go/bin/sqlc
protoc-gen-go:         /home/ubuntu/go/bin/protoc-gen-go
protoc-gen-connect-go: /home/ubuntu/go/bin/protoc-gen-connect-go
buf:                   /home/ubuntu/go/bin/buf
docker:                /usr/bin/docker
migrate:               /home/ubuntu/go/bin/migrate
```

## PATH Configuration

The following was added to `~/.bashrc` for persistent PATH configuration:
```bash
export PATH=$PATH:/usr/local/go/bin:$(go env GOPATH)/bin
```

## System Information

- **OS**: Ubuntu 24.04.3 LTS (Noble Numbat)
- **Kernel**: Linux 6.12.58+
- **Architecture**: x86_64
- **Shell**: bash
- **Git Repository**: /workspace

## Status Summary

| Component | Status | Version |
|-----------|--------|---------|
| Go | ✅ Ready | 1.23.4 |
| Node.js | ✅ Ready | v22.21.1 |
| npm | ✅ Ready | 10.9.4 |
| Docker | ✅ Running | v29.1.3 |
| Docker Compose | ✅ Ready | v5.0.0 |
| PostgreSQL | ✅ Healthy | 16.11-alpine |
| Buf CLI | ✅ Ready | v1.61.0 |
| sqlc | ✅ Ready | v1.30.0 |
| protoc-gen-go | ✅ Ready | v1.36.11 |
| protoc-gen-connect-go | ✅ Ready | v1.19.1 |
| golang-migrate | ✅ Ready | dev |
| Backend Build | ✅ Success | ~18 MB |
| Frontend Build | ✅ Success | Optimized |
| Database | ✅ Initialized | 6 tables, 30 companies |
| Migrations | ✅ Applied | 3/3 |

## Notes for Future Use

1. **Docker Daemon**: Must be started manually with `sudo bash /workspace/start-docker-daemon.sh` after VM restart (systemd not available)
2. **Docker Storage**: Uses `vfs` driver (not overlayfs) due to kernel limitations - this is less efficient but more compatible
3. **Generated Code**: Not committed to git - run `make generate` after cloning
4. **Port 5434**: PostgreSQL runs on 5434 (not 5432) as configured in docker-compose.yml
5. **Build Order**: Proto generation → sqlc generation → Go build
6. **Frontend Build**: Proto files auto-generate via prebuild script if missing
7. **Sudo Required**: Docker commands require `sudo` in this environment

## Docker Storage Driver Details

The VM uses the **vfs** (Virtual File System) storage driver for Docker instead of the default overlayfs. This was necessary due to kernel limitations in the nested virtualization environment.

**VFS Characteristics**:
- ✅ Maximum compatibility - works in all environments
- ✅ Simple and reliable - no kernel dependencies
- ❌ No copy-on-write - full copies of image layers
- ❌ Higher disk usage than overlayfs
- ❌ Slower container creation than overlayfs

**Why VFS was needed**: The postgres:16-alpine image has 11 layers, which triggered an "invalid argument" error with overlayfs in this specific kernel environment (6.12.58+). VFS has no such layer limitations.

**Performance Impact**: Acceptable for development environments. For production, use a host with proper overlayfs support.

---

**Environment Setup Complete!** 🎉

All tools installed, dependencies resolved, code generated, database initialized, and builds verified. The VM is ready for development, testing, and deployment.

## Summary of Installed Components

- **Go 1.23.4** with 4 development tools (sqlc, protoc-gen-go, protoc-gen-connect-go, migrate)
- **Node.js v22.21.1** with 383 npm packages
- **Docker v29.1.3** with vfs storage driver
- **PostgreSQL 16** running in container with 6 tables and 30 seed companies
- **Buf CLI v1.61.0** for protocol buffer code generation
- **All code generated** and verified working
- **Backend and frontend** build successfully
- **Database migrations** applied successfully
