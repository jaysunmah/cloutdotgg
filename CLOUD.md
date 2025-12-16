# Cloud VM Setup Guide

This document describes the VM environment setup for the CloutGG project. This snapshot includes all necessary tools and dependencies to develop, build, test, and deploy the application.

## Environment Overview

**OS**: Linux 6.12.58+ (Ubuntu)  
**Architecture**: linux/amd64

## Pre-installed Tools

The following tools come pre-installed on this VM:

### Core Runtime Environments
- **Go**: v1.22.2
- **Node.js**: v22.21.1
- **npm**: v10.9.4

### Docker & Containers
- **Docker**: v29.1.3 (build f52814d)
- **Docker Compose**: v5.0.0
- **Configuration**: Uses VFS storage driver (optimized for containerized environments)
- **Note**: Docker commands currently require `sudo`. After first login, the `ubuntu` user is added to the docker group.

### Go Development Tools
All tools installed to `/usr/local/bin` and `~/go/bin`:

- **Buf CLI**: v1.61.0 - Protocol buffer code generation and linting
- **sqlc**: v1.27.0 - Type-safe SQL code generation for Go
- **golang-migrate**: v4.17.0 - Database migration management
- **protoc-gen-go**: v1.36.11 - Protocol buffer Go plugin
- **protoc-gen-connect-go**: v1.19.1 - Connect RPC Go plugin

### PATH Configuration
The following paths are configured in `~/.bashrc`:
- `$HOME/go/bin` - Go-installed binaries
- `/usr/local/bin` - System-wide binaries

## Project Setup

### 1. Install Dependencies

The project dependencies are already downloaded but can be refreshed:

```bash
# Install/update all dependencies
make install

# Or individually:
cd backend && go mod download
cd frontend && npm install
```

### 2. Generate Code

Generated code (protobuf and sqlc) is not committed to the repository. Generate it:

```bash
make generate
```

This generates:
- Go server code in `backend/internal/gen/apiv1/`
- TypeScript client code in `frontend/src/lib/gen/apiv1/`
- sqlc database code in `backend/internal/db/sqlc/`

### 3. Start PostgreSQL

```bash
sudo docker compose up -d
```

This starts PostgreSQL 16 on port **5434** (note: not the default 5432).

### 4. Run Database Migrations

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up
```

### 5. Start the Backend

```bash
cd backend
go run .
```

The Connect RPC server will run on http://localhost:8080

### 6. Start the Frontend

```bash
cd frontend
npm run dev
```

The Next.js app will run on http://localhost:3000

## Development Workflow

### Full Development Environment
```bash
make dev
```

This starts:
1. PostgreSQL (Docker Compose)
2. Go backend (port 8080)
3. Next.js frontend (port 3000)

### Testing

```bash
# Run all tests
make test

# Backend tests
make test-backend

# Frontend type checking
make test-frontend
```

### Code Generation

After modifying proto files or SQL queries:

```bash
# Regenerate protobuf code
make generate-proto

# Regenerate sqlc database code
make generate-sqlc

# Or regenerate everything
make generate
```

### Database Migrations

```bash
# Create new migration
make migrate-create
# Enter migration name when prompted

# Apply migrations
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up

# Rollback migrations
make migrate-down
```

### Linting

```bash
# Lint proto files
make lint-proto

# Format proto files
make format-proto

# Lint frontend
cd frontend && npm run lint
```

### Building

```bash
# Build backend
cd backend && go build -o cloutgg-backend .

# Build frontend
cd frontend && npm run build
```

## Environment Variables

### Backend
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
PORT=8080
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

For Auth0 integration (optional):
```bash
AUTH0_SECRET=<your-secret>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=<your-auth0-domain>
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
```

## Docker Configuration

The Docker daemon is configured with special settings for containerized environments:

**File**: `/etc/docker/daemon.json`
```json
{
  "storage-driver": "vfs"
}
```

This uses the VFS (Virtual File System) storage driver, which is required for nested containerization. The overlay2 driver is not available in this environment.

### Known Docker Warnings (Expected)
The following cgroup warnings are normal in containerized environments and don't affect functionality:
- No memory limit support
- No swap limit support
- No OOM kill disable support
- No cpuset support

## Troubleshooting

### Docker Permission Issues
If you get permission errors with Docker:
```bash
# Add yourself to docker group (already done in this VM)
sudo usermod -aG docker $USER

# Apply group changes (requires logout/login)
newgrp docker
```

### Generated Code Missing
If you see import errors:
```bash
make generate
```

### Database Connection Issues
Ensure PostgreSQL is running and using the correct port (5434):
```bash
sudo docker ps
sudo docker compose logs db
```

### Port Already in Use
If ports 3000 or 8080 are in use:
```bash
# Check what's using the port
sudo lsof -i :8080
sudo lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

### Frontend Build Issues
If the frontend build fails due to missing generated code:
```bash
cd frontend
npx buf generate ../proto
npm run build
```

## Quick Reference Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make generate` | Generate all code (proto + sqlc) |
| `make dev` | Start all services |
| `make test` | Run all tests |
| `make clean` | Clean containers and generated code |
| `make lint-proto` | Lint proto files |
| `sudo docker compose up -d` | Start PostgreSQL |
| `sudo docker compose down` | Stop PostgreSQL |
| `sudo docker ps` | List running containers |

## Tech Stack Summary

**Backend**:
- Go 1.22.2
- Connect RPC (gRPC-compatible)
- PostgreSQL 16 with pgx driver
- sqlc for type-safe queries

**Frontend**:
- Next.js 15
- React 18
- TypeScript 5.6
- Tailwind CSS 3.4
- Connect-Web for RPC calls
- Auth0 for authentication

**Code Generation**:
- Buf CLI for protobuf
- sqlc for database code
- Connect plugins for RPC

**Database**:
- PostgreSQL 16 Alpine
- golang-migrate for migrations

## Deployment

This project is configured for Railway deployment:

1. Push to GitHub
2. Railway automatically detects and builds each service
3. Proto code is generated during build (see `railway.toml`)
4. Each service has its own `buf.gen.yaml` and `nixpacks.toml`

## VM Snapshot Details

This VM snapshot includes:
- ✅ All runtime environments (Go, Node.js)
- ✅ All development tools (buf, sqlc, migrate, protoc plugins)
- ✅ Docker & Docker Compose fully configured
- ✅ PATH configuration in ~/.bashrc
- ✅ Backend dependencies downloaded
- ✅ Frontend dependencies installed
- ✅ Generated code (proto + sqlc)
- ✅ Verified builds for both backend and frontend

## Initial Setup Commands

After starting from this VM snapshot, run:

```bash
# 1. Start PostgreSQL
sudo docker compose up -d

# 2. Run migrations
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up

# 3. Start development
make dev
```

## Notes

- **PostgreSQL Port**: Uses 5434 instead of 5432 (see docker-compose.yml)
- **Generated Code**: Not committed to git, regenerate with `make generate`
- **Docker Storage**: Uses VFS driver for compatibility
- **Auth0**: Optional, application works without it for basic functionality

---

**Last Updated**: December 16, 2025  
**VM Environment Version**: 1.0
