# VM Setup Documentation

## Installed Software

This VM has been configured with all necessary tools for CloutGG development:

### Core Development Tools
- **Go**: 1.22.2 (Backend development)
- **Node.js**: v22.21.1 (Frontend development)
- **npm**: 10.9.4 (Package management)
- **Git**: 2.43.0 (Version control)
- **Make**: 4.3 (Build automation)

### Container & Database Tools
- **Docker**: 29.1.3 (Container runtime)
- **Docker Compose**: v5.0.0 (Multi-container orchestration)
- **PostgreSQL Client**: 16.11 (Database access)

## Project Dependencies

All project dependencies have been installed:
- ✅ Go modules downloaded (`backend/`)
- ✅ Node.js packages installed (`frontend/node_modules/`)

## Docker Configuration

Docker has been configured with the `vfs` storage driver for compatibility with this VM environment.

### Starting Docker

To start Docker daemon after VM restart, run:
```bash
start-docker.sh
```

This script has been installed to `/usr/local/bin/start-docker.sh` and will:
1. Check if Docker is already running
2. Start Docker daemon with vfs storage driver if needed
3. Fix socket permissions for non-root access

## Quick Start Commands

### Start the Database
```bash
cd /workspace
docker compose up -d
```

### Run the Backend
```bash
cd /workspace/backend
DATABASE_URL="postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable" go run .
```

### Run the Frontend (Development)
```bash
cd /workspace/frontend
npm run dev
```

### Using Makefile Commands
```bash
make db        # Start PostgreSQL
make backend   # Run Go backend
make frontend  # Run Next.js frontend
make install   # Install all dependencies
make clean     # Stop and clean up containers
```

## Database Access

Connect to PostgreSQL:
```bash
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d cloutgg
```

Connection details:
- **Host**: localhost
- **Port**: 5434
- **Database**: cloutgg
- **User**: postgres
- **Password**: postgres

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

## Known Issues

### Frontend Production Build
The Next.js production build (`npm run build`) currently fails with an error. However, the development server (`npm run dev`) and linting work correctly. This appears to be a framework-specific issue that doesn't affect development.

### Docker Daemon Persistence
The Docker daemon does not start automatically on VM boot. You must run `start-docker.sh` after each restart to start Docker services.

## Testing

### Backend
```bash
cd /workspace/backend
go test ./...
```

### Frontend
```bash
cd /workspace/frontend
npm run lint
```

## Verification Steps

To verify everything is working:

1. **Start Docker**:
   ```bash
   start-docker.sh
   ```

2. **Start Database**:
   ```bash
   cd /workspace && docker compose up -d
   ```

3. **Test Backend Build**:
   ```bash
   cd /workspace/backend && go build -o /tmp/test-backend .
   ```

4. **Test Frontend Dev Server**:
   ```bash
   cd /workspace/frontend && npm run dev
   # (Ctrl+C to stop)
   ```

5. **Verify Database Connection**:
   ```bash
   PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d cloutgg -c "\dt"
   ```

All these steps should complete successfully.
