# Cloud VM Environment Setup

This document describes the VM environment configuration for the CloutGG project.

## Pre-installed Tools

The VM comes with the following tools pre-installed:
- **Go**: 1.22.2 linux/amd64
- **Node.js**: v22.21.1
- **npm**: (included with Node.js)
- **Git**: Available for version control

## Installed Development Tools

### Backend Tools

1. **Buf CLI** - v1.61.0
   - Location: `~/bin/buf`
   - Purpose: Protobuf code generation
   - Installation: Downloaded from official releases

2. **sqlc** - v1.30.0
   - Location: `~/go/bin/sqlc`
   - Purpose: Type-safe SQL code generation
   - Installation: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`

3. **protoc-gen-go** - v1.36.11
   - Location: `~/go/bin/protoc-gen-go`
   - Purpose: Go protobuf plugin
   - Installation: `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`

4. **protoc-gen-connect-go** - latest
   - Location: `~/go/bin/protoc-gen-connect-go`
   - Purpose: Connect RPC plugin for Go
   - Installation: `go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest`

### Docker

- **Docker Engine**: v29.1.3 (build f52814d)
- **Docker Compose**: v5.0.0
- **Storage Driver**: vfs (configured for VM environment)
- **Installation**: Official Docker installation script

### Frontend Dependencies

- **Package Count**: 373 packages installed
- **Security**: 0 vulnerabilities
- **Key Frameworks**:
  - Next.js 15.5.9
  - React 18.3.1
  - TypeScript 5.9.3
  - Tailwind CSS 3.4.19
  - Auth0 Next.js SDK 4.14.0
  - ConnectRPC libraries

## Environment Setup

### PATH Configuration

The following paths are added to `~/.bashrc` for persistence:
```bash
export PATH="$HOME/bin:$HOME/go/bin:$PATH"
```

### Docker Daemon

Docker daemon uses the `vfs` storage driver and must be started manually on VM boot:
```bash
./start-docker.sh
```

**Important:** The `ubuntu` user has been added to the `docker` group. After taking a snapshot and launching a new VM from it, you may need to:
- Either log out and log back in for group membership to take effect
- Or use `sudo docker` commands until you restart your shell session
- Or run `newgrp docker` to activate the group membership in the current shell

## Quick Start Commands

### 1. Complete Setup (First Time)

Run this after cloning the repository or creating a new VM from snapshot:

```bash
cd /workspace
./start-docker.sh           # Start Docker daemon
make install                # Install Go modules and npm packages
make generate               # Generate protobuf and sqlc code
```

### 2. Start Docker Daemon (if not running)
```bash
cd /workspace
./start-docker.sh
```

### 3. Start Services

Start each service in a separate terminal:

**Terminal 1 - PostgreSQL:**
```bash
cd /workspace
docker compose up -d        # Or: sudo docker compose up -d
```

**Terminal 2 - Backend:**
```bash
cd /workspace/backend
go run .
```

**Terminal 3 - Frontend:**
```bash
cd /workspace/frontend
npm run dev
```

### 4. Start PostgreSQL
```bash
docker compose up -d
```

PostgreSQL will be available on port 5434 (mapped from container port 5432)

### 5. Start Backend
```bash
cd backend
go run .
```

Backend runs on http://localhost:8080

### 6. Start Frontend
```bash
cd frontend
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

## Troubleshooting

### Docker Issues
- **Docker daemon not running**: Run `./start-docker.sh`
- **Port conflicts**: Check if port 5434 is already in use
- **Container won't start**: Check logs with `docker compose logs db`

### Code Generation Issues
- **Missing buf**: Ensure `~/bin` is in PATH
- **Missing sqlc**: Ensure `~/go/bin` is in PATH
- **Proto generation fails**: Run `buf dep update proto` first

### Backend Issues
- **Database connection failed**: Ensure PostgreSQL container is running
- **Port 8080 in use**: Check for other processes using the port

### Frontend Issues
- **npm install fails**: Check Node.js version (requires 20+)
- **Build fails**: Ensure protobuf code is generated first

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

## Notes

- All tools are configured to persist across shell sessions via `~/.bashrc`
- Generated protobuf code must be regenerated after VM snapshots if proto files changed
- PostgreSQL data persists in Docker volume `workspace_postgres_data`
- The project uses Railway for deployment with automatic code generation during builds
