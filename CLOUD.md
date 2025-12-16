# Cloud VM Development Environment Setup Guide

This document describes the complete setup of the development environment for the CloutGG full-stack application. Use this as a reference for creating VM snapshots or setting up new development environments.

## Overview

CloutGG is a full-stack web application with:
- **Backend**: Go 1.22+ with Connect RPC
- **Frontend**: Next.js 15 (React 18) with TypeScript
- **Database**: PostgreSQL 16
- **Code Generation**: Buf (Protocol Buffers), sqlc (type-safe SQL)
- **Deployment**: Railway (auto-deploy on push to main)

## System Requirements

- Linux VM (tested on Ubuntu)
- 2GB+ RAM recommended
- 10GB+ disk space
- Internet connection for package downloads

## Installed Tools & Versions

### Core Runtime Environments

| Tool | Version | Installation Method | Location |
|------|---------|-------------------|----------|
| **Node.js** | v22.21.1 | NVM | `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/node` |
| **npm** | v10.9.4 | Bundled with Node.js | `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/npm` |
| **Go** | 1.22.2 | Pre-installed | `/usr/bin/go` |
| **Docker** | 29.1.3 | get-docker.sh script | `/usr/bin/docker` |
| **Docker Compose** | v5.0.0 | Docker plugin | Docker CLI plugin |

### Protocol Buffers & Code Generation

| Tool | Version | Purpose | Location |
|------|---------|---------|----------|
| **Buf CLI** | 1.61.0 | Protocol buffer tooling | `/usr/local/bin/buf` |
| **protoc** | libprotoc 3.21.12 | Protocol buffer compiler | `/usr/bin/protoc` |
| **protoc-gen-go** | v1.36.11 | Go protobuf plugin | `/home/ubuntu/go/bin/protoc-gen-go` |
| **protoc-gen-connect-go** | v1.19.1 | Connect RPC Go plugin | `/home/ubuntu/go/bin/protoc-gen-connect-go` |

### Database Tools

| Tool | Version | Purpose | Location |
|------|---------|---------|----------|
| **sqlc** | v1.30.0 | Type-safe SQL code generator | `/home/ubuntu/go/bin/sqlc` |
| **golang-migrate** | dev | Database migration tool | `/home/ubuntu/go/bin/migrate` |
| **PostgreSQL** | 16.11 (Alpine) | Database (containerized) | Docker container |

## Environment Configuration

### PATH Configuration

Go tools are installed to `/home/ubuntu/go/bin/` and automatically added to PATH via `~/.bashrc`:

```bash
export PATH="/home/ubuntu/go/bin:$PATH"
```

To ensure Go tools are available in your current session:
```bash
source ~/.bashrc
# or
export PATH="/home/ubuntu/go/bin:$PATH"
```

### Docker Configuration

**Storage Driver**: vfs (configured for nested container environments)
- Config file: `/etc/docker/daemon.json`
- Reason: Resolves overlayfs mount issues in nested virtualization

**User Permissions**: User added to `docker` group for non-root access

### Database Connection

PostgreSQL container configuration:
- **Container name**: `cloutgg-postgres`
- **Image**: `postgres:16-alpine`
- **Host port**: `5434` → Container port: `5432`
- **Database**: `cloutgg`
- **User**: `postgres`
- **Password**: `postgres`
- **Connection string**: `postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable`

## Quick Start Commands

### Initial Setup (Run Once)

```bash
# 1. Ensure PATH is set for Go tools
export PATH="/home/ubuntu/go/bin:$PATH"

# 2. Install dependencies
make install

# 3. Generate code (protobuf + sqlc)
make generate

# 4. Start PostgreSQL
docker compose up -d

# 5. Verify database is running
docker compose ps
```

### Development Workflow

```bash
# Start PostgreSQL
docker compose up -d

# Terminal 1: Backend
cd backend
go run .

# Terminal 2: Frontend
cd frontend
npm run dev

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8080
```

### Code Generation

```bash
# Generate all code (protobuf + sqlc)
make generate

# Or individually:
make generate-proto  # Generates Go & TypeScript from proto files
make generate-sqlc   # Generates Go code from SQL queries
```

### Testing

