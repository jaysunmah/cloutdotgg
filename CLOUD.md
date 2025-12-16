# Cloud VM Environment Setup

This document describes the complete VM environment setup for the CloutGG application repository.

## Overview

This repository is a full-stack application consisting of:
- **Frontend**: Next.js 15 with TypeScript, React 18, and TailwindCSS
- **Backend**: Go 1.22 with PostgreSQL database
- **Infrastructure**: Docker Compose for local development
- **Code Generation**: Buf CLI for Protocol Buffers, sqlc for database queries

## Installed Software

### Core Runtime Environments

#### Go
- **Version**: 1.22.2 linux/amd64
- **Installation**: Pre-installed on VM
- **Location**: `/usr/local/go`
- **GOPATH**: `/home/ubuntu/go`

**Go Tools Installed**:
- `protoc-gen-go` v1.36.11 - Protobuf code generator for Go
- `sqlc` v1.30.0 - Type-safe code generator from SQL

**Installation command** (if needed):
```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

#### Node.js
- **Version**: v22.21.1 (LTS)
- **npm Version**: v10.9.4
- **Installation**: Pre-installed on VM
- **Package Manager**: npm

**Frontend Dependencies**: 383 packages installed via `npm install`

### Infrastructure Tools

#### Docker
- **Version**: 29.1.3, build f52814d
- **Installation Method**: Official Docker repository (apt)
- **Storage Driver**: vfs (configured for VM compatibility)
- **Daemon Status**: Running

**Installation commands** (if needed):
```bash
# Add Docker's official GPG key and repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

**Docker Daemon Configuration**:
The daemon uses the `vfs` storage driver due to overlay filesystem compatibility issues in the VM environment. This is configured in `/etc/docker/daemon.json`:
```json
{
  "storage-driver": "vfs"
}
```

#### Docker Compose
- **Version**: v5.0.0
- **Installation**: Installed as `docker-compose-plugin`
- **Command**: `docker compose` (note: no hyphen)

### Code Generation Tools

#### buf CLI
- **Version**: 1.61.0
- **Installation Method**: Binary download from GitHub releases
- **Location**: `/usr/local/bin/buf`
- **Purpose**: Protocol Buffer linting and code generation

**Installation command** (if needed):
```bash
# Download and install buf
BUF_VERSION=1.61.0
curl -sSL "https://github.com/bufbuild/buf/releases/download/v${BUF_VERSION}/buf-Linux-x86_64" -o /tmp/buf
sudo install -m 755 /tmp/buf /usr/local/bin/buf
rm /tmp/buf
```

**Features**:
- Lints Protocol Buffer definitions
- Generates code for both backend (Go) and frontend (TypeScript)
- Manages proto dependencies (e.g., googleapis)

## Environment Configuration

### PATH Configuration

Ensure the following directories are in your PATH:
```bash
export PATH=$PATH:/usr/local/go/bin
export PATH=$PATH:$(go env GOPATH)/bin
export PATH=$PATH:/usr/local/bin
```

Add to `~/.bashrc` or `~/.profile` for persistence:
```bash
echo 'export PATH=$PATH:/usr/local/go/bin:$(go env GOPATH)/bin' >> ~/.bashrc
source ~/.bashrc
```

### Database Configuration

The PostgreSQL database runs in Docker:
- **Image**: postgres:16-alpine
- **Container Name**: cloutgg-postgres
- **Host Port**: 5434
- **Container Port**: 5432
- **Default Credentials**: postgres/postgres
- **Database Name**: cloutgg

Start the database:
```bash
docker compose up -d
```

Verify it's running:
```bash
docker compose ps
```

## Project Setup Commands

### Initial Setup
```bash
# Install all dependencies
make install

# This will:
# 1. Download Go dependencies
# 2. Install npm packages for frontend
# 3. Install Go development tools
```

### Code Generation
```bash
# Generate all code (protobuf + sqlc)
make generate

# Or individually:
make generate-proto  # Generate protobuf code
make generate-sqlc   # Generate database code
```

### Development Workflow

#### Start Everything
```bash
make dev
# This starts:
# - PostgreSQL database (Docker)
# - Go backend server
# - Next.js frontend dev server
```

#### Start Individual Services
```bash
# Database only
make db

# Backend only
make backend

# Frontend only
make frontend
```

#### Run Tests
```bash
# All tests
make test

# Backend tests only
make test-backend

# Frontend type checking only
make test-frontend
```

### Building

#### Backend
```bash
cd backend
go build
# Creates: backend/backend binary
```

#### Frontend
```bash
cd frontend
npm run build
# Creates: frontend/.next/ directory
```

## Verification Steps

### Verify Go Setup
```bash
go version                    # Should show: go version go1.22.2 linux/amd64
which protoc-gen-go          # Should show: /home/ubuntu/go/bin/protoc-gen-go
which sqlc                   # Should show: /home/ubuntu/go/bin/sqlc
cd backend && go build       # Should compile without errors
```

### Verify Node.js Setup
```bash
node --version               # Should show: v22.21.1
npm --version                # Should show: v10.9.4
cd frontend && npx tsc --noEmit  # Should pass without errors
```

### Verify Docker Setup
```bash
docker --version             # Should show: Docker version 29.1.3
docker compose version       # Should show: Docker Compose version v5.0.0
docker ps                    # Should list running containers
```

