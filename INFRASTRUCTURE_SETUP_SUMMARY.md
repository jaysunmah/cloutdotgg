# Infrastructure Setup Summary

**Date:** December 16, 2025  
**Status:** ✅ Complete

## Overview
This document summarizes the setup of infrastructure and code generation tools for the repository.

---

## Tools Installed

### 1. Docker Engine
- **Status:** ✅ Installed and Running
- **Version:** 29.1.3
- **Installation Method:** Official Docker installation script (`get-docker.sh`)
- **Components Installed:**
  - docker-ce (Docker Engine Community Edition)
  - docker-ce-cli (Docker CLI)
  - containerd.io (Container runtime)
  - docker-compose-plugin (Docker Compose v5.0.0)
  - docker-buildx-plugin (Build extensions)
  - docker-ce-rootless-extras
  - docker-model-plugin

### 2. Docker Daemon Configuration
- **Storage Driver:** vfs
  - **Reason for vfs:** Initial attempt with overlayfs failed due to mounting issues in container environment
  - **Resolution:** Restarted Docker daemon with `--storage-driver=vfs` flag
- **Daemon Status:** Running in background (PID logged to `/tmp/dockerd.log`)

### 3. Buf CLI
- **Status:** ✅ Installed
- **Version:** 1.61.0
- **Installation Method:** Downloaded latest release from GitHub
- **Installation Path:** `/usr/local/bin/buf`
- **Purpose:** Protocol buffer management and code generation

### 4. Protocol Buffers Compiler (protoc)
- **Status:** ✅ Installed
- **Version:** 3.21.12 (libprotoc)
- **Installation Method:** apt package manager
- **Packages Installed:**
  - libprotobuf-lite32t64
  - libprotoc32t64
  - libprotobuf-dev
  - protobuf-compiler

### 5. golang-migrate
- **Status:** ✅ Installed
- **Version:** 4.17.0
- **Installation Method:** Downloaded binary from GitHub releases
- **Installation Path:** `/usr/local/bin/migrate`
- **Purpose:** Database migration management

---

## Commands Executed Successfully

### Buf Commands

#### 1. `buf dep update proto`
- **Status:** ✅ Success
- **Warning:** Module `buf.build/googleapis/googleapis` is declared in buf.yaml deps but unused
- **Action Needed:** Consider removing unused dependency from buf.yaml

#### 2. `buf lint proto`
- **Status:** ⚠️ Completed with warnings
- **Warnings:**
  1. Category DEFAULT is deprecated, should use STANDARD instead
  2. Package name "apiv1" should be suffixed with version like "apiv1.v1"
- **Exit Code:** 100 (non-zero due to lint issues)

#### 3. `buf generate proto`
- **Status:** ✅ Success (silent output = success)
- **Generated Files:**
  - Backend (Go): `/workspace/backend/internal/gen/apiv1/api.pb.go`
  - Frontend (TypeScript): 
    - `/workspace/frontend/src/lib/gen/apiv1/api_pb.d.ts`
    - `/workspace/frontend/src/lib/gen/apiv1/api_connect.d.ts`

### Docker Compose Commands

#### 1. `docker compose up -d`
- **Status:** ✅ Success (after fixing storage driver)
- **Services Started:**
  - PostgreSQL 16 (Alpine Linux)
  - Container Name: `cloutgg-postgres`
  - Port Mapping: 5434:5432 (host:container)
  - Volume: `postgres_data` mounted to `/var/lib/postgresql/data`
  - Health Check: Configured with pg_isready

#### 2. PostgreSQL Status Check
- **Status:** ✅ Healthy and accepting connections
- **Database:** cloutgg
- **User:** postgres
- **Version:** PostgreSQL 16.11 on x86_64-pc-linux-musl

---

## Issues Encountered and Resolutions

### Issue 1: Docker Overlayfs Mount Failure
**Problem:**
```
Error: failed to mount /tmp/containerd-mount: mount source: "overlay"...
err: invalid argument
```

**Root Cause:** Docker's default overlayfs storage driver doesn't work well in nested container/VM environments.

**Resolution:**
1. Stopped Docker daemon: `sudo pkill dockerd`
2. Restarted with vfs storage driver: `sudo dockerd --storage-driver=vfs &`
3. Result: PostgreSQL container started successfully

