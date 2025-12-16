# Cloud VM Setup Guide for CloutGG Development

This document describes the VM setup process and all dependencies required for developing CloutGG.

## VM Environment Details

- **OS**: Linux (Ubuntu-based)
- **Go Version**: 1.22.2
- **Node.js Version**: v22.21.1
- **npm Version**: 10.9.4

## Dependencies Installed

### 1. Docker (v29.1.3)

Docker was installed using the official installation script and configured to use the `vfs` storage driver (required for this VM environment due to overlay filesystem limitations).

**Installation command:**
```bash
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
sudo sh /tmp/get-docker.sh
sudo usermod -aG docker $USER
```

**Important Note**: The VM doesn't use systemd, so Docker must be started manually:
```bash
./start-docker-daemon.sh
```

### 2. Buf CLI (v1.47.2)

Buf is used for Protocol Buffer code generation and linting.

**Installation command:**
```bash
curl -sSL https://github.com/bufbuild/buf/releases/download/v1.47.2/buf-Linux-x86_64 -o /tmp/buf
sudo mv /tmp/buf /usr/local/bin/buf
sudo chmod +x /usr/local/bin/buf
```

### 3. sqlc (v1.30.0)

sqlc generates type-safe Go code from SQL queries.

**Installation command:**
```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

**Important**: Requires Go 1.23+, auto-upgrades to Go 1.24.11 during installation.

### 4. golang-migrate

Database migration tool for managing PostgreSQL schema changes.

**Installation command:**
```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

### 5. protoc-gen-go

Go protocol buffer compiler plugin.

**Installation command:**
```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
```

## Environment Setup

### PATH Configuration

The Go binaries are installed to `~/go/bin` and must be added to PATH. This has been added to `~/.bashrc`:

```bash
export PATH=$PATH:$HOME/go/bin
```

To apply in current shell:
```bash
source ~/.bashrc
```

## Project Setup Workflow

### 1. Install Project Dependencies

```bash
# Backend Go dependencies
cd backend && go mod download

# Frontend npm dependencies
cd frontend && npm install
```

### 2. Generate Code

The project requires code generation from Protocol Buffers and SQL queries:

```bash
# Generate all code (proto + sqlc)
make generate

# Or individually:
buf generate proto        # Generate proto code
cd backend && sqlc generate  # Generate sqlc code
```

This generates:
- Go server code in `backend/internal/gen/`
- TypeScript client code in `frontend/src/lib/gen/`
- sqlc database code in `backend/internal/db/sqlc/`

### 3. Start PostgreSQL Database

```bash
# Start Docker daemon first (VM-specific requirement)
./start-docker-daemon.sh

# Start PostgreSQL container
docker compose up -d

# Verify it's running
docker ps
docker exec cloutgg-postgres pg_isready -U postgres
```

**Database Details:**
- Port: 5434 (mapped from container port 5432)
- User: postgres
- Password: postgres
- Database: cloutgg

### 4. Run Database Migrations

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
migrate -path backend/db/migrations -database "$DATABASE_URL" up
```

### 5. Start Development Servers

**Backend (Go):**
```bash
cd backend
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
go run .
```

Server runs on http://localhost:8080

**Frontend (Next.js):**
```bash
cd frontend
npm run dev
```

Server runs on http://localhost:3000

## Testing & Validation

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

### Frontend Linting
```bash
cd frontend
npm run lint
```

### Proto Linting
```bash
buf lint proto
```

## Known Issues & Workarounds

### 1. Docker Storage Driver

The VM environment requires Docker to use the `vfs` storage driver instead of the default `overlay2` due to filesystem limitations. This is handled automatically by the `start-docker-daemon.sh` script.

### 2. No systemd

The VM doesn't use systemd, so services must be started manually. Docker cannot be managed with `systemctl` commands.

### 3. Go Version Mismatch

Some Go tools (sqlc, migrate) require Go 1.23+, but the VM has Go 1.22.2. The Go toolchain automatically downloads and uses a compatible version (1.24.11) when installing these tools.

### 4. Frontend Build with buf

The frontend's `prebuild` script tries to use `npx buf`, which won't work. Instead, always run `buf generate proto` from the workspace root before building the frontend.

## Makefile Commands

The project includes a Makefile for common tasks:

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies and tools |
| `make generate` | Generate all code (proto + sqlc) |
| `make generate-proto` | Generate only protobuf code |
| `make generate-sqlc` | Generate only sqlc code |
| `make dev` | Start all services (db + backend + frontend) |
| `make db` | Start PostgreSQL |
| `make backend` | Run Go backend |
| `make frontend` | Run Next.js frontend |
| `make test` | Run all tests |
| `make clean` | Stop containers and clean generated code |
| `make lint-proto` | Lint proto files |
| `make migrate-up` | Run database migrations |
| `make migrate-down` | Rollback migrations |

## Quick Start for Development

After the VM snapshot is restored:

1. Start Docker:
   ```bash
   ./start-docker-daemon.sh
   ```

2. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```

