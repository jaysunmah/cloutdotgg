# VM Environment Setup Summary

This document provides a comprehensive overview of the VM environment setup for the CloutGG full-stack application.

## 📋 Overview

This is a full-stack application consisting of:
- **Backend**: Go application using ConnectRPC and PostgreSQL
- **Frontend**: Next.js application with TypeScript and Auth0 authentication
- **Protocol Buffers**: API definitions using Buf CLI
- **Database**: PostgreSQL 16 running in Docker

## 🖥️ System Information

- **OS**: Linux 6.12.58+ x86_64
- **Distribution**: Ubuntu 24.04.3 LTS (Noble Numbat)

## 🛠️ Installed Tools & Versions

### Core Languages & Runtimes

| Tool | Version | Status |
|------|---------|--------|
| **Go** | 1.22.2 | ✅ Pre-installed |
| **Node.js** | v22.21.1 | ✅ Pre-installed |
| **npm** | 10.9.4 | ✅ Pre-installed |

### Container & Database Tools

| Tool | Version | Installation |
|------|---------|--------------|
| **Docker Engine** | 29.1.3 | ✅ Newly installed |
| **Docker Compose** | v5.0.0 | ✅ Newly installed |
| **PostgreSQL** | 16-alpine | ✅ Running in Docker |

### Go Development Tools

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **sqlc** | v1.30.0 | Database code generation | ✅ Newly installed |
| **golang-migrate** | v4.19.1 | Database migrations | ✅ Newly installed |
| **protoc-gen-go** | v1.36.11 | Protobuf Go code generation | ✅ Newly installed |

### Protocol Buffers Tools

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Buf CLI** | 1.61.0 | Protobuf build & management | ✅ Newly installed |

## 📦 Dependencies Installed

### Backend (Go)
```bash
cd /workspace/backend
go mod download
```

**Installed modules:**
- connectrpc.com/connect v1.18.1
- github.com/jackc/pgx/v5 v5.7.1
- github.com/joho/godotenv v1.5.1
- github.com/rs/cors v1.11.1
- golang.org/x/net v0.33.0
- google.golang.org/protobuf v1.35.0

### Frontend (Node.js)
```bash
cd /workspace/frontend
npm install
```

**Installed 383 packages** including:
- next: ^15.1.3
- react: ^18.3.1
- @auth0/nextjs-auth0: ^4.14.0
- @connectrpc/connect: ^2.1.1
- typescript: ^5.6.3
- tailwindcss: ^3.4.15

**Security Status**: 0 vulnerabilities

## 🔧 Installation Commands Run

### Docker Installation
```bash
# Update system and install prerequisites
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Start Docker daemon
sudo dockerd &
```

### Go Tools Installation
```bash
# Install sqlc
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# Install golang-migrate with PostgreSQL support
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Install protoc-gen-go
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
```

### Buf CLI Installation
```bash
# Install Buf CLI
curl -sSL "https://github.com/bufbuild/buf/releases/download/v1.61.0/buf-Linux-x86_64" \
  -o /usr/local/bin/buf
chmod +x /usr/local/bin/buf
```

### Code Generation
```bash
# Generate protobuf code for backend and frontend
make generate-proto

# Generate SQLC database code
cd backend && sqlc generate
```

## 🗄️ Database Setup

### PostgreSQL Container
```bash
# Start PostgreSQL database
docker compose up -d
```

**Configuration:**
- Container Name: `cloutgg-postgres`
- Image: `postgres:16-alpine`
- Port: `5434:5432` (host:container)
- Database: `cloutgg`
- User: `postgres`
- Password: `postgres`

### Database Migrations
```bash
# Run all migrations
migrate -path backend/db/migrations \
  -database "postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable" up
```

**Applied Migrations:**
1. ✅ `000001_init.up.sql` - Initial schema
2. ✅ `000002_add_user_id_to_votes.up.sql` - Add user_id to votes table
3. ✅ `000003_seed_companies.up.sql` - Seed company data

## ✅ Verification Tests

### Backend Tests
```bash
cd /workspace/backend

# Build verification
go build -v
✅ SUCCESS - Binary created: backend/backend (17.5 MB)

# Test execution
go test ./... -v
✅ SUCCESS - No test files present (expected)

# SQLC generation
sqlc generate
✅ SUCCESS - Database code generated
```

