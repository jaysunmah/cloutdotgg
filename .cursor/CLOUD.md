# Cloud Agent Environment for CloutGG

## Project Overview

This is a full-stack application with:
- **Backend**: Go (ConnectRPC + PostgreSQL)
- **Frontend**: Next.js with TypeScript and Auth0 authentication
- **Protocol Buffers**: API definitions using Buf CLI

## Environment

- **Go**: 1.22.2 (with Go tools in `~/go/bin`)
- **Node.js**: v22.21.1 (via nvm)
- **npm**: 10.9.4

## Important Commands

### Code Generation
```bash
# Generate all protobuf and sqlc code
make generate

# Or individually:
make generate-proto  # Protobuf code
make generate-sqlc   # SQLC database code
```

### Building
```bash
# Backend
cd backend && go build -o backend

# Frontend
cd frontend && npm run build
```

### Running Tests
```bash
# Backend
cd backend && go test ./...

# Frontend type checking
cd frontend && npx tsc --noEmit
```

### Development
```bash
# Run backend
cd backend && go run .

# Run frontend dev server
cd frontend && npm run dev
```

## Notes

- Go tools (sqlc, migrate, protoc-gen-go) are installed in `~/go/bin` and added to PATH via `.bashrc`
- Docker is not available in this environment; database operations require an external PostgreSQL instance
- The frontend requires Auth0 environment variables for authentication features
- Database migrations are in `backend/db/migrations/` and can be run with the `migrate` CLI
