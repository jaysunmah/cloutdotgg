# Cloud VM Setup Documentation

This document describes the complete VM environment setup for the CloutGG project.

## 🎯 Overview

CloutGG is a full-stack application with:
- **Backend**: Go 1.22+ with Connect RPC and PostgreSQL
- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Database**: PostgreSQL 16
- **Code Generation**: Buf (protobuf) and sqlc (database queries)

## 📦 Installed Software & Versions

### Pre-installed (VM Base Image)
- **Go**: 1.22.2
- **Node.js**: v22.21.1
- **npm**: 10.9.4

### Installed During Setup

#### 1. Docker
- **Version**: 29.1.3
- **Installation Method**: Using `/workspace/get-docker.sh` script
- **Configuration**: 
  - VFS storage driver (optimized for VM environments)
  - User `ubuntu` added to docker group
  - Docker daemon running in background
- **Notes**: 
  - Some cgroup v1 warnings are expected in VM environments (non-critical)
  - No memory/swap limit support (typical in containerized environments)

#### 2. Go Development Tools

##### Buf CLI
- **Version**: 1.61.0
- **Installation Method**: Downloaded from GitHub releases
- **Location**: `/usr/local/bin/buf`
- **Purpose**: Protocol buffer code generation

##### sqlc
- **Version**: v1.30.0
- **Installation Method**: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
- **Location**: `/home/ubuntu/go/bin/sqlc`
- **Purpose**: Type-safe Go code generation from SQL queries

##### golang-migrate
- **Version**: 4.19.1
- **Installation Method**: Downloaded from GitHub releases
- **Location**: `/usr/local/bin/migrate`
- **Purpose**: Database schema migrations

##### protoc-gen-go
- **Version**: v1.36.11
- **Installation Method**: `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`
- **Location**: `/home/ubuntu/go/bin/protoc-gen-go`
- **Purpose**: Go code generation for Protocol Buffers

##### protoc-gen-connect-go
- **Version**: v1.19.1
- **Installation Method**: `go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest`
- **Location**: `/home/ubuntu/go/bin/protoc-gen-connect-go`
- **Purpose**: Connect RPC Go code generation

#### 3. Frontend Tools

##### Buf npm packages
- **@bufbuild/buf**: Latest
- **@bufbuild/protoc-gen-es**: Latest (deprecated, using for compatibility)
- **@bufbuild/protoc-gen-connect-es**: v0.13.0 (deprecated, Connect has moved to @connectrpc org)
- **Installation Method**: `npm install --save-dev` in frontend directory
- **Purpose**: TypeScript protobuf and Connect client code generation

## 🔧 Environment Configuration

### PATH Configuration
Go tools are accessible via `/home/ubuntu/go/bin`, which has been added to `~/.bashrc`:
```bash
export PATH=$PATH:/home/ubuntu/go/bin
```

### Database Connection
PostgreSQL runs via Docker Compose on port **5434** (mapped from container port 5432):
```
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable
```

Note: Port 5434 is used instead of 5432 to avoid potential conflicts.

## 🚀 Quick Start Commands

### 1. Start PostgreSQL Database
```bash
cd /workspace
docker compose up -d
```

The database will be available at `localhost:5434` with:
- Username: `postgres`
- Password: `postgres`
- Database: `cloutgg`

### 2. Run Database Migrations
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
migrate -path backend/db/migrations -database "$DATABASE_URL" up
```

### 3. Generate Code (Protobuf + sqlc)
```bash
# Generate all code (both frontend and backend protobuf + sqlc)
make generate

# Or individually:
buf generate proto          # Generate protobuf code
cd backend && sqlc generate # Generate sqlc database code
```

### 4. Start Backend Server
```bash
cd backend
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
go run .
```

Backend will be available at `http://localhost:8080`

### 5. Start Frontend Development Server
```bash
cd frontend
export NEXT_PUBLIC_API_URL="http://localhost:8080"
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 📋 Development Workflow

### Make Targets
The project includes a Makefile with common tasks:

```bash
make install          # Install all dependencies
make generate         # Generate all code (proto + sqlc)
make dev             # Start all services (not recommended in Cloud)
make test            # Run all tests
make clean           # Clean up containers and generated code
make lint-proto      # Lint proto files
```

### Code Generation

#### When to Regenerate Code
Regenerate code after modifying:
- `proto/apiv1/api.proto` - Run `buf generate proto`
- `backend/internal/db/sqlc/queries.sql` - Run `cd backend && sqlc generate`

#### Generated File Locations
- **Backend Protobuf**: `backend/internal/gen/apiv1/`
- **Frontend Protobuf**: `frontend/src/lib/gen/apiv1/`
- **Backend Database**: `backend/internal/db/sqlc/` (models.go, queries.sql.go, etc.)

Note: Generated code is **not committed** to the repository.

## ✅ Verification Tests

All systems have been verified:

### Backend
```bash
cd backend
go build .              # ✓ Compiles successfully
go test ./...           # ✓ Passes (no test files currently)
```

### Frontend
```bash
cd frontend
npm run build           # ✓ Builds successfully
npx tsc --noEmit       # ✓ Type checking passes
```

### Database
```bash
docker ps               # ✓ PostgreSQL container running
migrate -version        # ✓ Migration tool installed
```

### Code Generation
```bash
buf --version           # ✓ v1.61.0
sqlc version           # ✓ v1.30.0
```

## 🏗️ Project Structure

```
/workspace/
├── proto/                          # Protocol Buffer definitions
│   └── apiv1/api.proto            # RPC service definitions
├── backend/                        # Go API server
│   ├── internal/
│   │   ├── gen/                   # Generated protobuf code (not committed)
│   │   ├── db/sqlc/               # Generated sqlc code (committed)
│   │   └── service/               # Service implementations
│   ├── db/migrations/             # Database migrations
│   ├── go.mod                     # Go dependencies
│   └── main.go                    # Entry point
├── frontend/                       # Next.js application
│   ├── src/
│   │   ├── app/                   # App router pages
│   │   ├── components/            # React components
│   │   └── lib/
│   │       ├── gen/               # Generated protobuf code (not committed)
│   │       └── api.ts             # API client setup
│   ├── package.json               # npm dependencies
│   └── ...                        # Next.js config files
├── docker-compose.yml             # PostgreSQL setup
├── Makefile                       # Build automation
└── CLOUD.md                       # This file
```

## 🔍 Troubleshooting

### Docker Issues

**Container not starting:**
```bash
# Check Docker daemon status
docker ps

