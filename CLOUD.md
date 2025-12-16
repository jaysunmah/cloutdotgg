# Cloud VM Environment Setup

This document describes the VM environment configuration for the CloutGG project. The VM has been fully configured with all necessary dependencies for development.

## ✅ Setup Status: COMPLETE

All components have been successfully installed, tested, and verified working:
- ✅ Backend (Go, protobuf, sqlc)
- ✅ Frontend (Node.js, npm packages)
- ✅ Docker & PostgreSQL
- ✅ Code generation tools
- ✅ Build verification passed

## Pre-installed Tools

The VM comes with the following tools pre-installed:
- **Go**: 1.22.2 linux/amd64 (meets requirement of Go 1.22+)
- **Node.js**: v22.21.1 (exceeds requirement of Node.js 20+)
- **npm**: v10.9.4
- **Git**: Available for version control

## Installed Development Tools

### Backend Tools

1. **protoc-gen-go** - v1.36.11
   - Location: `~/go/bin/protoc-gen-go`
   - Purpose: Go protobuf plugin
   - Installation: `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`
   - Status: ✅ Verified working

2. **sqlc** - v1.30.0
   - Location: `~/go/bin/sqlc`
   - Purpose: Type-safe SQL code generation
   - Installation: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
   - Status: ✅ Verified working with successful code generation

3. **golang-migrate** - dev version
   - Location: `~/go/bin/migrate`
   - Purpose: Database migration tool with PostgreSQL support
   - Installation: `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`
   - Status: ✅ Installed and ready for use

4. **Buf CLI** - v1.61.0
   - Location: `/usr/local/bin/buf`
   - Purpose: Protobuf code generation and management
   - Installation: Downloaded from official releases to `/usr/local/bin`
   - Status: ✅ Verified working with successful protobuf generation

### Docker

- **Docker Engine**: v29.1.3 (build f52814d)
- **Docker Compose**: Integrated v2 plugin
- **Storage Driver**: VFS (required for VM environment)
- **Installation**: Official Docker installation script
- **Status**: ✅ Daemon running, PostgreSQL container verified

### Frontend Dependencies

- **Package Count**: 383 packages installed
- **Security**: 0 vulnerabilities
- **Status**: ✅ All dependencies installed, build verified successful
- **Key Frameworks**:
  - Next.js 15.1.3 (latest stable)
  - React 18.3.1
  - TypeScript 5.6.3
  - Tailwind CSS 3.4.15
  - Auth0 Next.js SDK 4.14.0
  - ConnectRPC libraries (@connectrpc/connect v2.1.1)

## Verification Tests Performed

All components have been tested and verified working:

### Backend Tests ✅
- ✅ Go modules downloaded successfully
- ✅ Protobuf code generation (`buf generate proto`) - Success
- ✅ SQLC code generation (`sqlc generate`) - Success
- ✅ Backend compilation (`go build`) - Compiled to 17MB binary without errors

### Frontend Tests ✅
- ✅ npm dependencies installed - 383 packages, 0 vulnerabilities
- ✅ Production build (`npm run build`) - Completed in ~13.4 seconds
- ✅ TypeScript compilation (`npx tsc --noEmit`) - No errors
- ✅ All 6 Next.js pages generated successfully

### Docker Tests ✅
- ✅ Docker daemon running with VFS storage driver
- ✅ PostgreSQL 16-alpine image pulled successfully
- ✅ Docker Compose started PostgreSQL container
- ✅ Database connection verified - PostgreSQL 16.11 accepting connections
- ✅ Container health check passing

## Environment Setup

### PATH Configuration

The following paths are configured for persistence (automatically added to `~/.bashrc`):
```bash
export PATH="/usr/local/bin:$HOME/go/bin:$PATH"
```

This ensures access to:
- Buf CLI (`/usr/local/bin/buf`)
- Go tools (`~/go/bin/sqlc`, `~/go/bin/protoc-gen-go`, `~/go/bin/migrate`)

### Docker Daemon

Docker daemon uses the `vfs` storage driver and must be started manually on VM boot:
```bash
./start-docker.sh
```

**Important:** Docker requires `sudo` for most operations, or add your user to the docker group:
```bash
sudo usermod -aG docker $USER
newgrp docker  # Activate group membership in current shell
```

## Quick Start Commands

### Complete Setup (First Time)

Run this after cloning the repository or creating a new VM from snapshot:

```bash
cd /workspace
sudo ./start-docker.sh      # Start Docker daemon
make install                # Install Go modules and npm packages
make generate               # Generate protobuf and sqlc code
```

### Starting the Development Environment

Start each service in a separate terminal:

**Terminal 1 - PostgreSQL:**
```bash
cd /workspace
sudo docker compose up -d
```
PostgreSQL will be available on port 5434 (mapped from container port 5432)

**Terminal 2 - Backend:**
```bash
cd /workspace/backend
go run .
```
Backend runs on http://localhost:8080

**Terminal 3 - Frontend:**
```bash
cd /workspace/frontend
npm run dev
```
Frontend runs on http://localhost:3000

## Service Details

