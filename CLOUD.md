# VM Environment Setup Summary

This document describes the complete VM environment setup for the CloutGG project, including all installed tools, configurations, and commands needed to work with this repository.

## Project Overview

CloutGG is a full-stack web application with:
- **Backend**: Go 1.22+ with Connect RPC and PostgreSQL
- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Database**: PostgreSQL 16
- **RPC Protocol**: Connect RPC (type-safe API communication)
- **Code Generation**: Buf (protobuf), sqlc (database queries)

## Pre-installed Tools

The VM came with the following tools already installed:

- **Go**: v1.22.2
- **Node.js**: v22.21.1
- **npm**: v10.9.4
- **Git**: Pre-installed

## Installed Dependencies

### 1. Docker (v29.1.3)

**Installation Method**: Official Docker installation script from docker.com

**What was installed**:
- Docker Engine v29.1.3
- containerd.io v2.2.0
- Docker Buildx Plugin v0.30.1
- Docker Compose Plugin v5.0.0

**Configuration**:
- Storage driver: VFS (configured in `/etc/docker/daemon.json`)
- User permissions: `ubuntu` user added to `docker` group
- Startup script: `/workspace/start-docker.sh` created for manual daemon start

**Usage**:
```bash
# Start Docker daemon (if not running)
sudo /workspace/start-docker.sh

# Use Docker commands with sudo
sudo docker ps
sudo docker compose up -d

# Or use without sudo after:
newgrp docker
```

**Note**: This VM doesn't use systemd, so Docker must be started manually using the script.

### 2. Buf CLI (v1.61.0)

**Installation Method**: Direct download from GitHub releases

**Purpose**: Protobuf code generation and management

**Location**: `/usr/local/bin/buf`

**Usage**:
```bash
buf --version
buf generate proto
buf lint proto
```

### 3. sqlc (v1.30.0)

**Installation Method**: Installed via `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`

**Purpose**: Type-safe Go code generation from SQL queries

**Location**: `~/go/bin/sqlc`

**Usage**:
```bash
cd backend
sqlc generate
```

### 4. protoc-gen-go (v1.36.11)

**Installation Method**: Installed via `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`

**Purpose**: Go protobuf code generation plugin

**Location**: `~/go/bin/protoc-gen-go`

### 5. Connect-RPC Plugins

**Installation Method**: Remote plugins automatically downloaded by Buf

**Plugins**:
- `buf.build/protocolbuffers/go` - Go protobuf plugin
- `buf.build/connectrpc/go` - Connect-Go service code plugin

**Note**: These are remote plugins specified in `buf.gen.yaml` files and don't require local installation.

### 6. Frontend Dependencies

**Installation Method**: `npm install` in `/workspace/frontend`

**Status**: 383 packages installed successfully with 0 vulnerabilities

**Note**: Minor deprecation warning for `@bufbuild/protoc-gen-connect-es@0.13.0` - functionality not affected.

## Environment Configuration

### PATH Configuration

The Go binary directory was added to PATH for all tools:

```bash
export PATH=$PATH:~/go/bin
```

This was added to `~/.bashrc` for persistence.

### Docker Configuration

Created `/etc/docker/daemon.json`:
```json
{
  "storage-driver": "vfs"
}
```

## Code Generation

All code generation has been completed and verified:

### Protobuf Code Generation
```bash
make generate-proto
```

**Generated files**:
- Backend: `backend/internal/gen/apiv1/api.pb.go` (protobuf types)
- Backend: `backend/internal/gen/apiv1/apiv1connect/api.connect.go` (Connect service)
- Frontend: `frontend/src/lib/gen/apiv1/api_pb.js` + `.d.ts` (TypeScript types)
- Frontend: `frontend/src/lib/gen/apiv1/api_connect.js` + `.d.ts` (Connect client)

### Database Code Generation
```bash
make generate-sqlc
```

**Generated files**:
- `backend/internal/db/sqlc/db.go`
- `backend/internal/db/sqlc/models.go`
- `backend/internal/db/sqlc/querier.go`
- `backend/internal/db/sqlc/queries.sql.go`

## Build Verification

### Backend Build
```bash
cd backend
go build .
```
✅ **Status**: SUCCESS

### Frontend Build
```bash
cd frontend
npm run build
```
✅ **Status**: SUCCESS (with minor warnings, which are normal)

## Database Setup

PostgreSQL 16 is running in a Docker container:

```bash
# Start database
sudo docker compose up -d

# Check status
sudo docker compose ps

# Access database
sudo docker exec -it cloutgg-postgres psql -U postgres -d cloutgg
```