```bash
# Run all tests
make test

# Backend tests only
cd backend && go test ./... -v

# Frontend type checking
cd frontend && npx tsc --noEmit

# Build frontend
cd frontend && npm run build
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
# (will prompt for migration name)
```

## Frontend Setup Details

### Dependencies Installed
- **384 npm packages** installed successfully
- **Installation time**: ~23 seconds
- **No vulnerabilities** detected

### Key Frontend Packages
- Next.js 15.1.3
- React 18.3.1
- TypeScript 5.6.3
- Tailwind CSS 3.4.15
- Auth0 Next.js SDK 4.14.0
- Connect RPC libraries (@connectrpc/connect, @connectrpc/connect-web)
- Buf protobuf tools (@bufbuild/buf, protoc-gen plugins)

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Build Verification
✅ Frontend builds successfully with all 6 routes:
- `/` (homepage)
- `/company/[slug]` (dynamic company pages)
- `/leaderboard`
- `/vote`
- Plus middleware and error pages

## Backend Setup Details

### Go Dependencies
All dependencies from `go.mod` downloaded successfully:
- Connect RPC (connectrpc.com/connect v1.18.1)
- PostgreSQL driver (github.com/jackc/pgx/v5 v5.7.1)
- CORS middleware (github.com/rs/cors v1.11.1)
- Environment variables (github.com/joho/godotenv v1.5.1)
- Protocol Buffers (google.golang.org/protobuf v1.35.0)

### Build Verification
✅ Backend compiles successfully to a 17MB binary at `backend/backend`

### Generated Code Structure
```
backend/internal/gen/apiv1/
├── api.pb.go                    # Protocol buffer Go code
└── apiv1connect/
    └── api.connect.go           # Connect RPC server code
```

## Protocol Buffer Code Generation

### Generated Files

**Backend (Go)**:
- `/workspace/backend/internal/gen/apiv1/api.pb.go` (75KB)
- `/workspace/backend/internal/gen/apiv1/apiv1connect/api.connect.go` (28KB)

**Frontend (TypeScript/JavaScript)**:
- `/workspace/frontend/src/lib/gen/apiv1/api_pb.js` (14KB)
- `/workspace/frontend/src/lib/gen/apiv1/api_pb.d.ts` (25KB)
- `/workspace/frontend/src/lib/gen/apiv1/api_connect.js` (4KB)
- `/workspace/frontend/src/lib/gen/apiv1/api_connect.d.ts` (5KB)

### Buf Configuration

The project uses Buf Schema Registry (BSR) remote plugins:
- **Go**: protocolbuffers/go + connectrpc/go
- **TypeScript**: bufbuild/es + connectrpc/es

No local plugin installation required; all plugins are fetched remotely.

## Docker & Database Details

### Docker Installation
Installed via the provided `get-docker.sh` script with these components:
- docker-ce (Community Edition)
- docker-ce-cli
- containerd.io
- docker-compose-plugin
- docker-buildx-plugin
- docker-model-plugin

### Storage Driver Configuration
Due to nested container environment, using `vfs` storage driver:

```json
{
  "storage-driver": "vfs"
}
```

This resolves overlayfs mount failures in nested virtualization environments.

### PostgreSQL Container
- **Status**: Running and healthy
- **Health check**: `pg_isready -U postgres` every 5 seconds
- **Volume**: Named volume `postgres_data` for data persistence
- **Auto-migrations**: `/docker-entrypoint-initdb.d` mapped to `backend/migrations`

## Known Issues & Solutions

### Issue 1: Go Tools Not in PATH
**Symptom**: `sqlc: not found` or similar errors

**Solution**:
```bash
export PATH="/home/ubuntu/go/bin:$PATH"
# Or in new terminals:
source ~/.bashrc
```

### Issue 2: Docker Permission Denied
**Symptom**: `permission denied while trying to connect to Docker daemon`

**Solution**: User already added to docker group. Log out and back in, or:
```bash
newgrp docker
```

### Issue 3: Port 5434 Already in Use
**Symptom**: Cannot start PostgreSQL container

**Solution**:
```bash
# Check what's using the port
sudo lsof -i :5434
# Stop the container and restart
docker compose down
docker compose up -d
```