**Impact:** vfs storage driver is less efficient than overlayfs but works reliably in all environments.

### Issue 2: Buf Lint Warnings
**Problem:** 
- Deprecated DEFAULT category in buf.yaml
- Package naming convention violation

**Status:** Non-blocking warnings, protobuf generation works correctly

**Recommended Actions:**
1. Update `proto/buf.yaml` to use STANDARD instead of DEFAULT
2. Consider renaming package from "apiv1" to "apiv1.v1" or configure lint to ignore

### Issue 3: Docker Service Management
**Problem:** systemd couldn't auto-start Docker service

**Resolution:** Used manual start script (`start-docker.sh`) to start Docker daemon in background

**Status:** Working as expected for container environments

---

## Directory Structure After Setup

```
/workspace/
├── backend/
│   └── internal/
│       └── gen/           # ✅ Generated protobuf code
│           └── apiv1/
│               └── api.pb.go
├── frontend/
│   └── src/
│       └── lib/
│           └── gen/       # ✅ Generated TypeScript code
│               └── apiv1/
│                   ├── api_pb.d.ts
│                   └── api_connect.d.ts
└── proto/
    ├── buf.yaml
    ├── buf.lock           # ✅ Updated by buf dep update
    └── apiv1/
        └── api.proto
```

---

## Service Status

| Service | Status | Details |
|---------|--------|---------|
| Docker Daemon | ✅ Running | Storage driver: vfs |
| PostgreSQL | ✅ Running | Container: cloutgg-postgres, Port: 5434 |
| Buf CLI | ✅ Available | Command: `buf` |
| Protoc | ✅ Available | Command: `protoc` |
| golang-migrate | ✅ Available | Command: `migrate` |

---

## Quick Reference Commands

### Docker
```bash
# Check Docker status
sudo docker info

# View running containers
sudo docker ps

# View Docker Compose services
sudo docker compose ps

# Stop PostgreSQL
sudo docker compose down

# Start PostgreSQL
sudo docker compose up -d

# View PostgreSQL logs
sudo docker compose logs db
```

### Buf
```bash
# Update dependencies
buf dep update proto

# Lint proto files
buf lint proto

# Generate code
buf generate proto

# Format proto files
buf format -w proto
```

### Database Migrations
```bash
# Run migrations
migrate -path backend/db/migrations -database "postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable" up

# Rollback migrations
migrate -path backend/db/migrations -database "postgresql://postgres:postgres@localhost:5434/cloutgg?sslmode=disable" down
```

### PostgreSQL Connection
```bash
# Connect to database
sudo docker exec -it cloutgg-postgres psql -U postgres -d cloutgg

# Check connection from host
sudo docker exec cloutgg-postgres pg_isready -U postgres
```

---

## Version Summary

| Tool | Version | Command to Check |
|------|---------|------------------|
| Docker Engine | 29.1.3 | `docker --version` |
| Docker Compose | v5.0.0 | `docker compose version` |
| Buf CLI | 1.61.0 | `buf --version` |
| Protoc | 3.21.12 | `protoc --version` |
| golang-migrate | 4.17.0 | `migrate -version` |
| PostgreSQL | 16.11 | `sudo docker exec cloutgg-postgres psql -V` |
| Go (containerd) | 1.25.5 | N/A |

---

## Next Steps

1. **Optional:** Update `proto/buf.yaml` to fix lint warnings
2. **Optional:** Run database migrations if needed
3. **Development:** All infrastructure is ready for development
4. **Testing:** Verify API endpoints can connect to database

---

## Notes

- Docker daemon must be running for containers to work. Use `start-docker.sh` if system restarts.
- PostgreSQL data persists in Docker volume `postgres_data`
- Generated protobuf code should be committed to repository for consistency
- vfs storage driver is slower but more compatible with container environments

---

## Troubleshooting

### Docker daemon not running
```bash
bash /workspace/start-docker.sh
```

### PostgreSQL not accessible
```bash
# Check container status
sudo docker compose ps

# Restart container
sudo docker compose restart db
```

### Regenerate protobuf code
```bash
cd /workspace
buf generate proto
```

---

**Setup completed successfully! All infrastructure tools are installed and operational.**
