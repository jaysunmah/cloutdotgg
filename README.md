# CloutGG

Full-stack webapp with **Go** backend, **PostgreSQL** database, and **Next.js** frontend. Uses **Connect RPC** for type-safe API communication and **sqlc** for database queries.

## Project Structure

```
.
├── proto/                 # Protocol Buffer definitions
│   └── api.proto          # RPC service and message definitions
├── backend/               # Go API server
│   ├── internal/
│   │   ├── gen/          # Generated Connect/protobuf code
│   │   ├── db/
│   │   │   └── sqlc/     # Generated sqlc database code
│   │   └── service/      # RPC service implementations
│   ├── db/
│   │   └── migrations/   # SQL migrations (golang-migrate format)
│   ├── go.mod
│   └── main.go
├── frontend/             # Next.js app
│   ├── src/
│   │   ├── app/         # App router pages
│   │   └── lib/
│   │       ├── api.ts    # API client using Connect
│   │       └── gen/      # Generated Connect client code
│   ├── package.json
│   └── ...
├── buf.yaml              # Buf configuration
├── buf.gen.yaml          # Buf code generation config
├── docker-compose.yml    # PostgreSQL container
├── Makefile              # Build automation
└── README.md
```

## Prerequisites

- [Go 1.23+](https://golang.org/dl/)
- [Node.js 20+](https://nodejs.org/)
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)
- [Buf CLI](https://buf.build/docs/installation) (for protobuf code generation)

## Quick Start

### 1. Install Dependencies

```bash
make install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 and automatically runs the initial migration.

### 3. Start the Go Backend

```bash
cd backend
go run .
```

The Connect RPC server runs on http://localhost:8080

### 4. Start the Next.js Frontend

```bash
cd frontend
npm run dev
```

The frontend runs on http://localhost:3000

## Tech Stack

- **Backend:** Go 1.24, Connect RPC, pgx (PostgreSQL driver)
- **Database:** PostgreSQL 16, sqlc (type-safe queries)
- **Frontend:** Next.js 15, React 18, Tailwind CSS, TypeScript
- **RPC:** Connect (supports gRPC, gRPC-Web, and Connect protocols)
- **Code Generation:** Buf, protoc-gen-go, protoc-gen-connect-go, protoc-gen-es

## Connect RPC

This project uses [Connect](https://connectrpc.com/) for type-safe RPC communication between the frontend and backend.

### Service Definition

All RPC methods are defined in `proto/api.proto`:

```protobuf
service RankingsService {
  rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
  rpc GetStats(GetStatsRequest) returns (GetStatsResponse);
  rpc ListCompanies(ListCompaniesRequest) returns (ListCompaniesResponse);
  rpc GetCompany(GetCompanyRequest) returns (GetCompanyResponse);
  rpc GetMatchup(GetMatchupRequest) returns (GetMatchupResponse);
  rpc SubmitVote(SubmitVoteRequest) returns (SubmitVoteResponse);
  rpc GetLeaderboard(GetLeaderboardRequest) returns (GetLeaderboardResponse);
  // ... more methods
}
```

### Generate Code

After modifying `proto/api.proto`, regenerate the code:

```bash
make generate
```

This generates:
- Go server code in `backend/internal/gen/`
- TypeScript client code in `frontend/src/lib/gen/`
- sqlc database code in `backend/internal/db/sqlc/`

### Using the API

**Backend (Go):**

```go
// The service implementation in internal/service/rankings.go
func (s *RankingsService) GetCompany(
    ctx context.Context,
    req *connect.Request[gen.GetCompanyRequest],
) (*connect.Response[gen.GetCompanyResponse], error) {
    company, err := s.queries.GetCompanyBySlug(ctx, req.Msg.Slug)
    // ... handle response
}
```

**Frontend (TypeScript):**

```typescript
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { RankingsService } from "./gen/api_pb";

const transport = createConnectTransport({ baseUrl: API_URL });
const client = createClient(RankingsService, transport);

// Type-safe RPC call
const response = await client.getCompany({ slug: "openai" });
console.log(response.company?.name);
```

## Database (sqlc)

Database queries are defined in SQL and compiled to type-safe Go code using [sqlc](https://sqlc.dev/).

### Query Definitions

Queries are in `backend/internal/db/sqlc/queries.sql`:

```sql
-- name: GetCompanyBySlug :one
SELECT * FROM companies WHERE slug = $1;

-- name: ListCompanies :many
SELECT * FROM companies ORDER BY elo_rating DESC;
```

### Generate sqlc Code

```bash
cd backend && sqlc generate
```

### Using sqlc in Code

```go
// Type-safe database queries
company, err := s.queries.GetCompanyBySlug(ctx, "openai")
companies, err := s.queries.ListCompanies(ctx)
```

## Migrations

Migrations use the golang-migrate format in `backend/db/migrations/`.

### Create a Migration

```bash
make migrate-create
# Enter migration name when prompted
```

### Run Migrations

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/cloutgg?sslmode=disable"
make migrate-up
```

### Rollback Migrations

```bash
make migrate-down
```

## Development Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make generate` | Generate all code (proto + sqlc) |
| `make dev` | Start all services |
| `make test` | Run all tests |
| `make clean` | Clean up containers and generated code |
| `make lint-proto` | Lint proto files |

## Environment Variables

```bash
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cloutgg?sslmode=disable

# Backend
PORT=8080

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Deploy to Railway

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
gh repo create cloutdotgg --public --push
```

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Create new project and add PostgreSQL
3. Deploy backend with root directory `backend`
4. Deploy frontend with root directory `frontend`
5. Set environment variables accordingly

## Architecture

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

- **Frontend** uses Connect-Web client for type-safe RPC calls
- **Backend** implements Connect handlers, uses sqlc for database access
- **Database** managed with golang-migrate migrations