### Issue 4: Missing Generated Code
**Symptom**: Build errors about missing imports from `internal/gen` or `src/lib/gen`

**Solution**:
```bash
make generate
```

## Maintenance Commands

### Check System Status
```bash
# Check Docker
docker --version
docker compose version
docker compose ps

# Check tools
which node npm go buf sqlc migrate protoc
node --version && npm --version && go version

# Check Go tools (ensure PATH is set)
export PATH="/home/ubuntu/go/bin:$PATH"
which sqlc migrate protoc-gen-go protoc-gen-connect-go
```

### Clean Up
```bash
# Stop and remove containers
docker compose down -v

# Clean generated code
make clean

# Or manually:
rm -rf backend/internal/gen
rm -rf frontend/src/lib/gen
```

### Update Dependencies
```bash
# Frontend
cd frontend && npm update

# Backend
cd backend && go get -u ./...
go mod tidy

# Regenerate code
make generate
```

## Railway Deployment

This project auto-deploys to Railway on push to `main` branch:

1. **Push changes**: Git push automatically triggers Railway deployment
2. **Proto generation**: Railway builds automatically generate proto code (not committed to repo)
3. **Services**: Separate services for backend, frontend, and PostgreSQL

### Railway Configuration
- `railway.toml` in root directory
- `.railwayignore` files in backend/ and frontend/
- Each service has its own build configuration

### Environment Variables (Railway)
Set these in Railway dashboard:
```bash
# Backend
DATABASE_URL=<Railway PostgreSQL connection string>
PORT=8080

# Frontend
NEXT_PUBLIC_API_URL=<Backend Railway URL>
AUTH0_SECRET=<Auth0 secret>
AUTH0_BASE_URL=<Frontend Railway URL>
AUTH0_ISSUER_BASE_URL=<Auth0 domain>
AUTH0_CLIENT_ID=<Auth0 client ID>
AUTH0_CLIENT_SECRET=<Auth0 client secret>
```

## Development Tips

### 1. Watch for File Changes
The frontend auto-reloads on file changes. For backend, use a tool like `air`:
```bash
go install github.com/air-verse/air@latest
cd backend && air
```

### 2. Database Inspection
Connect to the PostgreSQL database:
```bash
docker exec -it cloutgg-postgres psql -U postgres -d cloutgg
```

### 3. View Logs
```bash
# Docker logs
docker compose logs -f db

# Backend logs (if running via go run)
# Shows in terminal

# Frontend logs
# Shows in terminal with npm run dev
```

### 4. Proto File Changes
After modifying `proto/apiv1/api.proto`:
```bash
make generate-proto  # Regenerate code
cd backend && go build  # Verify backend compiles
cd frontend && npm run build  # Verify frontend builds
```

### 5. Database Query Changes
After modifying `backend/internal/db/sqlc/queries.sql`:
```bash
cd backend && sqlc generate  # Regenerate Go code
go build  # Verify compilation
```

## Snapshot Checklist

Before taking a VM snapshot, ensure:

- [ ] All tools are installed and verified
- [ ] PATH includes `/home/ubuntu/go/bin` (check `~/.bashrc`)
- [ ] Docker daemon is running
- [ ] PostgreSQL container is running and healthy
- [ ] `make generate` completes successfully
- [ ] Backend compiles: `cd backend && go build`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] No uncommitted changes (optional)

## Summary

This VM is fully configured for CloutGG development with:

✅ **Runtime environments**: Node.js 22.21.1, Go 1.22.2  
✅ **Docker**: Version 29.1.3 with Compose v5.0.0  
✅ **Database**: PostgreSQL 16 container running on port 5434  
✅ **Code generation**: Buf 1.61.0, protoc 3.21.12, sqlc v1.30.0  
✅ **Go tools**: All required protoc plugins and migrate tool  
✅ **Dependencies**: All npm and Go packages installed  
✅ **Build verification**: Both frontend and backend build successfully  

The environment is ready for development, testing, and deployment to Railway.

---

**Last Updated**: December 16, 2025  
**VM Setup Time**: ~5-10 minutes (with parallel task execution)  
**Maintained by**: Automated setup scripts and Tasks
