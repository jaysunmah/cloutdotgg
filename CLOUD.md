# CloutGG - Cloud VM Development Environment Setup

**Date:** December 16, 2025  
**Repository:** /workspace  
**Status:** ✅ Fully Configured and Ready for Development

---

## Overview

This document describes the complete development environment setup for the CloutGG full-stack application, which consists of:
- **Backend**: Go 1.22+ with Connect RPC, PostgreSQL via pgx, sqlc for type-safe queries
- **Frontend**: Next.js 15, React 18, TypeScript, Connect-Web client
- **Protocol Buffers**: Buf CLI for code generation
- **Database**: PostgreSQL 16, golang-migrate for migrations
- **Infrastructure**: Docker for running PostgreSQL locally

---

## System Information

- **Operating System**: Ubuntu 24.04 LTS (Noble)
- **Architecture**: x86_64 (linux/amd64)
- **Shell**: bash

---

## Pre-installed Components

The following components were already present on the VM:

| Component | Version | Location |
|-----------|---------|----------|
| Go | 1.22.2 | System PATH |
| Node.js | 22.21.1 | System PATH |
| npm | 10.9.4 | System PATH |
| Ubuntu | 24.04 LTS | - |

---

## Installed Components

### 1. Frontend Development Tools

#### Node.js Packages
- **Total packages**: 383 npm packages installed
- **Installation time**: ~17 seconds
- **Location**: `/workspace/frontend/node_modules/`

#### Key Frontend Dependencies
- **Next.js**: 15.5.9
- **React**: 18.3.1
- **@bufbuild/buf**: 1.61.0 (CLI for protobuf)
- **@bufbuild/protoc-gen-es**: 1.10.1
- **@bufbuild/protoc-gen-connect-es**: 0.13.0
- **@connectrpc/connect**: 2.1.1
- **@connectrpc/connect-web**: 2.1.1
- **@auth0/nextjs-auth0**: 4.14.0
- **TypeScript**: 5.6.3
- **Tailwind CSS**: 3.4.15

#### Generated Frontend Code
- **Location**: `/workspace/frontend/src/lib/gen/apiv1/`
- **Files**:
  - `api_connect.d.ts` (5.3 KB)
  - `api_connect.js` (4.5 KB)
  - `api_pb.d.ts` (25.4 KB)
  - `api_pb.js` (14.4 KB)

### 2. Backend Development Tools

#### Go Tools Installed

| Tool | Version | Installation Method | Location |
|------|---------|---------------------|----------|
| sqlc | 1.30.0 | `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest` | `/home/ubuntu/go/bin/sqlc` |
| protoc-gen-go | 1.36.11 | `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest` | `/home/ubuntu/go/bin/protoc-gen-go` |
| protoc-gen-connect-go | latest | `go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest` | `/home/ubuntu/go/bin/protoc-gen-connect-go` |
| Buf CLI | 1.61.0 | Direct download from GitHub | `/usr/local/bin/buf` |
| golang-migrate | dev (v4) | `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest` | `/home/ubuntu/go/bin/migrate` |

#### Go Dependencies
All dependencies from `go.mod` were successfully downloaded:
- connectrpc.com/connect v1.18.1
- github.com/jackc/pgx/v5 v5.7.1
- github.com/joho/godotenv v1.5.1
- github.com/rs/cors v1.11.1
- golang.org/x/net v0.33.0
- google.golang.org/protobuf v1.35.0

#### Generated Backend Code
- **sqlc code**: `/workspace/backend/internal/db/sqlc/`
- **Protobuf code**: `/workspace/backend/internal/gen/`

#### Backend Compilation
- **Binary location**: `/workspace/backend/backend`
- **Binary size**: 17 MB
- **Type**: ELF 64-bit LSB executable, x86-64
- **Status**: ✅ Successfully compiled

### 3. Docker and Database Infrastructure

#### Docker Engine
- **Package**: docker.io
- **Version**: 28.2.2 (build 28.2.2-0ubuntu1~24.04.1)
- **Installation**: apt package manager
- **Status**: ✅ Running
- **Storage Driver**: vfs
- **Cgroup Driver**: cgroupfs

