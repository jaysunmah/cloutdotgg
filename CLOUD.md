# CloutGG - Cloud VM Environment Setup

This document describes the complete development environment setup for the CloutGG repository. This VM snapshot includes all necessary tools and dependencies to develop, build, test, and deploy the full-stack application.

## 📋 Environment Overview

**Last Updated**: December 16, 2025  
**VM OS**: Ubuntu 24.04 (Linux 6.12.58+)  
**Repository**: https://github.com/cloutdotgg

## 🛠️ Installed Tools & Versions

### Backend (Go)
| Tool | Version | Purpose |
|------|---------|---------|
| **Go** | 1.22.2 (linux/amd64) | Backend runtime & compiler |
| **protoc-gen-go** | v1.36.11 | Generate Go protobuf code |
| **protoc-gen-connect-go** | 1.19.1 | Generate Connect-Go RPC service code |
| **sqlc** | v1.30.0 | Generate type-safe Go code from SQL |

**Go Tools Path**: `/home/ubuntu/go/bin` (permanently added to `$PATH`)

### Frontend (Node.js)
| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | v22.21.1 | Frontend runtime |
| **npm** | 10.9.4 | Package manager |

**Key npm Packages** (383 total installed):
- Next.js: 15.5.9
- React & React DOM: 18.3.1
- TypeScript: 5.9.3
- @auth0/nextjs-auth0: 4.14.0
- @bufbuild/buf: 1.61.0
- @connectrpc/connect: 2.1.1
- Tailwind CSS: 3.4.19
- ESLint: 9.39.2

### Infrastructure
| Tool | Version | Purpose |
|------|---------|---------|
| **Docker** | 28.2.2 | Container runtime |
| **Docker Compose** | 2.37.1 | Multi-container orchestration |
| **Buf CLI** | 1.47.2 | Protobuf linting & code generation |

### Database
| Component | Details |
|-----------|---------|
| **PostgreSQL** | 16.11 (postgres:16-alpine) |
| **Container Name** | cloutgg-postgres |
| **Port** | 5434 (host) → 5432 (container) |
| **Database** | cloutgg |
| **Volume** | postgres_data (persistent) |
| **Status** | Running & Healthy |

## 🚀 Quick Start Commands

### Start Development Environment
```bash
# Start PostgreSQL database
docker compose up -d

# In one terminal - start backend
cd backend && go run .

# In another terminal - start frontend
cd frontend && npm run dev
```

### Code Generation
```bash
# Generate all code (protobuf + sqlc)
make generate

# Or individually:
make generate-proto  # Generate protobuf code
make generate-sqlc   # Generate sqlc database code
```

### Building
```bash
# Build backend
cd backend && go build .

# Build frontend
cd frontend && npm run build
```

### Testing
```bash
# Run all tests
make test

# Backend tests only
cd backend && go test ./... -v

# Frontend type checking
cd frontend && npx tsc --noEmit
```

## 📁 Project Structure

```
/workspace/
├── proto/                  # Protobuf definitions
│   └── apiv1/
│       └── api.proto      # RPC service definitions
├── backend/               # Go backend
│   ├── internal/
│   │   ├── gen/          # Generated protobuf/Connect code
│   │   ├── db/sqlc/      # Generated sqlc database code
│   │   └── service/      # RPC service implementations
│   ├── db/migrations/    # SQL migrations
│   ├── go.mod
│   └── main.go
├── frontend/             # Next.js frontend
│   ├── src/
│   │   ├── app/         # Next.js app router
│   │   ├── components/  # React components
│   │   └── lib/
│   │       ├── gen/     # Generated Connect-Web client
│   │       └── api.ts   # API client
│   ├── package.json
│   └── next.config.ts
├── docker-compose.yml    # PostgreSQL container config
└── Makefile             # Build automation
```

## 🔧 Environment Setup Details

### 1. Go Backend Environment

**Installation Steps**:
```bash
# Go was pre-installed (1.22.2)

# Install required Go tools
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# Download dependencies
cd backend && go mod download

# Add Go tools to PATH permanently
echo 'export PATH=$PATH:/home/ubuntu/go/bin' >> ~/.bashrc
```

**Verification**:
- ✅ Backend compiles successfully
- ✅ All Go tools accessible in PATH
- ✅ Dependencies resolved
- ✅ Protobuf code generation working

### 2. Node.js Frontend Environment

**Installation Steps**:
```bash
# Node.js and npm were pre-installed
# Node.js v22.21.1 (exceeds v20+ requirement)

# Install frontend dependencies
cd frontend && npm install
```

**Verification**:
- ✅ 383 packages installed successfully
- ✅ 0 security vulnerabilities
- ✅ TypeScript compilation working
- ✅ All build tools functional

### 3. Docker & Infrastructure