3. Run migrations (first time only):
   ```bash
   export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
   migrate -path backend/db/migrations -database "$DATABASE_URL" up
   ```

4. Start backend:
   ```bash
   cd backend
   DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable" go run .
   ```

5. Start frontend (in a separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```

## Architecture Overview

```
┌─────────────┐     Connect RPC      ┌─────────────┐
│   Next.js   │ ◄──────────────────► │   Go API    │
│  Frontend   │    (HTTP/2, JSON)    │   Server    │
└─────────────┘                      └──────┬──────┘
                                            │
                                     ┌──────▼──────┐
                                     │ PostgreSQL  │
                                     │  Database   │
                                     └─────────────┘
```

## Development Tools Summary

| Tool | Version | Purpose | Location |
|------|---------|---------|----------|
| Go | 1.22.2 | Backend runtime | /usr/bin/go |
| Node.js | v22.21.1 | Frontend runtime | ~/.nvm/versions/node/v22.21.1/bin/node |
| npm | 10.9.4 | Package manager | ~/.nvm/versions/node/v22.21.1/bin/npm |
| Docker | 29.1.3 | Container runtime | /usr/bin/docker |
| buf | 1.47.2 | Proto code generation | /usr/local/bin/buf |
| sqlc | 1.30.0 | SQL code generation | ~/go/bin/sqlc |
| migrate | dev | Database migrations | ~/go/bin/migrate |
| protoc-gen-go | latest | Go proto plugin | ~/go/bin/protoc-gen-go |

## Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Server port (default: 8080)

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8080)
- Auth0 variables (optional for local dev):
  - `AUTH0_DOMAIN`
  - `AUTH0_CLIENT_ID`
  - `APP_BASE_URL`
  - `AUTH0_SECRET`
  - `AUTH0_CLIENT_SECRET`

## Verification Checklist

After VM setup, verify:

- [ ] Docker starts successfully with `./start-docker-daemon.sh`
- [ ] `docker ps` works without errors
- [ ] PostgreSQL container starts with `docker compose up -d`
- [ ] `buf --version` shows v1.47.2
- [ ] `sqlc version` shows v1.30.0
- [ ] `migrate -version` works
- [ ] `buf generate proto` completes without errors
- [ ] `cd backend && sqlc generate` completes without errors
- [ ] Backend starts with `cd backend && go run .`
- [ ] Frontend starts with `cd frontend && npm run dev`
- [ ] Tests pass with `cd backend && go test ./...`
- [ ] Type checking passes with `cd frontend && npx tsc --noEmit`

## Snapshot Preparation

Before taking a VM snapshot, ensure:

1. Docker daemon is stopped (it will be started on-demand)
2. All development servers are stopped
3. Docker containers are stopped: `docker compose down`
4. Generated code is present in:
   - `backend/internal/gen/`
   - `frontend/src/lib/gen/`
5. Dependencies are installed:
   - `backend/go.sum` is up to date
   - `frontend/node_modules/` exists
6. PATH is configured in `~/.bashrc`

## Support & Troubleshooting

### Docker won't start
- Check if already running: `sudo docker ps`
- Check logs: `tail -f /tmp/dockerd.log`
- Restart: `sudo pkill dockerd && ./start-docker-daemon.sh`

### Code generation fails
- Ensure buf is installed: `which buf`
- Check PATH: `echo $PATH | grep go/bin`
- Re-run with verbose output: `buf generate proto --debug`

### Backend won't start
- Check DATABASE_URL is set
- Verify PostgreSQL is running: `docker ps`
- Check migrations ran: `migrate -path backend/db/migrations -database "$DATABASE_URL" version`

### Frontend won't start
- Check node_modules exists: `ls frontend/node_modules`
- Reinstall if needed: `cd frontend && npm install`
- Check generated code exists: `ls frontend/src/lib/gen/apiv1`