### PostgreSQL Container
- **Container Name**: `cloutgg-postgres`
- **Image**: `postgres:16-alpine`
- **Port Mapping**: `5434:5432` (host:container)
- **Volume**: `workspace_postgres_data`
- **Credentials**:
  - User: `postgres`
  - Password: `postgres`
  - Database: `cloutgg`
- **Health Check**: Configured with 5s intervals

### Backend Service
- **Port**: 8080
- **Protocol**: Connect RPC (supports gRPC, gRPC-Web, and Connect)
- **Database Driver**: pgx (PostgreSQL)
- **Code Generation**: Automatic via `make generate`

### Frontend Service
- **Port**: 3000
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **API Client**: ConnectRPC
- **Authentication**: Auth0

## Development Workflow

### After VM Start
1. Start Docker daemon: `./start-docker.sh`
2. Start PostgreSQL: `docker compose up -d`
3. Run code generation (if needed): `make generate`
4. Start backend: `cd backend && go run .`
5. Start frontend: `cd frontend && npm run dev`

### Code Generation

Generated code is **not committed** to git:
- `backend/internal/gen/` - Go protobuf code
- `frontend/src/lib/gen/` - TypeScript protobuf code

Run `make generate` after:
- Cloning the repository
- Modifying proto files
- Changing SQL queries

### Database Migrations

Migrations are located in `backend/db/migrations/` and use golang-migrate format.

To run migrations manually:
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up
```

Note: The PostgreSQL container automatically runs migrations on first startup via the docker-entrypoint-initdb.d volume mount.

## Testing

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

### Run All Tests
```bash
make test
```

## Known Issues & Notes

### Non-Critical Warnings

The following warnings may appear but do not affect functionality:

1. **docker-compose.yml version field**: The `version: '3.8'` field is obsolete in newer Docker Compose but doesn't affect operation
2. **@bufbuild/protoc-gen-connect-es deprecation**: Migration to new package available but not urgent
3. **Auth0 Edge Runtime warning**: Crypto module warning in Edge Runtime (doesn't affect functionality)
4. **ESLint warnings in generated code**: Cosmetic only in auto-generated protobuf files

### Docker Important Notes

- **Docker requires `sudo`** unless you've added your user to the docker group and logged out/in
- **VFS storage driver** is used (required for this VM environment, may be slower but necessary)
- **Daemon startup**: Use `sudo ./start-docker.sh` to start Docker daemon after VM reboot

## Troubleshooting

### Docker Issues
- **Docker daemon not running**: Run `sudo ./start-docker.sh`
- **Permission denied**: Either use `sudo` with docker commands or add user to docker group and restart shell
- **Port conflicts**: Check if port 5434 is already in use with `sudo lsof -i :5434`
- **Container won't start**: Check logs with `sudo docker compose logs db`

### Code Generation Issues
- **Missing buf**: Ensure `/usr/local/bin` is in PATH - check with `which buf`
- **Missing sqlc**: Ensure `~/go/bin` is in PATH - check with `which sqlc`
- **Proto generation fails**: Run `buf dep update proto` first, ensure buf is installed

### Backend Issues
- **Database connection failed**: 
  - Ensure PostgreSQL container is running: `sudo docker ps`
  - Check port is 5434 (not 5432) in connection string
  - Verify DATABASE_URL: `postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable`
- **Port 8080 in use**: Check for other processes: `lsof -i :8080`
- **Module errors**: Run `go mod download` in backend directory

### Frontend Issues
- **npm install fails**: Check Node.js version with `node --version` (requires 20+)
- **Build fails**: Ensure protobuf code is generated first with `make generate`
- **Missing generated files**: Run `npm run prebuild` in frontend directory

## Environment Variables

### Backend (.env or export)
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
PORT=8080
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
# Add Auth0 credentials as needed
```

## Installation Summary

This VM setup installed the following components:

### System Packages (via apt)
- Docker Engine and related packages (containerd, docker-ce, docker-ce-cli)
- Docker Compose plugin (v2)
- Dependencies for Docker installation

### Go Tools (via go install)
- `protoc-gen-go@latest` → v1.36.11
- `sqlc@latest` → v1.30.0
- `migrate@latest` (with postgres tags) → dev version

### Binary Downloads
- Buf CLI v1.61.0 (installed to `/usr/local/bin/buf`)

### Frontend Packages (via npm)
- 383 npm packages in `/workspace/frontend/node_modules`
- All dependencies from package.json including Next.js, React, TypeScript, etc.

### Docker Images
- `postgres:16-alpine` (pulled and verified)

## Notes

- All tools are configured to persist across shell sessions
- PATH includes `/usr/local/bin` and `~/go/bin` for tool access
- Generated protobuf code must be regenerated after cloning or proto changes
- PostgreSQL data persists in Docker volume `workspace_postgres_data`
- The project uses Railway for deployment with automatic code generation during builds
- Docker daemon must be started manually after VM reboot using `./start-docker.sh`

## VM Snapshot Recommendation

This VM is ready for snapshot! After taking a snapshot:
1. The snapshot will include all installed tools and dependencies
2. New VMs from the snapshot only need: `sudo ./start-docker.sh` to start Docker
3. After cloning a new repository: run `make install && make generate`
4. All development tools will be immediately available