**Connection Details**:
- Host: localhost
- Port: 5434 (mapped from container's 5432)
- Database: cloutgg
- User: postgres
- Password: postgres

**Database URL**:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
```

## Quick Start Commands

### One-Time Setup
```bash
# Ensure Docker is running
sudo /workspace/start-docker.sh

# Install all dependencies
make install

# Generate all code
make generate

# Start PostgreSQL
sudo docker compose up -d
```

### Development Workflow

**Terminal 1 - Database**:
```bash
sudo docker compose up
```

**Terminal 2 - Backend**:
```bash
cd backend
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
go run .
```

**Terminal 3 - Frontend**:
```bash
cd frontend
npm run dev
```

### Useful Commands

```bash
# Install dependencies
make install

# Generate all code (proto + sqlc)
make generate

# Run tests
make test

# Clean generated code and containers
make clean

# Lint proto files
make lint-proto

# Build backend
cd backend && go build

# Build frontend
cd frontend && npm run build
```

## Makefile Targets

The project includes a comprehensive Makefile with the following targets:

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies (Go, npm, tools) |
| `make generate` | Generate all code (proto + sqlc) |
| `make generate-proto` | Generate protobuf code only |
| `make generate-sqlc` | Generate sqlc database code only |
| `make install-tools` | Install development tools (sqlc, protoc-gen-go) |
| `make dev` | Start all services (db, backend, frontend) |
| `make db` | Start PostgreSQL container |
| `make backend` | Run Go backend |
| `make frontend` | Run Next.js frontend |
| `make test` | Run all tests |
| `make test-backend` | Run backend tests |
| `make test-frontend` | Run frontend type checking |
| `make clean` | Clean up containers and generated code |
| `make lint-proto` | Lint proto files |
| `make format-proto` | Format proto files |

## Known Issues & Warnings

### 1. Docker Permission
- Docker requires `sudo` to run commands
- Alternative: Use `newgrp docker` to run commands without sudo in that session

### 2. Frontend Deprecation Warning
- `@bufbuild/protoc-gen-connect-es@0.13.0` is deprecated
- Migration tool available: `npx @connectrpc/connect-migrate@latest`
- This doesn't affect functionality

### 3. Docker Storage Driver
- Using VFS storage driver instead of overlay2
- This was necessary for VM compatibility
- Slightly slower but fully functional

### 4. Manual Docker Startup
- Docker daemon must be started manually with `/workspace/start-docker.sh`
- This is because the VM doesn't use systemd

## Environment Variables

The project uses the following environment variables:

### Backend
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
PORT=8080
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Auth0 (Optional - for authentication features)
```bash
AUTH0_SECRET=<your-secret>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=<your-auth0-domain>
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
```

## Railway Deployment

This project is configured for Railway deployment:

- Backend and frontend have separate `nixpacks.toml` files
- Proto code is automatically generated during builds
- Database migrations run automatically on backend startup
- See `railway.toml` for deployment configuration

## File Structure

```
/workspace/
├── proto/                     # Protocol Buffer definitions
│   └── apiv1/api.proto
├── backend/                   # Go backend
│   ├── internal/
│   │   ├── gen/              # Generated proto code
│   │   ├── db/sqlc/          # Generated sqlc code
│   │   └── service/          # Service implementations
│   ├── db/migrations/        # Database migrations
│   └── main.go
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   └── lib/
│   │       └── gen/          # Generated proto code
│   └── package.json
├── docker-compose.yml         # PostgreSQL container
├── Makefile                   # Build automation
└── start-docker.sh           # Docker daemon startup script
```

## Verification Checklist

All the following have been verified as working:

- ✅ Go 1.22.2 installed and working
- ✅ Node.js 22.21.1 installed and working
- ✅ Docker 29.1.3 installed and working
- ✅ Buf CLI 1.61.0 installed and working
- ✅ sqlc 1.30.0 installed and working
- ✅ protoc-gen-go 1.36.11 installed and working
- ✅ Frontend dependencies installed (383 packages)
- ✅ Protobuf code generation working
- ✅ sqlc code generation working
- ✅ Backend builds successfully
- ✅ Frontend builds successfully
- ✅ PostgreSQL container running
- ✅ All tools accessible via PATH

## Next Steps

After taking a snapshot of this VM, you can:

1. Clone your repository
2. Run `make install` to install dependencies
3. Run `make generate` to generate code
4. Run `make dev` to start all services
5. Access the app at http://localhost:3000

The VM is now fully configured and ready for development! 🚀