### Frontend Tests
```bash
cd /workspace/frontend

# TypeScript compilation
npx tsc --noEmit
✅ SUCCESS - No type errors

# Linting
npm run lint
✅ SUCCESS - Only minor warnings in generated code

# Production build
npm run build
✅ SUCCESS - Build completed in ~8.2s
```

### Protocol Buffers
```bash
# Generate protobuf code
make generate-proto
✅ SUCCESS - Code generated for backend and frontend

# Lint proto files
buf lint proto
⚠️ WARNING - Minor versioning suggestion (non-blocking)
```

## 🚀 Available Make Commands

The repository includes a comprehensive Makefile with the following commands:

```bash
# Development
make dev              # Start database, backend, and frontend
make db               # Start PostgreSQL in Docker
make backend          # Run Go backend
make frontend         # Run Next.js frontend

# Installation
make install          # Install all dependencies
make install-tools    # Install development tools

# Code Generation
make generate         # Generate all code (proto + sqlc)
make generate-proto   # Generate protobuf code
make generate-sqlc    # Generate SQLC database code

# Testing
make test             # Run all tests
make test-backend     # Run Go tests
make test-frontend    # Run TypeScript type checking

# Linting
make lint-proto       # Lint proto files
make format-proto     # Format proto files

# Database Migrations
make migrate-up       # Apply all migrations
make migrate-down     # Rollback migration
make migrate-create   # Create new migration

# Cleanup
make clean            # Stop containers and clean generated code
```

## 📝 Environment Configuration

### Required Environment Variables (Backend)

The backend expects the following environment variables (typically in `.env` file):

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
PORT=8080
```

### Required Environment Variables (Frontend)

The frontend expects the following environment variables (typically in `.env.local` file):

```bash
AUTH0_SECRET=<your-auth0-secret>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=<your-auth0-domain>
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_CLIENT_SECRET=<your-auth0-client-secret>
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🔍 Docker Configuration Notes

1. **Storage Driver**: Configured to use `vfs` storage driver (in `/etc/docker/daemon.json`) due to environment constraints
2. **Daemon Management**: Docker daemon started manually with `sudo dockerd` (runs in background)
3. **Permissions**: Docker commands require `sudo` prefix unless user is added to docker group
4. **Port Mapping**: PostgreSQL exposed on port 5434 (host) to avoid conflicts with local installations

## 🎯 Quick Start Guide

### Start Development Environment
```bash
# 1. Start the database
make db
# or
docker compose up -d

# 2. Run database migrations (first time only)
migrate -path backend/db/migrations \
  -database "postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable" up

# 3. Start backend (in one terminal)
cd backend
go run .

# 4. Start frontend (in another terminal)
cd frontend
npm run dev
```

### Build for Production
```bash
# Generate all code
make generate

# Build backend
cd backend
go build -o backend

# Build frontend
cd frontend
npm run build
npm start
```

## 📚 Additional Resources

- **Backend Documentation**: `backend/README.md`
- **Protocol Buffers**: `proto/buf.yaml`
- **Database Schema**: `backend/db/migrations/`
- **Frontend Pages**: `frontend/src/app/`

## ⚠️ Known Issues & Notes

1. **Buf Lint Warning**: Proto file package naming convention warning (non-blocking)
2. **Docker Deprecation**: `version` field in `docker-compose.yml` is deprecated (can be removed)
3. **ESLint Deprecation**: `next lint` command deprecated in Next.js 15.x (migration available)
4. **Unused Deps**: `buf.build/googleapis/googleapis` declared but unused in frontend buf.yaml
5. **TypeScript**: Some implicit 'any' types in component files (existing code quality items)

## 🎉 Summary

The VM environment is **fully configured and operational**. All required tools are installed, dependencies are up to date, and the application successfully:

- ✅ Compiles (both backend and frontend)
- ✅ Generates code (protobuf and SQLC)
- ✅ Runs database migrations
- ✅ Builds for production
- ✅ Passes linting and type checking

The development environment is ready for immediate use!

---

**Setup Date**: December 17, 2025  
**Setup Duration**: ~5 minutes (parallelized tasks)  
**Components Verified**: Docker, Go, Node.js, PostgreSQL, Buf, SQLC, Migrations
