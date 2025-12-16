# Cloud VM Environment Setup Guide

This document provides a comprehensive guide for setting up the development environment for the CloutGG application in a cloud VM or similar environment.

## Overview

CloutGG is a full-stack web application with:
- **Backend**: Go 1.23+ with Connect RPC
- **Frontend**: Next.js 15 with TypeScript
- **Database**: PostgreSQL 16 via Docker
- **Code Generation**: Buf CLI for protobuf, sqlc for database queries
- **Migrations**: golang-migrate for database schema management

## Prerequisites Installed

The following tools have been installed and verified in this VM environment:

### 1. Go Backend Environment

| Tool | Version | Path | Purpose |
|------|---------|------|---------|
| Go | 1.23.4 | `/usr/local/go/bin/go` | Backend runtime |
| sqlc | 1.30.0 | `/home/ubuntu/go/bin/sqlc` | Type-safe SQL code generation |
| protoc-gen-go | 1.36.11 | `/home/ubuntu/go/bin/protoc-gen-go` | Go protobuf plugin |
| protoc-gen-connect-go | 1.19.1 | `/home/ubuntu/go/bin/protoc-gen-connect-go` | Connect RPC Go plugin |

**Installation Method:**
- Go: Downloaded and installed from official golang.org releases
- Tools: Installed via `go install` command
- Go modules: Downloaded via `go mod download` in `/workspace/backend`

### 2. Node.js Frontend Environment

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22.21.1 | JavaScript runtime for Next.js |
| npm | 10.9.4 | Package manager |
| Next.js | 15.5.9 | React framework (installed via npm) |
| TypeScript | 5.6.3 | Type checking (installed via npm) |

**Installation Method:**
- Node.js and npm were pre-installed on the VM
- Frontend dependencies installed via `npm install` in `/workspace/frontend`
- Total packages installed: 383 packages with 0 vulnerabilities

### 3. Docker & Database Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Engine | 29.1.3 | Container runtime |
| Docker Compose | 5.0.0 | Multi-container orchestration |
| golang-migrate | 4.19.1 | Database migration tool |

**Installation Method:**
- Docker: Installed via official get-docker.sh script
- golang-migrate: Installed from GitHub releases to `/usr/local/bin/migrate`

**⚠️ Critical Docker Configuration:**

Due to overlay filesystem limitations in the VM environment, Docker has been configured to use the **VFS storage driver** instead of the default overlayfs. This is required for Docker to function properly.

**Configuration:**
```bash
# Docker must be started with the vfs storage driver
sudo dockerd --storage-driver=vfs &
```

The `/workspace/start-docker.sh` script has been used, but may need modification to include the `--storage-driver=vfs` flag for persistent configuration.

### 4. Buf CLI

| Tool | Version | Purpose |
|------|---------|---------|
| Buf | 1.61.0 | Protobuf code generation and linting |

**Installation Method:**
- Downloaded binary from official GitHub releases
- Installed to `/usr/local/bin/buf`

## Environment Variables

The following environment variables are required for development:

```bash
# Database Connection (used by backend and migrations)
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"

# Backend Server Port
export PORT=8080

# Frontend API Endpoint
export NEXT_PUBLIC_API_URL="http://localhost:8080"

# Go Binary Path (required for tools)
export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"
```

## Development Workflow

### 1. Start Docker Daemon

```bash
# Start Docker with VFS storage driver (required for this VM)
sudo dockerd --storage-driver=vfs > /tmp/dockerd.log 2>&1 &

# Wait for Docker to be ready
sleep 5
sudo docker ps
```

### 2. Generate Code

Generated code is **not committed** to the repository. You must generate it after cloning or when proto files change:

```bash
cd /workspace
make generate
```

This generates:
- Go server code in `backend/internal/gen/`
- TypeScript client code in `frontend/src/lib/gen/`
- sqlc database code in `backend/internal/db/sqlc/`

### 3. Start Database

```bash
cd /workspace
sudo docker compose up -d

# Verify database is running
sudo docker ps
sudo docker logs cloutgg-postgres
```

The database runs on port **5434** (mapped from container port 5432).

### 4. Run Migrations

```bash
cd /workspace
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up
```

Migrations are located in `backend/db/migrations/` and include:
- Initial schema creation
- User ID tracking for votes
- Seed data for companies

### 5. Start Backend Server

```bash
cd /workspace/backend
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
export PORT=8080
go run .
```

The backend serves Connect RPC at:
- Main endpoint: `http://localhost:8080`
- Service: `http://localhost:8080/apiv1.RankingsService/`

**Health Check:**
```bash
curl -X POST http://localhost:8080/apiv1.RankingsService/HealthCheck \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response: `{"status":"healthy", "database":"connected"}`

### 6. Start Frontend Development Server

```bash
cd /workspace/frontend
npm run dev
```

The frontend runs on `http://localhost:3000`

## Quick Start Commands

Use the Makefile for common operations:

```bash
# Install all dependencies (requires sudo for some operations)
make install

# Generate all code (proto + sqlc)
make generate

# Start database
make db  # or: sudo docker compose up -d

# Start backend (in separate terminal)
make backend

# Start frontend (in separate terminal)
make frontend

# Run tests
make test

# Run migrations
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up

# Create new migration
make migrate-create

# Lint proto files
make lint-proto

# Clean up (stops containers, removes generated code)
make clean
```

## Verification Steps

To verify the environment is set up correctly:

1. **Check Go tools:**
   ```bash
   go version                    # Should show 1.23.4 or later
   sqlc version                  # Should show v1.30.0
   protoc-gen-go --version       # Should show v1.36.11
   protoc-gen-connect-go --version  # Should show 1.19.1
   ```