# Restart Docker daemon
sudo pkill dockerd
sudo dockerd &

# View container logs
docker logs cloutgg-postgres
```

**Permission denied errors:**
```bash
# Add user to docker group (already done in setup)
sudo usermod -aG docker ubuntu
newgrp docker
```

### Code Generation Issues

**Missing protobuf code:**
```bash
# Regenerate all code
make generate

# Or check if buf is in PATH
which buf
export PATH=$PATH:/home/ubuntu/go/bin
```

**sqlc errors:**
```bash
# Ensure sqlc is installed and in PATH
which sqlc
export PATH=$PATH:/home/ubuntu/go/bin

# Regenerate database code
cd backend && sqlc generate
```

### Build Issues

**Backend won't compile:**
1. Check if protobuf code is generated: `ls backend/internal/gen/apiv1/`
2. Check Go modules: `cd backend && go mod download`
3. Regenerate code: `make generate`

**Frontend won't build:**
1. Check if protobuf code is generated: `ls frontend/src/lib/gen/apiv1/`
2. Check npm dependencies: `cd frontend && npm install`
3. Regenerate code: `buf generate proto`

### Database Issues

**Cannot connect to database:**
```bash
# Check if container is running
docker ps

# Check container logs
docker logs cloutgg-postgres

# Restart container
docker compose restart

# Test connection
docker exec -it cloutgg-postgres psql -U postgres -d cloutgg
```

**Migration errors:**
```bash
# Check current migration version
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
migrate -path backend/db/migrations -database "$DATABASE_URL" version

# Force to specific version (use with caution)
migrate -path backend/db/migrations -database "$DATABASE_URL" force <version>
```

## 🌐 Deployment Notes

### Railway Deployment
The project is configured for Railway deployment:
- `railway.toml` - Railway configuration
- `.railwayignore` - Files to exclude from deployment
- Dockerfile.backend - Backend container image
- Dockerfile.frontend - Frontend container image

### Environment Variables for Production
```bash
# Backend
DATABASE_URL=<postgresql-connection-string>
PORT=8080

# Frontend
NEXT_PUBLIC_API_URL=<backend-api-url>
```

## 📝 Additional Notes

### Performance Considerations
- Docker uses VFS storage driver - suitable for development but not optimal for production
- PostgreSQL runs in a container - consider managed PostgreSQL for production
- Generated code is excluded from git - CI/CD must regenerate on each build

### Security Notes
- Default PostgreSQL credentials are for development only
- Production should use strong passwords and SSL connections
- Auth0 is configured for authentication - ensure proper environment variables are set

### Development Tips
1. **Keep generated code fresh**: Run `make generate` after pulling changes that modify proto files
2. **Database changes**: Always create migrations for schema changes (`make migrate-create`)
3. **Type safety**: The project uses type-safe RPC (Connect) and database queries (sqlc) - take advantage of it
4. **Testing**: Add tests in `backend/` and `frontend/src/` directories

## 🆘 Support Resources

- **Buf Documentation**: https://buf.build/docs
- **sqlc Documentation**: https://sqlc.dev
- **Connect RPC**: https://connectrpc.com
- **golang-migrate**: https://github.com/golang-migrate/migrate
- **Next.js**: https://nextjs.org/docs
- **Docker**: https://docs.docker.com

## ✨ VM Snapshot Ready

This VM environment is fully configured and ready for development. All necessary tools are installed, dependencies are downloaded, and initial verification tests have passed.

**What's included:**
- ✅ Go 1.22.2 with all required tools
- ✅ Node.js v22.21.1 with npm dependencies
- ✅ Docker 29.1.3 with PostgreSQL image
- ✅ Buf, sqlc, golang-migrate, and protobuf generators
- ✅ Generated code (protobuf and sqlc)
- ✅ Database running with migrations applied
- ✅ All packages compiled and verified

**Next steps after restoring snapshot:**
1. Start Docker daemon: `sudo dockerd &`
2. Start PostgreSQL: `docker compose up -d`
3. Start backend: `cd backend && go run .`
4. Start frontend: `cd frontend && npm run dev`

---

*Document generated: December 16, 2025*
*VM Setup completed successfully*
