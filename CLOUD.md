# Cloud VM Setup Documentation

This document describes the setup process and configuration for the CloutGG development environment on this VM.

## Project Overview

**CloutGG** is a full-stack web application with:
- **Backend:** Go 1.22+ with Chi router and PostgreSQL
- **Frontend:** Next.js 15 with React 18 and Tailwind CSS
- **Database:** PostgreSQL 16 (running in Docker)

## Pre-installed Tools

The VM came with the following tools already installed:
- **Go:** 1.22.2
- **Node.js:** 22.21.1
- **npm:** 10.9.4
- **Make:** 4.3
- **Git:** 2.43.0
- **curl:** 8.5.0
- **jq:** JSON processor
- **vim & nano:** Text editors
- **wget, tar, gzip:** Archive tools

## Installed Dependencies

During the setup process, the following packages were installed:

### 1. Docker & Docker Compose
- **Docker version:** 29.1.3
- **Docker Compose version:** v5.0.0
- **Installation method:** Official Docker installation script
- **Storage driver:** vfs (required due to VM overlay filesystem limitations)

### 2. PostgreSQL Client Tools
- **Version:** 16.11
- **Package:** postgresql-client
- **Purpose:** Database management and debugging

### 3. Project Dependencies

#### Go Backend Dependencies
Installed via `go mod download`:
- github.com/go-chi/chi/v5 v5.1.0 (HTTP router)
- github.com/go-chi/cors v1.2.1 (CORS middleware)
- github.com/jackc/pgx/v5 v5.7.1 (PostgreSQL driver)
- github.com/joho/godotenv v1.5.1 (Environment variables)

#### Node.js Frontend Dependencies
Installed via `npm install`:
- next: ^15.1.3
- react: ^18.3.1
- react-dom: ^18.3.1
- typescript: ^5.6.3
- tailwindcss: ^3.4.15
- And other dev dependencies (355 packages total)

## Special Configuration

### Docker Setup

Due to VM environment limitations, Docker needs to be started with the **vfs storage driver** instead of the default overlay2 driver. A helper script has been created to handle this.

**Helper Script:** `/workspace/start-docker.sh`

This script:
1. Checks if Docker is already running
2. Starts Docker daemon with vfs storage driver
3. Waits for Docker to be ready (up to 30 seconds)

**Usage:**
```bash
./start-docker.sh
```

**Note:** Docker daemon is NOT managed by systemd in this VM environment, so it needs to be started manually after VM reboot.

### Database Configuration

PostgreSQL runs in a Docker container with the following configuration:
- **Container name:** cloutgg-postgres
- **Port mapping:** 5434:5432 (host:container)
- **Default credentials:**
  - User: postgres
  - Password: postgres
  - Database: cloutgg
- **Migrations:** Automatically run on container initialization from `/workspace/backend/migrations/`

**Database Tables:**
- users
- companies
- company_comments
- company_ratings
- votes

## Development Workflow

### Quick Start

1. **Start Docker (if not running):**
   ```bash
   ./start-docker.sh
   ```

2. **Start PostgreSQL:**
   ```bash
   docker compose up -d
   ```

3. **Start Backend (Terminal 1):**
   ```bash
   cd backend
   go run .
   ```
   Server runs on http://localhost:8080

4. **Start Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on http://localhost:3000

### Using Make Commands

The project includes a Makefile for common tasks:

```bash
make install    # Install all dependencies
make db         # Start PostgreSQL
make backend    # Run Go backend
make frontend   # Run Next.js frontend
make clean      # Stop and clean up Docker containers
```

### Building for Production

**Backend:**
```bash
cd backend
go build -o bin/server .
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

### Linting

**Frontend:**
```bash
cd frontend
npm run lint
```

## Verification Tests Performed

All of the following were successfully tested during setup:

1. ✅ Go backend compilation (`go build`)
2. ✅ Go backend startup and database connection
3. ✅ Frontend build (`npm run build`)
4. ✅ Frontend linting (`npm run lint`)
5. ✅ PostgreSQL container startup
6. ✅ Database migrations execution
7. ✅ Database connection via psql client

## Database Management

### Connect to Database

```bash
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d cloutgg
```

### Common psql Commands

```sql
\dt              -- List all tables
\d table_name    -- Describe table structure
\q               -- Quit psql
```

### Reset Database

```bash
docker compose down -v
docker compose up -d
```

## Environment Variables

The application expects the following environment variables (default values work for local development):

```bash
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable

# Backend
PORT=8080

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## API Endpoints

| Method | Endpoint         | Description       |
|--------|------------------|-------------------|
| GET    | `/health`        | Health check      |
| GET    | `/api/users`     | List all users    |
| POST   | `/api/users`     | Create a user     |
| GET    | `/api/users/:id` | Get user by ID    |

**Example API Call:**
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

## Troubleshooting

### Docker Won't Start

If Docker fails to start or containers won't run:

1. Stop any existing Docker processes:
   ```bash
   sudo pkill dockerd
   ```

2. Start Docker with the helper script:
   ```bash
   ./start-docker.sh
   ```

3. Verify Docker is running:
   ```bash
   sudo docker info
   ```

### Database Connection Issues

If the backend can't connect to PostgreSQL:

1. Check if the container is running:
   ```bash
   docker ps
   ```

2. Check container logs:
   ```bash
   docker logs cloutgg-postgres
   ```

3. Verify port mapping:
   ```bash
   docker ps | grep postgres
   ```
   Should show `0.0.0.0:5434->5432/tcp`

### Frontend Build Errors

If npm build fails:

1. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

## Additional Notes

- **No tests:** The project currently has no test files, so `go test` and `npm test` commands will not execute any tests.
- **Docker storage:** The vfs storage driver is slower than overlay2 but required for this VM environment.
- **Port conflict:** Note that PostgreSQL runs on port 5434 (not the default 5432) to avoid conflicts.
- **Migrations:** Database migrations are automatically executed when the PostgreSQL container starts for the first time.

## VM Snapshot Recommendations

When creating a snapshot of this VM for future use, ensure:

1. Docker daemon is stopped (it should auto-start after VM boots)
2. No running containers (`docker compose down`)
3. No unnecessary large files in node_modules or Go cache
4. The `start-docker.sh` script is present and executable

## Setup Summary

**Total setup time:** ~10 minutes

**Disk space used:**
- Docker images: ~130 MB
- Node modules: ~150 MB
- Go modules: ~50 MB

**Key changes made:**
1. Installed Docker Engine and Docker Compose
2. Installed PostgreSQL client tools
3. Downloaded all Go dependencies
4. Installed all Node.js dependencies
5. Created Docker helper script
6. Verified all components work correctly

---

**Last updated:** December 15, 2025
**VM OS:** Ubuntu 24.04 (Linux 6.12.58+)
**Setup performed by:** Cloud Agent