**Additional Docker Packages**:
- containerd 1.7.28
- runc 1.3.3
- bridge-utils
- iptables
- apparmor

#### Docker Compose
- **Legacy docker-compose**: 1.29.2 (Python-based, not recommended)
- **Modern docker compose v2**: 2.37.1 (recommended)
- **Preferred command**: `docker compose`
- **Status**: ✅ Working

#### PostgreSQL Database
- **Image**: postgres:16-alpine
- **Version**: PostgreSQL 16.11 on x86_64-pc-linux-musl
- **Container Name**: cloutgg-postgres
- **Database**: cloutgg
- **User/Password**: postgres/postgres
- **Host Port**: 5434 → Container Port 5432
- **Volume**: workspace_postgres_data (persistent)
- **Health Check**: Enabled (pg_isready every 5s)
- **Status**: ✅ Running and Healthy

---

## Quick Start Commands

### Install Dependencies
```bash
# Install all dependencies (already completed in this VM)
make install
```

### Generate Code
```bash
# Generate protobuf and sqlc code (already completed in this VM)
make generate
```

### Start PostgreSQL
```bash
cd /workspace
docker compose up -d
```

### Start Backend
```bash
cd /workspace/backend
go run .
# Backend runs on http://localhost:8080
```

### Start Frontend
```bash
cd /workspace/frontend
npm run dev
# Frontend runs on http://localhost:3000
```

---

## Environment Variables

### Database Connection
```bash
# For host machine connections
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable

# For Docker container connections (same network)
DATABASE_URL=postgresql://postgres:postgres@db:5432/cloutgg?sslmode=disable
```

### Backend Configuration
```bash
PORT=8080
```

### Frontend Configuration
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Database Migrations

### Run Migrations
```bash
cd /workspace/backend
export PATH=$PATH:$(go env GOPATH)/bin
migrate -path db/migrations -database "postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable" up
```

### Rollback Migrations
```bash
cd /workspace/backend
export PATH=$PATH:$(go env GOPATH)/bin
migrate -path db/migrations -database "postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable" down
```

### Create New Migration
```bash
make migrate-create
# Enter migration name when prompted
```

---

## Development Workflow

### 1. Start Services
```bash
# Start PostgreSQL
docker compose up -d

# Start backend (in one terminal)
cd backend && go run .

# Start frontend (in another terminal)
cd frontend && npm run dev
```

### 2. Code Generation

After modifying `.proto` files:
```bash
make generate
# Or separately:
buf generate proto          # Generate protobuf code
cd backend && sqlc generate # Generate sqlc code
```

### 3. Build and Test

**Frontend**:
```bash
cd frontend
npm run build      # Production build
npm run lint       # Run ESLint
npx tsc --noEmit   # Type checking
```

**Backend**:
```bash
cd backend
go build -o backend .  # Compile binary
go test ./... -v       # Run tests
```

---

## Verification Results

### ✅ Frontend
- **Node.js**: v22.21.1 ✅
- **npm**: v10.9.4 ✅
- **Dependencies installed**: 383 packages ✅
- **Buf CLI available**: v1.61.0 ✅
- **Protobuf code generated**: ✅
- **Build successful**: Next.js builds without errors ✅

### ✅ Backend
- **Go**: 1.22.2 ✅
- **sqlc installed**: v1.30.0 ✅
- **Buf CLI installed**: v1.61.0 ✅
- **protoc-gen-go installed**: v1.36.11 ✅
- **protoc-gen-connect-go installed**: ✅
- **Go dependencies downloaded**: ✅
- **sqlc code generated**: ✅
- **Protobuf code generated**: ✅
- **Backend compiles**: Binary created successfully ✅

### ✅ Infrastructure
- **Docker installed**: v28.2.2 ✅
- **Docker Compose v2 available**: v2.37.1 ✅
- **Docker daemon running**: ✅
- **PostgreSQL container running**: ✅
- **PostgreSQL healthy**: Accepting connections ✅
- **golang-migrate installed**: ✅

---

## Issues Encountered and Resolved

### Frontend Issues

