# Cloud VM Environment Setup

This document describes the complete VM environment configuration for the CloutGG project, including all installed tools, setup procedures, and development workflows.

## Table of Contents

- [Pre-installed Tools](#pre-installed-tools)
- [Installed Development Tools](#installed-development-tools)
- [Environment Setup](#environment-setup)
- [Quick Start Commands](#quick-start-commands)
- [Service Details](#service-details)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Pre-installed Tools

The VM comes with the following tools pre-installed:

- **Go**: 1.22.2 linux/amd64
- **Node.js**: v22.21.1 (via nvm)
- **npm**: 10.9.4
- **Git**: Available for version control
- **Make**: Available for build automation

## Installed Development Tools

### Docker & Container Tools

**Docker Engine** - v29.1.3
- Location: `/usr/bin/docker`
- Components installed:
  - docker-ce (Docker Engine)
  - docker-ce-cli (Docker CLI)
  - containerd.io (Container runtime)
  - docker-buildx-plugin (v0.30.1)
- **Docker Compose**: v5.0.0 (plugin)
- **Storage Driver**: VFS (configured for VM environment)
- **Configuration**: `/etc/docker/daemon.json`
- **User Permissions**: `ubuntu` user added to `docker` group

**Important Docker Notes:**
- Docker daemon does not auto-start on VM boot
- Must be started manually using: `bash /workspace/start-docker.sh`
- VFS storage driver is required for this VM environment (overlay filesystem limitations)
- After snapshot restore, you may need to run `newgrp docker` or re-login for group permissions

### Backend Development Tools

**1. Buf CLI** - v1.47.2
- Location: `/home/ubuntu/bin/buf`
- Purpose: Protobuf code generation and management
- Installation: Downloaded from GitHub releases
- Usage: `buf generate proto` or `buf lint proto`

**2. sqlc** - v1.30.0
- Location: `/home/ubuntu/go/bin/sqlc`
- Purpose: Type-safe SQL code generation from queries
- Installation: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
- Usage: `cd backend && sqlc generate`

**3. protoc-gen-go** - v1.36.11
- Location: `/home/ubuntu/go/bin/protoc-gen-go`
- Purpose: Go protobuf plugin
- Installation: `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`

**4. protoc-gen-connect-go** - v1.19.1
- Location: `/home/ubuntu/go/bin/protoc-gen-connect-go`
- Purpose: Connect RPC plugin for Go
- Installation: `go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest`

**5. golang-migrate** - v4.19.1-dev
- Location: `/home/ubuntu/go/bin/migrate`
- Purpose: Database migrations (with PostgreSQL support)
- Installation: `go install` from GitHub
- Usage: `migrate -path db/migrations -database $DATABASE_URL up`

### Frontend Dependencies

**Package Count**: 383 packages installed
- **Security**: 0 vulnerabilities detected
- **Installation Status**: ✅ Complete

**Key Frameworks & Libraries:**
- **Next.js**: 15.5.9 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.6.3
- **Tailwind CSS**: 3.4.15
- **Auth0 Next.js SDK**: 4.14.0
- **Connect RPC**: @connectrpc/connect v2.1.1, @connectrpc/connect-web v2.1.1
- **Protobuf**: @bufbuild/protobuf v2.10.2

## Environment Setup

### PATH Configuration

The following paths are added to `~/.bashrc` for persistence:

```bash
export PATH="$HOME/bin:$HOME/go/bin:$PATH"
```

This ensures:
- `~/bin` (for buf) is in PATH
- `~/go/bin` (for Go-installed tools: sqlc, protoc-gen-go, protoc-gen-connect-go, migrate) is in PATH
- Changes persist across shell sessions

**To activate PATH in current session:**
```bash
source ~/.bashrc
```

### Docker Configuration

Docker is configured with the VFS storage driver via `/etc/docker/daemon.json`:

```json
{
  "storage-driver": "vfs"
}
```

**Starting Docker:**
```bash
bash /workspace/start-docker.sh
```

The script will:
- Check if Docker is already running
- Start Docker daemon with proper configuration
- Wait for Docker to be ready
- Report status

**Docker Group Membership:**
- The `ubuntu` user has been added to the `docker` group
- After VM snapshot restore, activate with: `newgrp docker` or re-login
- Or use `sudo docker` commands until group membership is active

## Quick Start Commands

### Complete First-Time Setup

Run this after creating a new VM from snapshot or cloning the repository:

```bash
# 1. Start Docker daemon
cd /workspace
bash start-docker.sh

# 2. Install dependencies
make install

# 3. Generate code (protobuf + sqlc)
make generate
```

### Daily Development Startup

Start each service in a separate terminal:

**Terminal 1 - Start Docker (if not running):**
```bash
cd /workspace
bash start-docker.sh
```

**Terminal 2 - Start PostgreSQL:**
```bash
cd /workspace
sudo docker compose up -d
# Or without sudo if group membership is active:
docker compose up -d
```

**Terminal 3 - Start Backend:**
```bash
cd /workspace/backend
go run .
```

**Terminal 4 - Start Frontend:**
```bash
cd /workspace/frontend
npm run dev
```

### Makefile Commands

The project includes a Makefile for common tasks:

```bash
make install          # Install all dependencies (Go modules + npm packages)
make generate         # Generate all code (protobuf + sqlc)
make generate-proto   # Generate protobuf code only
make generate-sqlc    # Generate sqlc code only
make db              # Start PostgreSQL container
make backend         # Run Go backend
make frontend        # Run Next.js frontend
make dev             # Start all services (db, backend, frontend)
make test            # Run all tests
make test-backend    # Run backend tests
make test-frontend   # Run frontend type checking
make lint-proto      # Lint proto files
make clean           # Stop containers and clean generated code
```

## Service Details

### PostgreSQL Container

- **Container Name**: `cloutgg-postgres`
- **Image**: `postgres:16-alpine`
- **Status**: Running and healthy
- **Port Mapping**: `5434:5432` (host:container)
- **Volume**: `workspace_postgres_data` (persists data across restarts)
- **Health Check**: `pg_isready -U postgres` every 5 seconds

**Connection Details:**
```
Host: localhost
Port: 5434
Database: cloutgg
Username: postgres
Password: postgres
```

**Connection String:**
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
```

**Direct psql Access:**
```bash
sudo docker exec -it cloutgg-postgres psql -U postgres -d cloutgg
```

**Check Container Status:**
```bash
sudo docker ps
sudo docker compose logs db
```

### Backend Service

- **Port**: 8080
- **Framework**: Go 1.22 with Connect RPC
- **Protocol**: Connect RPC (supports gRPC, gRPC-Web, and Connect protocols)
- **Database Driver**: pgx v5 (PostgreSQL driver)
- **Generated Code**: `backend/internal/gen/apiv1/` (not committed to git)
- **URL**: http://localhost:8080

**Starting the Backend:**
```bash
cd /workspace/backend
go run .
```

**Building the Backend:**
```bash
cd /workspace/backend
go build -o cloutgg-backend .
```

**Environment Variables:**
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
PORT=8080
```

### Frontend Service

- **Port**: 3000
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **API Client**: Connect RPC (@connectrpc/connect-web)
- **Authentication**: Auth0 (@auth0/nextjs-auth0)
- **Generated Code**: `frontend/src/lib/gen/apiv1/` (not committed to git)
- **URL**: http://localhost:3000

**Starting the Frontend:**
```bash
cd /workspace/frontend
npm run dev
```

**Building the Frontend:**
```bash
cd /workspace/frontend
npm run build
```

**Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
# Auth0 credentials (add as needed)
```

## Development Workflow

### After VM Startup

1. **Start Docker daemon:**
   ```bash
   cd /workspace
   bash start-docker.sh
   ```

2. **Start PostgreSQL:**
   ```bash
   docker compose up -d
   ```

3. **Generate code (if needed):**
   ```bash
   make generate
   ```

4. **Start backend:**
   ```bash
   cd backend && go run .
   ```

5. **Start frontend:**
   ```bash
   cd frontend && npm run dev
   ```

### Code Generation

Generated code is **not committed** to git (intentionally in `.gitignore`):

- `backend/internal/gen/` - Go protobuf and Connect RPC code
- `frontend/src/lib/gen/` - TypeScript protobuf and Connect RPC client code
- `backend/internal/db/sqlc/` - Type-safe SQL query code (this IS committed)

**When to regenerate code:**

1. **After cloning the repository** (first time)
2. **After modifying proto files** (`proto/apiv1/api.proto`)
3. **After changing SQL queries** (`backend/internal/db/sqlc/queries.sql`)
4. **After pulling changes** that affect proto or SQL files

**Generate all code:**
```bash
make generate
```

**Generate protobuf code only:**
```bash
make generate-proto
# Or manually:
buf generate proto
```

**Generate sqlc code only:**
```bash
make generate-sqlc
# Or manually:
cd backend && sqlc generate
```

### Database Migrations

Migrations are located in `backend/db/migrations/` and use golang-migrate format.

**Files:**
- `000001_init.up.sql` / `000001_init.down.sql` - Initial schema
- `000002_add_user_id_to_votes.up.sql` / `000002_add_user_id_to_votes.down.sql` - Add user_id column
- `000003_seed_companies.up.sql` / `000003_seed_companies.down.sql` - Seed company data

**Automatic Migration:**
The PostgreSQL container automatically runs migrations on first startup via the `docker-entrypoint-initdb.d` volume mount.

**Manual Migration:**
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up    # Apply all pending migrations
make migrate-down  # Rollback last migration
```

**Create New Migration:**
```bash
make migrate-create
# Enter migration name when prompted
```

## Testing

### Run All Tests

```bash
make test
```

### Backend Tests

```bash
cd /workspace/backend
go test ./... -v
```

### Frontend Type Checking

```bash
cd /workspace/frontend
npx tsc --noEmit
```

### Frontend Linting

```bash
cd /workspace/frontend
npm run lint
```

### Proto Linting

```bash
make lint-proto
# Or manually:
buf lint proto
```

## Troubleshooting

### Docker Issues

**Problem: Docker daemon not running**
```bash
# Solution: Start Docker
bash /workspace/start-docker.sh
```

**Problem: Permission denied when running docker commands**
```bash
# Solution 1: Activate docker group membership
newgrp docker

# Solution 2: Use sudo
sudo docker ps

# Solution 3: Re-login to shell
exit
# Then log back in
```

**Problem: Port 5434 already in use**
```bash
# Check what's using the port
sudo lsof -i :5434

# Stop the PostgreSQL container
sudo docker compose down

# Or change the port in docker-compose.yml
```

**Problem: Container won't start**
```bash
# Check container logs
sudo docker compose logs db

# Check Docker daemon logs
sudo journalctl -u docker.service -n 50
```

**Problem: Docker daemon fails to start**
```bash
# Check if another instance is running
ps aux | grep dockerd

# Check /etc/docker/daemon.json is valid JSON
cat /etc/docker/daemon.json | jq .

# Try starting manually
sudo dockerd --storage-driver=vfs > /tmp/docker.log 2>&1 &
```

### Code Generation Issues

**Problem: buf command not found**
```bash
# Solution: Ensure ~/bin is in PATH
source ~/.bashrc
echo $PATH | grep "$HOME/bin"

# Or run directly
~/bin/buf --version
```

**Problem: sqlc command not found**
```bash
# Solution: Ensure ~/go/bin is in PATH
source ~/.bashrc
echo $PATH | grep "$HOME/go/bin"

# Or run directly
~/go/bin/sqlc version
```

**Problem: protoc-gen-go not found during buf generate**
```bash
# Solution: Ensure Go bin directory is in PATH
export PATH="$HOME/go/bin:$PATH"
source ~/.bashrc

# Verify installation
which protoc-gen-go
protoc-gen-go --version
```

**Problem: Proto generation fails with dependency errors**
```bash
# Solution: Update buf dependencies
buf dep update proto
buf generate proto
```

### Backend Issues

**Problem: Database connection failed**
```bash
# Check if PostgreSQL is running
sudo docker ps | grep postgres

# Check PostgreSQL logs
sudo docker compose logs db

# Test connection manually
sudo docker exec -it cloutgg-postgres psql -U postgres -d cloutgg
```

**Problem: Port 8080 already in use**
```bash
# Check what's using the port
sudo lsof -i :8080

# Kill the process or use a different port
export PORT=8081
cd backend && go run .
```

**Problem: Generated Go code missing**
```bash
# Solution: Generate protobuf code
buf generate proto

# Verify files were created
ls -la backend/internal/gen/apiv1/
```

### Frontend Issues

**Problem: npm install fails**
```bash
# Check Node.js version (requires 20+)
node --version

# Clear npm cache
npm cache clean --force

# Try installing again
cd frontend && npm install
```

**Problem: Build fails with "Cannot find module"**
```bash
# Solution: Generate protobuf code
buf generate proto

# Verify files were created
ls -la frontend/src/lib/gen/apiv1/

# Or run prebuild script
cd frontend && npm run prebuild
```

**Problem: Dev server won't start**
```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Check for TypeScript errors
cd frontend && npx tsc --noEmit

# Try clearing Next.js cache
rm -rf frontend/.next
cd frontend && npm run dev
```

## Architecture Overview

```
┌──────────────────┐
│   Next.js        │     Connect RPC        ┌──────────────────┐
│   Frontend       │ ◄─────────────────────►│   Go Backend     │
│   Port 3000      │   (HTTP/2, JSON)       │   Port 8080      │
└──────────────────┘                        └────────┬─────────┘
                                                     │
                                                     │ pgx (v5)
                                                     │
                                            ┌────────▼─────────┐
                                            │   PostgreSQL     │
                                            │   Port 5434      │
                                            │   (Container)    │
                                            └──────────────────┘
```

**Data Flow:**
1. Frontend makes type-safe RPC calls using Connect client
2. Backend handles requests via Connect RPC handlers
3. Backend queries database using sqlc-generated type-safe queries
4. Results flow back through the stack to the frontend

**Code Generation Flow:**
```
proto/apiv1/api.proto
       │
       ├─► buf generate ─► backend/internal/gen/ (Go)
       │                   - api.pb.go (protobuf types)
       │                   - api.connect.go (RPC handlers)
       │
       └─► buf generate ─► frontend/src/lib/gen/ (TypeScript)
                           - api_pb.ts (protobuf types)
                           - api_connect.ts (RPC client)

backend/internal/db/sqlc/queries.sql
       │
       └─► sqlc generate ─► backend/internal/db/sqlc/ (Go)
                            - queries.sql.go (type-safe queries)
                            - models.go (database types)
```

## Project Structure

```
/workspace
├── proto/                      # Protocol Buffer definitions
│   └── apiv1/
│       └── api.proto           # RPC service and message definitions
├── backend/                    # Go API server
│   ├── internal/
│   │   ├── gen/                # Generated protobuf code (not committed)
│   │   │   └── apiv1/
│   │   ├── db/
│   │   │   └── sqlc/           # Generated sqlc code (committed)
│   │   └── service/            # RPC service implementations
│   ├── db/
│   │   └── migrations/         # SQL migrations
│   ├── buf.gen.yaml            # Backend buf config
│   ├── sqlc.yaml               # sqlc config
│   ├── go.mod
│   └── main.go
├── frontend/                   # Next.js app
│   ├── src/
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   └── lib/
│   │       ├── gen/            # Generated protobuf code (not committed)
│   │       │   └── apiv1/
│   │       └── api.ts          # API client setup
│   ├── buf.gen.yaml            # Frontend buf config
│   ├── package.json
│   └── ...
├── buf.yaml                    # Buf workspace config
├── buf.gen.yaml                # Root buf generation config
├── docker-compose.yml          # PostgreSQL container
├── Makefile                    # Build automation
├── start-docker.sh             # Docker startup script
└── CLOUD.md                    # This file
```

## Deployment (Railway)

This project is configured for deployment on Railway with automatic code generation:

- **Backend**: Deploys from `/workspace/backend`
- **Frontend**: Deploys from `/workspace/frontend`
- **Database**: PostgreSQL service on Railway

**Railway Configuration:**
- Proto code is automatically generated during builds
- Each service has its own `buf.gen.yaml` for generating only needed code
- See `railway.toml` for deployment configuration

**After code changes:**
```bash
git add .
git commit -m "Your changes"
git push origin main
# Railway will auto-deploy
```

## Summary

This VM is fully configured with:

- ✅ **Docker**: v29.1.3 with VFS storage driver
- ✅ **Go**: 1.22.2 with all required tools
- ✅ **Node.js**: v22.21.1 with 383 packages
- ✅ **Buf CLI**: v1.47.2 for protobuf generation
- ✅ **sqlc**: v1.30.0 for SQL code generation
- ✅ **PostgreSQL**: Running in container on port 5434
- ✅ **Code Generation**: All protobuf and sqlc code generated
- ✅ **Backend**: Compiles and runs successfully
- ✅ **Frontend**: Builds and runs successfully

**The VM is ready for CloutGG development!** 🚀

---

**Last Updated**: December 16, 2025  
**Setup Status**: ✅ Complete and Ready for Snapshot