**Installation Steps**:
```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2

# Start Docker daemon
bash /workspace/start-docker-daemon.sh

# Install Buf CLI
curl -sSL "https://github.com/bufbuild/buf/releases/download/v1.47.2/buf-Linux-x86_64" \
  -o /tmp/buf
sudo mv /tmp/buf /usr/local/bin/buf
sudo chmod +x /usr/local/bin/buf

# Start PostgreSQL
cd /workspace && docker compose up -d
```

**Verification**:
- ✅ Docker engine running
- ✅ Docker Compose functional
- ✅ Buf CLI installed
- ✅ PostgreSQL container healthy

## 🌐 Environment Variables

### Backend
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
export PORT=8080
```

### Frontend
```bash
export NEXT_PUBLIC_API_URL="http://localhost:8080"
```

## 📝 Development Workflow

### 1. After Cloning or Pulling Changes
```bash
# Regenerate code if proto files changed
make generate

# Restart services
make dev
```

### 2. Adding New RPC Methods
```bash
# 1. Edit proto/apiv1/api.proto
# 2. Regenerate code
make generate-proto
# 3. Implement service method in backend/internal/service/
# 4. Use new method in frontend
```

### 3. Database Changes
```bash
# Create a new migration
make migrate-create
# (Enter migration name when prompted)

# Run migrations
export DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable"
make migrate-up

# Regenerate sqlc code if queries changed
make generate-sqlc
```

## 🐳 Docker Commands

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# View logs
docker logs cloutgg-postgres

# Stop and remove all data
docker compose down -v

# Connect to database
docker exec -it cloutgg-postgres psql -U postgres -d cloutgg
```

## 🧪 Testing & Quality

### Backend Testing
```bash
cd backend
go test ./... -v              # Run all tests
go test -cover ./...          # With coverage
go test -race ./...           # Race condition detection
```

### Frontend Testing
```bash
cd frontend
npm run lint                  # ESLint
npx tsc --noEmit             # Type checking
npm run build                # Production build test
```

### Protobuf Linting
```bash
make lint-proto              # Lint proto files
make format-proto            # Format proto files
```

## 🚢 Deployment (Railway)

This project is configured for automatic deployment on Railway:

1. **Commit changes**: All changes are automatically committed and pushed
2. **Railway auto-deploys**: Railway detects pushes to `main` and redeploys
3. **Code generation**: Happens automatically during Railway builds

### Railway Configuration
- **Backend**: Root directory `backend`, auto-generates proto code on build
- **Frontend**: Root directory `frontend`, auto-generates proto code on build
- **Database**: Managed PostgreSQL service with automatic migrations

See `railway.toml` and individual `nixpacks.toml` files for build configuration.

## 🔍 Troubleshooting

### Docker Daemon Not Running
```bash
bash /workspace/start-docker-daemon.sh
```

### Generated Code Missing
```bash
make clean
make generate
```

### Database Connection Issues
```bash
# Check container status
docker ps

# Check container logs
docker logs cloutgg-postgres

# Restart container
docker compose restart
```

### Go Build Errors
```bash
# Update dependencies
cd backend && go mod tidy

# Clear build cache
go clean -cache

# Rebuild
go build .
```

### Frontend Build Errors
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
```

## 📚 Additional Resources

- **Connect RPC**: https://connectrpc.com/
- **sqlc Documentation**: https://docs.sqlc.dev/
- **Buf CLI**: https://buf.build/docs/
- **Next.js**: https://nextjs.org/docs
- **PostgreSQL**: https://www.postgresql.org/docs/

## ✅ Verification Checklist

Use this checklist to verify the VM environment is properly set up:

- [ ] Go version >= 1.22
- [ ] Node.js version >= 20
- [ ] Docker running and accessible
- [ ] Buf CLI installed
- [ ] Go tools in PATH (protoc-gen-go, protoc-gen-connect-go, sqlc)
- [ ] Frontend dependencies installed (node_modules exists)
- [ ] Backend dependencies downloaded
- [ ] PostgreSQL container running
- [ ] Database healthy and accepting connections
- [ ] Generated code exists (backend/internal/gen, frontend/src/lib/gen)
- [ ] Backend builds successfully
- [ ] Frontend TypeScript compiles

## 🎉 Summary

This VM is fully configured with:
- ✅ **Go 1.22.2** with all required tools
- ✅ **Node.js 22.21.1** with 383 npm packages
- ✅ **Docker 28.2.2** with Compose v2.37.1
- ✅ **PostgreSQL 16.11** running in Docker
- ✅ **Buf CLI 1.47.2** for protobuf generation
- ✅ **sqlc v1.30.0** for database code generation
- ✅ All code generation working
- ✅ Backend and frontend building successfully

**The environment is ready for development, testing, and deployment!**
