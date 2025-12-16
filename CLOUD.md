# Cloud VM Environment Setup Guide

This document provides a complete overview of the VM environment setup for the CloutGG full-stack application. This VM snapshot includes all necessary tools and dependencies to develop, build, test, and deploy the application.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Installed Tools & Versions](#installed-tools--versions)
- [Backend Environment](#backend-environment)
- [Frontend Environment](#frontend-environment)
- [Database Environment](#database-environment)
- [Code Generation Tools](#code-generation-tools)
- [Quick Start Commands](#quick-start-commands)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## 🖥️ System Overview

**Operating System:** Linux 6.12.58+  
**Architecture:** amd64  
**Workspace:** `/workspace`  
**Git Repository:** Initialized and connected to remote

### Key Technologies

- **Backend:** Go 1.22.2 with Connect RPC
- **Frontend:** Next.js 15 with TypeScript and React 18
- **Database:** PostgreSQL 16 (Docker containerized)
- **API Protocol:** Connect RPC (gRPC-compatible)
- **Code Generation:** Protocol Buffers (buf), sqlc

---

## 🔧 Installed Tools & Versions

### Core Development Tools

| Tool | Version | Location | Purpose |
|------|---------|----------|---------|
| **Go** | 1.22.2 | `/usr/bin/go` | Backend development |
| **Node.js** | 22.21.1 | `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/node` | Frontend development |
| **npm** | 10.9.4 | `/home/ubuntu/.nvm/versions/node/v22.21.1/bin/npm` | Package management |
| **Docker** | 29.1.3 | `/usr/bin/docker` | Containerization |
| **Docker Compose** | v5.0.0 | Plugin | Container orchestration |

### Code Generation & Build Tools

| Tool | Version | Location | Purpose |
|------|---------|----------|---------|
| **buf** | 1.28.1 | `/usr/local/bin/buf` | Protocol buffer management |
| **sqlc** | v1.27.0 | `/usr/local/bin/sqlc` | Type-safe SQL code generation |
| **protoc** | 25.1 | `/usr/bin/protoc` | Protocol buffer compiler |
| **golang-migrate** | 4.17.0 | `/usr/local/bin/migrate` | Database migrations |
| **protoc-gen-go** | latest | `~/go/bin/protoc-gen-go` | Go protobuf plugin |
| **protoc-gen-go-grpc** | v1.6.0 | `~/go/bin/protoc-gen-go-grpc` | Go gRPC plugin |

### Frontend Tools (via npm)

- **TypeScript** 5.9.3 (via `npx tsc`)
- **Next.js** 15.5.9
- **ESLint** 9.39.2
- **Tailwind CSS** 3.4.19
- **buf** 1.61.0 (via `npx buf`)

---

## 🔨 Backend Environment

### Go Configuration

**Version:** 1.22.2  
**GOPATH:** Default (`~/go`)  
**Module:** `github.com/cloutdotgg/backend`

### Installed Go Dependencies

All dependencies from `go.mod` have been downloaded:
- `connectrpc.com/connect` v1.18.1 - Connect RPC framework
- `github.com/jackc/pgx/v5` v5.7.1 - PostgreSQL driver
- `github.com/joho/godotenv` v1.5.1 - Environment variables
- `github.com/rs/cors` v1.11.1 - CORS middleware
- `golang.org/x/net` v0.33.0 - Network utilities
- `google.golang.org/protobuf` v1.35.0 - Protocol buffers

### Backend Build Status

✅ **Successfully compiled** - Binary size: 17MB  
✅ **sqlc code generated** - Type-safe database queries  
✅ **Protobuf code generated** - Connect RPC handlers

### Backend Directory Structure

```
backend/
├── internal/
│   ├── gen/           # Generated protobuf code (from buf)
│   ├── db/
│   │   └── sqlc/      # Generated SQL code (from sqlc)
│   └── service/       # RPC service implementations
├── db/
│   └── migrations/    # Database migrations
├── main.go            # Entry point
└── go.mod             # Dependencies
```

---

## 🎨 Frontend Environment

### Node.js Configuration

**Version:** 22.21.1 (via NVM)  
**npm Version:** 10.9.4  
**Package Manager:** npm

### Installed Frontend Dependencies

**383 packages installed** (0 vulnerabilities)

#### Core Framework
- Next.js 15.5.9
- React 18.3.1
- React DOM 18.3.1

#### TypeScript & Tooling
- TypeScript 5.9.3
- ESLint 9.39.2
- Tailwind CSS 3.4.19
- PostCSS 8.5.6
- Autoprefixer 10.4.23

#### API & Protocol Buffers
- @bufbuild/protobuf 2.10.2
- @bufbuild/buf 1.61.0
- @connectrpc/connect 2.1.1
- @connectrpc/connect-web 2.1.1
- ts-proto 2.8.3

#### Authentication
- @auth0/nextjs-auth0 4.14.0

### Frontend Directory Structure

```
frontend/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   └── lib/
│       ├── gen/       # Generated protobuf TypeScript code
│       ├── api.ts     # API client setup
│       └── auth0.ts   # Auth0 configuration
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript config
```

---

## 🐳 Database Environment

### PostgreSQL Configuration

**Version:** PostgreSQL 16.11 (Alpine Linux)  
**Container Name:** `cloutgg-postgres`  
**Status:** Running and Healthy ✅

### Connection Details

- **Host:** localhost
- **Port:** 5434 (mapped from container port 5432)
- **Database:** cloutgg
- **User:** postgres
- **Password:** postgres
- **Connection String:** `postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable`

### Docker Configuration

**Storage Driver:** VFS (Virtual File System)  
**Reason:** The VM kernel has limited overlayfs support, so Docker was configured to use VFS for better compatibility.

**Volume:** `workspace_postgres_data` - Persistent database storage

### Health Check

- Interval: 5 seconds
- Command: `pg_isready -U postgres`
- Status: Passing ✅

### Database Schema

The database includes three migrations:
1. `000001_init.up.sql` - Initial schema (companies, votes tables)
2. `000002_add_user_id_to_votes.up.sql` - Add user tracking
3. `000003_seed_companies.up.sql` - Seed initial company data

---

## 🛠️ Code Generation Tools

### Protocol Buffers (buf)

**Version:** 1.28.1 (system) / 1.61.0 (npm)  
**Configuration Files:**
- `/workspace/proto/buf.yaml` - Main buf config
- `/workspace/buf.gen.yaml` - Root generation config
- `/workspace/backend/buf.gen.yaml` - Backend generation
- `/workspace/frontend/buf.gen.yaml` - Frontend generation

**Generated Code Locations:**
- Backend: `/workspace/backend/internal/gen/`
- Frontend: `/workspace/frontend/src/lib/gen/`

**Generation Command:**
```bash
buf generate proto
```

### sqlc

**Version:** v1.27.0  
**Configuration:** `/workspace/backend/sqlc.yaml`

**Features:**
- Type-safe Go code from SQL queries
- Automatic struct generation
- Query parameter validation

**Generated Code Location:** `/workspace/backend/internal/db/sqlc/`

**Generation Command:**
```bash
cd backend && sqlc generate
```

### Database Migrations (golang-migrate)

**Version:** 4.17.0  
**Migration Path:** `/workspace/backend/db/migrations/`

**Commands:**
```bash
# Run migrations up
export DATABASE_URL="postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up

# Run migrations down
make migrate-down

# Create new migration
make migrate-create
```

---

## 🚀 Quick Start Commands

### Start Everything

```bash
# Start from workspace root
cd /workspace

# 1. Start Docker daemon (if not running)
bash start-docker.sh

# 2. Start PostgreSQL database
docker compose up -d

# 3. Verify database is healthy
docker ps

# 4. Start backend (in one terminal)
cd backend && go run .

# 5. Start frontend (in another terminal)
cd frontend && npm run dev
```

### Code Generation

```bash
# Generate all code (protobuf + sqlc)
make generate

# Or individually:
make generate-proto   # Protobuf code
make generate-sqlc    # SQL code
```

### Build & Test

```bash
# Build backend
cd backend && go build

# Run backend tests
cd backend && go test ./...

# Build frontend
cd frontend && npm run build

# Run frontend type checking
cd frontend && npx tsc --noEmit

# Lint protobuf files
buf lint proto
```

---

## 💻 Development Workflow

### Making API Changes

1. **Update Protocol Buffer Definition**
   ```bash
   # Edit proto/apiv1/api.proto
   vim proto/apiv1/api.proto
   ```

2. **Regenerate Code**
   ```bash
   make generate-proto
   ```

3. **Implement Backend Handler**
   ```bash
   # Edit backend/internal/service/rankings.go
   ```

4. **Use in Frontend**
   ```typescript
   // Frontend automatically gets typed client
   import { createClient } from "@connectrpc/connect";
   import { RankingsService } from "./gen/api_pb";
   ```

### Making Database Changes

1. **Create Migration**
   ```bash
   make migrate-create
   # Enter migration name
   ```

2. **Write SQL**
   ```bash
   # Edit backend/db/migrations/NNNNNN_name.up.sql
   # Edit backend/db/migrations/NNNNNN_name.down.sql
   ```

3. **Run Migration**
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
   make migrate-up
   ```

4. **Update Queries**
   ```bash
   # Edit backend/internal/db/sqlc/queries.sql
   ```

5. **Regenerate sqlc Code**
   ```bash
   make generate-sqlc
   ```

### Git Workflow

```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Your message"

# Push (triggers Railway auto-deploy)
git push origin main
```

---

## 🐛 Troubleshooting

### Docker Issues

**Problem:** Docker daemon not running

```bash
# Solution: Start Docker manually
cd /workspace && bash start-docker.sh
```

**Problem:** Permission denied accessing Docker

```bash
# Solution: Use sudo or add user to docker group
sudo docker ps
# OR
sudo usermod -aG docker $USER && newgrp docker
```

**Problem:** overlayfs errors

```bash
# Already fixed: Docker configured to use VFS storage driver
# Check config: cat /etc/docker/daemon.json
```

### Database Issues

**Problem:** Cannot connect to PostgreSQL

```bash
# Check if container is running
sudo docker ps | grep postgres

# Check container logs
cd /workspace && sudo docker compose logs db

# Restart container
sudo docker compose restart db
```

**Problem:** Port 5434 already in use

```bash
# Find process using port
sudo lsof -i :5434

# Stop and restart
cd /workspace && sudo docker compose down && sudo docker compose up -d
```

### Code Generation Issues

**Problem:** buf command not found

```bash
# Check installation
which buf

# If missing, reinstall
go install github.com/bufbuild/buf/cmd/buf@latest
```

**Problem:** Generated code import errors

```bash
# Regenerate all code
cd /workspace
make clean
make generate
```

### Build Issues

**Problem:** Go module errors

```bash
# Clean and re-download
cd backend
go clean -modcache
go mod download
```

**Problem:** npm install fails

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 📚 Additional Resources

### Documentation Files

- `/workspace/README.md` - Main project README
- `/workspace/BACKEND_ENVIRONMENT_SETUP_COMPLETE.md` - Detailed backend setup
- `/workspace/DOCKER_DATABASE_SETUP_COMPLETE.md` - Docker and database setup
- `/workspace/Makefile` - Build automation commands

### External Documentation

- [Connect RPC](https://connectrpc.com/) - RPC framework
- [buf](https://buf.build/docs) - Protocol buffer tooling
- [sqlc](https://sqlc.dev/) - SQL code generation
- [Next.js](https://nextjs.org/docs) - Frontend framework
- [Railway](https://docs.railway.app/) - Deployment platform

---

## ✅ Environment Status

| Component | Status | Notes |
|-----------|--------|-------|
| Go | ✅ Installed | v1.22.2 |
| Node.js | ✅ Installed | v22.21.1 (NVM) |
| Docker | ✅ Running | v29.1.3 with VFS storage |
| PostgreSQL | ✅ Running | v16.11, port 5434 |
| buf | ✅ Installed | v1.28.1 |
| sqlc | ✅ Installed | v1.27.0 |
| golang-migrate | ✅ Installed | v4.17.0 |
| Backend Build | ✅ Working | 17MB binary |
| Frontend Build | ✅ Working | 383 packages |
| Code Generation | ✅ Working | Protobuf + sqlc |
| Database Connection | ✅ Working | Healthy container |

**Last Updated:** December 16, 2025  
**VM Setup:** Complete and verified ✅

---

## 🎯 Summary

This VM snapshot provides a complete development environment for the CloutGG full-stack application with:

- ✅ All development tools installed and configured
- ✅ Backend (Go) ready with all dependencies
- ✅ Frontend (Next.js) ready with all packages
- ✅ PostgreSQL database running in Docker
- ✅ Code generation tools (buf, sqlc) configured
- ✅ Docker configured with VFS storage for VM compatibility
- ✅ All builds tested and verified

You can immediately start development with `make dev` or deploy to Railway by pushing to the main branch.