#### 1. Deprecation Warning
- **Issue**: `@bufbuild/protoc-gen-connect-es@0.13.0` is deprecated
- **Impact**: Minimal - still functional
- **Future Action**: Consider migrating to `@connectrpc/connect-migrate`

#### 2. Buf Dependency Warning
- **Issue**: Module `buf.build/googleapis/googleapis` declared but unused
- **Impact**: None - just a cleanup suggestion

#### 3. Next.js Edge Runtime Warning
- **Issue**: Node.js 'crypto' module loaded in Edge Runtime (from Auth0)
- **Impact**: None for build - just a compatibility notice

### Backend Issues

#### 1. Initial sqlc Installation Timeout
- **Problem**: First `go install` command for sqlc timed out
- **Resolution**: Re-ran with increased timeout (120s) and completed successfully

#### 2. Go Version Switching
- **Note**: Some tools required Go 1.23+ or 1.24+, triggering automatic version switching to go1.24.11 during installation
- **Impact**: Normal behavior, doesn't affect project's use of Go 1.22.2

### Infrastructure Issues

#### 1. Docker Not Initially Installed
- **Problem**: Docker command not found
- **Resolution**: Installed docker.io package via apt
- **Status**: ✅ Resolved

#### 2. Docker Daemon Not Running
- **Problem**: Docker daemon wasn't automatically started
- **Resolution**: Started manually with `sudo dockerd` in background
- **Status**: ✅ Resolved

#### 3. Docker Socket Permissions
- **Problem**: Permission denied when connecting to Docker socket
- **Resolution**: 
  - Added user to docker group: `sudo usermod -aG docker $USER`
  - Set socket permissions: `sudo chmod 666 /var/run/docker.sock`
- **Status**: ✅ Resolved

#### 4. Legacy docker-compose Compatibility
- **Problem**: Legacy docker-compose had "Not supported URL scheme http+docker" error
- **Resolution**: Installed docker-compose-v2 package for modern `docker compose` plugin
- **Status**: ✅ Resolved

---

## Database Access

### Command Line Access
```bash
# Access PostgreSQL CLI
docker exec -it cloutgg-postgres psql -U postgres -d cloutgg

# Check database version
docker exec cloutgg-postgres psql -U postgres -d cloutgg -c "SELECT version();"

# List tables
docker exec -it cloutgg-postgres psql -U postgres -d cloutgg -c "\dt"

# Check if PostgreSQL is accepting connections
docker exec cloutgg-postgres pg_isready -U postgres
```

### Connection Strings

**Host Machine**:
```
postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
```

**Docker Containers (same network)**:
```
postgresql://postgres:postgres@db:5432/cloutgg?sslmode=disable
```

---

## Docker Management

### Start/Stop PostgreSQL
```bash
# Start
docker compose up -d

# Stop
docker compose down

# Stop and remove data volumes
docker compose down -v
```

### Check Container Status
```bash
# List running containers
docker ps

# Check container logs
docker logs cloutgg-postgres

# Check health status
docker inspect cloutgg-postgres --format='{{.State.Health.Status}}'
```

### Troubleshooting Docker

If Docker daemon stops:
```bash
sudo dockerd > /tmp/dockerd.log 2>&1 &
```

If permission issues occur:
```bash
sudo chmod 666 /var/run/docker.sock
```

---

## Build Statistics

### Frontend Build
- **Build time**: ~17 seconds
- **Next.js version**: 15.5.9
- **Total routes**: 6 (including middleware)
- **Bundle sizes**:
  - Home page: 141 KB First Load JS
  - Leaderboard: 140 KB First Load JS
  - Vote page: 147 KB First Load JS
  - Company pages: 141 KB First Load JS (dynamic)
  - Middleware: 81.9 KB

### Backend Build
- **Build time**: < 5 seconds
- **Binary size**: 17 MB
- **Type**: ELF 64-bit LSB executable

---

## Deployment (Railway)

This project is configured for automatic deployment to Railway. After making changes:

1. Commit changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

2. Push to main:
   ```bash
   git push origin main
   ```

3. Railway will automatically:
   - Detect changes
   - Install dependencies
   - Generate protobuf code (via buf CLI)
   - Build services
   - Deploy to production