2. **Check Node.js tools:**
   ```bash
   node --version                # Should show v22.21.1 or later
   npm --version                 # Should show 10.9.4 or later
   npx next --version            # Should show Next.js version
   ```

3. **Check Docker:**
   ```bash
   sudo docker --version         # Should show 29.1.3
   sudo docker compose version   # Should show v5.0.0
   sudo docker ps                # Should list running containers
   ```

4. **Check Buf:**
   ```bash
   buf --version                 # Should show 1.61.0
   buf lint proto                # Should lint proto files
   ```

5. **Check migrations tool:**
   ```bash
   migrate -version              # Should show 4.19.1
   ```

6. **Test code generation:**
   ```bash
   cd /workspace
   make generate
   # Check generated files exist:
   ls backend/internal/gen/apiv1/
   ls frontend/src/lib/gen/apiv1/
   ```

7. **Test database:**
   ```bash
   sudo docker compose up -d
   sleep 5
   export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
   make migrate-up
   ```

8. **Test backend:**
   ```bash
   cd /workspace/backend
   export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
   go run . &
   sleep 3
   curl -X POST http://localhost:8080/apiv1.RankingsService/HealthCheck \
     -H "Content-Type: application/json" -d '{}'
   # Should return: {"status":"healthy", "database":"connected"}
   ```

9. **Test frontend build:**
   ```bash
   cd /workspace/frontend
   npm run build
   # Should complete without errors
   ```

## Known Issues & Workarounds

### Docker Overlay Filesystem Issue

**Problem:** Docker fails with overlay filesystem errors in this VM environment:
```
failed to mount /tmp/containerd-mount: ... overlay, ... invalid argument
```

**Solution:** Use VFS storage driver instead of overlayfs:
```bash
sudo dockerd --storage-driver=vfs &
```

**Note:** VFS is slower than overlayfs but more compatible with various VM environments. This is a known limitation of some cloud VM configurations.

### Docker Permission Issues

If you encounter permission denied errors when running `docker` commands:

```bash
# Always use sudo for Docker commands in this environment
sudo docker ps
sudo docker compose up -d
```

Alternatively, add your user to the docker group (requires re-login):
```bash
sudo usermod -aG docker $USER
# Then log out and log back in
```

## Port Configuration

The following ports are used by default:

| Service | Port | Notes |
|---------|------|-------|
| PostgreSQL | 5434 | Mapped from container port 5432 |
| Go Backend | 8080 | Connect RPC server |
| Next.js Frontend | 3000 | Development server |

**Note:** The database uses port 5434 (not 5432) to avoid conflicts with any existing PostgreSQL installations.

## Railway Deployment

This repository is configured for automatic deployment on Railway:

1. **Database:** Railway provides a managed PostgreSQL instance
2. **Backend:** Deployed from `/workspace/backend` directory
3. **Frontend:** Deployed from `/workspace/frontend` directory

**Important:** 
- Proto code is automatically generated during Railway builds
- Each service has its own `buf.gen.yaml` for service-specific code generation
- Environment variables must be configured in Railway dashboard

## File Structure

```
/workspace/
├── proto/                    # Protocol Buffer definitions
│   ├── apiv1/
│   │   └── api.proto        # RPC service definitions
│   └── buf.yaml             # Buf configuration
├── backend/
│   ├── internal/
│   │   ├── gen/             # Generated Connect code (not committed)
│   │   ├── db/
│   │   │   └── sqlc/        # Generated sqlc code
│   │   └── service/         # Service implementations
│   ├── db/
│   │   └── migrations/      # SQL migrations
│   ├── go.mod
│   ├── main.go
│   └── buf.gen.yaml         # Backend-specific Buf config
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # React components
│   │   └── lib/
│   │       ├── gen/         # Generated TypeScript code (not committed)
│   │       ├── api.ts       # API client
│   │       └── auth0.ts     # Auth0 configuration
│   ├── package.json
│   └── buf.gen.yaml         # Frontend-specific Buf config
├── docker-compose.yml       # PostgreSQL container config
├── Makefile                 # Build automation
├── buf.gen.yaml             # Root Buf config (for local dev)
└── README.md
```

## Troubleshooting

### "Command not found" for Go tools

Ensure the Go binary path is in your PATH:
```bash
export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"
# Add to ~/.bashrc for persistence:
echo 'export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"' >> ~/.bashrc
```

### Database connection refused

1. Check Docker is running: `sudo docker ps`
2. Check database is running: `sudo docker logs cloutgg-postgres`
3. Verify port is correct: 5434 (not 5432)
4. Check DATABASE_URL is correct

### Code generation fails

1. Ensure buf is installed: `buf --version`
2. Ensure Go tools are installed: `protoc-gen-go --version`
3. Check proto files are valid: `buf lint proto`
4. Try: `make clean && make generate`

### Frontend build fails

1. Ensure Node.js is correct version: `node --version` (should be 20+)
2. Reinstall dependencies: `cd frontend && rm -rf node_modules && npm install`
3. Regenerate proto code: `make generate`
4. Check for TypeScript errors: `npm run lint`

## Summary

This VM environment is fully configured for CloutGG development with all required tools installed and verified:

✅ Go 1.23.4 with all required plugins  
✅ Node.js 22.21.1 with npm 10.9.4  
✅ Docker 29.1.3 with VFS storage driver  
✅ Docker Compose 5.0.0  
✅ Buf CLI 1.61.0  
✅ sqlc 1.30.0  
✅ golang-migrate 4.19.1  
✅ All frontend dependencies (383 packages)  
✅ Code generation working  
✅ Database migrations working  
✅ Backend server verified  
✅ Frontend build verified  

The environment is ready for development. Remember to start Docker with the VFS storage driver before beginning work.