### Verify buf CLI Setup
```bash
buf --version                # Should show: 1.61.0
cd /workspace && buf lint proto    # Should lint proto files
cd /workspace && buf generate proto # Should generate code
```

### Verify Database
```bash
docker compose up -d         # Start database
docker compose ps            # Should show healthy status
# Connect to verify:
docker exec -it cloutgg-postgres psql -U postgres -d cloutgg
```

## Common Operations

### Database Management
```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View logs
docker compose logs -f db

# Connect to database
docker exec -it cloutgg-postgres psql -U postgres -d cloutgg

# Run migrations (if DATABASE_URL is set)
make migrate-up
make migrate-down
```

### Development
```bash
# Clean generated code and restart
make clean
make generate
make dev
```

### Linting
```bash
# Lint protobuf files
make lint-proto

# Lint frontend
cd frontend && npm run lint

# Format protobuf files
make format-proto
```

## Troubleshooting

### Docker Issues

**Issue**: Docker overlay filesystem errors
- **Solution**: The VM is configured to use `vfs` storage driver instead of `overlay2`
- **Configuration**: `/etc/docker/daemon.json` contains `{"storage-driver": "vfs"}`

**Issue**: Docker daemon not running
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Go Issues

**Issue**: Go tools not in PATH
```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

**Issue**: Cannot find protoc-gen-go or sqlc
```bash
# Reinstall tools
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

### Frontend Issues

**Issue**: npm install fails
```bash
# Clear cache and retry
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Issue**: Protobuf code not generated
```bash
# The prebuild script should generate it automatically
npm run prebuild
# Or manually:
npx buf dep update ../proto
mkdir -p src/lib/gen
npx buf generate ../proto
```

## Architecture Notes

### Protobuf Code Generation

The project uses Protocol Buffers for API definitions:
- **Proto Files**: `/workspace/proto/apiv1/api.proto`
- **buf Configuration**: `/workspace/proto/buf.yaml`

Generated code locations:
- **Backend**: `/workspace/backend/internal/gen/apiv1/`
  - `api.pb.go` - Protobuf message definitions
  - `apiv1connect/` - Connect-Go service implementations
- **Frontend**: `/workspace/frontend/src/lib/gen/apiv1/`
  - `api_pb.{js,d.ts}` - TypeScript message definitions
  - `api_connect.{js,d.ts}` - Connect-Web client

### Database Code Generation

The project uses sqlc to generate type-safe Go code from SQL:
- **SQL Queries**: `/workspace/backend/internal/db/sqlc/queries.sql`
- **Configuration**: `/workspace/backend/sqlc.yaml`
- **Generated Code**: `/workspace/backend/internal/db/sqlc/`
  - `db.go` - Database interface
  - `models.go` - Data models
  - `queries.sql.go` - Query implementations

### Database Migrations

Migration files are located in `/workspace/backend/db/migrations/`:
- `000001_init.up.sql` - Initial schema
- `000001_init.down.sql` - Rollback initial schema
- `000002_add_user_id_to_votes.up.sql` - Add user_id column
- `000002_add_user_id_to_votes.down.sql` - Remove user_id column
- `000003_seed_companies.up.sql` - Seed company data
- `000003_seed_companies.down.sql` - Remove company data

## Dependencies Summary

### Backend Go Dependencies
```
connectrpc.com/connect v1.18.1
github.com/jackc/pgx/v5 v5.7.1
github.com/joho/godotenv v1.5.1
github.com/rs/cors v1.11.1
golang.org/x/net v0.33.0
google.golang.org/protobuf v1.35.0
```

### Frontend npm Dependencies (Key)
```
@auth0/nextjs-auth0 ^4.14.0
@bufbuild/protobuf ^2.10.2
@connectrpc/connect ^2.1.1
@connectrpc/connect-web ^2.1.1
next ^15.1.3
react ^18.3.1
```

## Known Issues and Warnings

### Non-Critical Warnings

1. **buf.yaml deprecation**: Uses `DEFAULT` category instead of `STANDARD` for linting
   - Impact: None, just a deprecation warning
   - Fix: Update `proto/buf.yaml` to use `category: STANDARD`

2. **Package naming convention**: Package `apiv1` doesn't follow buf convention
   - Impact: Linting warning only
   - Suggestion: Consider renaming to `apiv1.v1` for versioning

3. **Auth0 Edge Runtime**: Uses Node.js 'crypto' module
   - Impact: Cannot deploy Auth0 routes to Edge Runtime
   - Current: App works fine with Node.js runtime

4. **docker-compose.yml version**: Version attribute is obsolete
   - Impact: None, just a warning
   - Note: Modern Docker Compose ignores this field

## Summary

This VM environment is fully configured with:
- ✅ Go 1.22.2 with protoc-gen-go and sqlc tools
- ✅ Node.js 22.21.1 with npm 10.9.4
- ✅ Docker 29.1.3 with Compose v5.0.0
- ✅ buf CLI 1.61.0 for protobuf management
- ✅ PostgreSQL 16 running in Docker
- ✅ All project dependencies installed
- ✅ Code generation working
- ✅ Backend and frontend compile successfully

The environment is production-ready for development work.