**Note**: Proto code generation happens automatically during Railway builds. Each service's `buf.gen.yaml` installs the buf CLI and runs `buf generate` before building.

---

## Development Tools Reference

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make generate` | Generate all code (proto + sqlc) |
| `make generate-proto` | Generate only protobuf code |
| `make generate-sqlc` | Generate only sqlc code |
| `make dev` | Start all services |
| `make test` | Run all tests |
| `make test-backend` | Run backend tests |
| `make test-frontend` | Run frontend type checking |
| `make clean` | Clean containers and generated code |
| `make lint-proto` | Lint proto files |
| `make format-proto` | Format proto files |
| `make migrate-up` | Run database migrations |
| `make migrate-down` | Rollback migrations |
| `make migrate-create` | Create new migration |

---

## Architecture

```
┌─────────────┐     Connect RPC      ┌─────────────┐
│   Next.js   │ ◄──────────────────► │   Go API    │
│  Frontend   │    (HTTP/2, JSON)    │   Server    │
└─────────────┘                      └──────┬──────┘
                                            │
                                     ┌──────▼──────┐
                                     │ PostgreSQL  │
                                     │  Database   │
                                     └─────────────┘
```

- **Frontend**: Uses Connect-Web client for type-safe RPC calls
- **Backend**: Implements Connect handlers, uses sqlc for database access
- **Database**: Managed with golang-migrate migrations

---

## Next Steps After VM Snapshot

After creating a snapshot of this VM, you can:

1. **Clone this VM** for each developer or CI/CD runner
2. **Start development immediately** - all tools are pre-installed
3. **Run the full application**:
   ```bash
   docker compose up -d    # Start database
   cd backend && go run .  # Start backend
   cd frontend && npm run dev  # Start frontend
   ```
4. **Make changes** and Railway will auto-deploy on push to main

---

## Tool Versions Summary

| Category | Tool | Version | Status |
|----------|------|---------|--------|
| **Runtime** | Go | 1.22.2 | ✅ |
| **Runtime** | Node.js | 22.21.1 | ✅ |
| **Runtime** | npm | 10.9.4 | ✅ |
| **Frontend** | Next.js | 15.5.9 | ✅ |
| **Frontend** | React | 18.3.1 | ✅ |
| **Frontend** | TypeScript | 5.6.3 | ✅ |
| **Frontend** | Tailwind CSS | 3.4.15 | ✅ |
| **Backend** | sqlc | 1.30.0 | ✅ |
| **Backend** | protoc-gen-go | 1.36.11 | ✅ |
| **Backend** | protoc-gen-connect-go | latest | ✅ |
| **Codegen** | Buf CLI | 1.61.0 | ✅ |
| **Database** | PostgreSQL | 16.11 | ✅ |
| **Database** | golang-migrate | dev (v4) | ✅ |
| **Infrastructure** | Docker | 28.2.2 | ✅ |
| **Infrastructure** | Docker Compose v2 | 2.37.1 | ✅ |

---

## Persistent Data

PostgreSQL data is stored in a Docker volume named `workspace_postgres_data`. This ensures data persists even if the container is stopped or removed.

To completely remove all data:
```bash
docker compose down -v
```

---

## Health Monitoring

### PostgreSQL Health Check
- **Test Command**: `pg_isready -U postgres`
- **Interval**: 5 seconds
- **Timeout**: 5 seconds
- **Retries**: 5

Check health status:
```bash
docker ps  # Look for "(healthy)" in STATUS column
docker inspect cloutgg-postgres --format='{{.State.Health.Status}}'
```

---

## Support and Resources

- **README**: `/workspace/README.md` - Main project documentation
- **Makefile**: `/workspace/Makefile` - Build automation commands
- **Proto files**: `/workspace/proto/` - Protocol Buffer definitions
- **Migrations**: `/workspace/backend/db/migrations/` - Database schema migrations

---

**VM Setup Completed Successfully: December 16, 2025**

This development environment is production-ready and fully configured for CloutGG development. All dependencies are installed, code is generated, builds are verified, and the infrastructure is running properly.
