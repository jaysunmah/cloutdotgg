# CloutGG

Full-stack webapp with **Go** backend, **PostgreSQL** database, and **Next.js** frontend. Uses **Connect RPC** for type-safe API communication and **sqlc** for database queries.

## Project Structure

```
.
├── proto/                 # Protocol Buffer definitions
│   └── api.proto          # RPC service and message definitions
├── backend/               # Go API server
│   ├── internal/
│   │   ├── gen/          # Generated Connect/protobuf code (not committed)
│   │   ├── db/
│   │   │   └── sqlc/     # Generated sqlc database code
│   │   └── service/      # RPC service implementations
│   ├── db/
│   │   └── migrations/   # SQL migrations (golang-migrate format)
│   ├── buf.gen.yaml      # Backend-specific buf generation config
│   ├── go.mod
│   └── main.go
├── frontend/             # Next.js app
│   ├── src/
│   │   ├── app/         # App router pages
│   │   └── lib/
│   │       ├── api.ts    # API client using Connect
│   │       └── gen/      # Generated Connect client code (not committed)
│   ├── buf.gen.yaml      # Frontend-specific buf generation config
│   ├── package.json
│   └── ...
├── buf.yaml              # Buf configuration
├── buf.gen.yaml          # Buf code generation config (for local dev)
├── docker-compose.yml    # PostgreSQL container
├── Makefile              # Build automation
└── README.md
```

> **Note:** Generated proto code (`backend/internal/gen/` and `frontend/src/lib/gen/`) is **not committed** to the repository. Run `make generate` after cloning to generate these files locally. CI/CD pipelines automatically generate them during builds.

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

### 2. Generate Proto Code

Generated code is not committed to the repository. Generate it after cloning:

```bash
make generate
```

This generates:
- Go server code in `backend/internal/gen/`
- TypeScript client code in `frontend/src/lib/gen/`
- sqlc database code in `backend/internal/db/sqlc/`

### 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 and automatically runs the initial migration.

### 4. Start the Go Backend

```bash
cd backend
go run .
```

The Connect RPC server runs on http://localhost:8080

### 5. Start the Next.js Frontend

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

> **CI/CD Note:** Proto code is automatically generated during Railway builds via `nixpacks.toml`. Each service has its own `buf.gen.yaml` that generates only the code it needs.

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

# Auth0 - Frontend (Next.js)
AUTH0_SECRET=              # Run `openssl rand -hex 32` to generate
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_DOMAIN.auth0.com
AUTH0_CLIENT_ID=           # From Auth0 Application settings
AUTH0_CLIENT_SECRET=       # From Auth0 Application settings
AUTH0_AUDIENCE=            # Your API identifier (optional, for access tokens)

# Auth0 - Backend (Go)
AUTH0_DOMAIN=YOUR_DOMAIN.auth0.com
AUTH0_AUDIENCE=https://api.cloutdotgg.com  # Your API identifier
```

## Auth0 Setup

This project uses [Auth0](https://auth0.com/) for authentication.

### 1. Create an Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new **Regular Web Application**
3. Configure the following:
   - **Allowed Callback URLs:** `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs:** `http://localhost:3000`
   - **Allowed Web Origins:** `http://localhost:3000`

### 2. Create an Auth0 API (for backend JWT validation)

1. In Auth0 Dashboard, go to **Applications > APIs**
2. Create a new API with:
   - **Identifier:** `https://api.cloutdotgg.com` (or your preferred identifier)
   - **Signing Algorithm:** RS256
3. Use this identifier as `AUTH0_AUDIENCE`

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Frontend
AUTH0_SECRET=$(openssl rand -hex 32)
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_DOMAIN.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://api.cloutdotgg.com

# Backend
AUTH0_DOMAIN=YOUR_DOMAIN.auth0.com
AUTH0_AUDIENCE=https://api.cloutdotgg.com
```

### 4. Enable Access Tokens (Optional)

To get access tokens for API calls, update your Auth0 Application:

1. Go to **Applications > Your App > APIs**
2. Enable the API you created
3. The frontend will automatically include the access token in API requests

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

> **Note:** Proto code generation happens automatically during builds. Each service's `nixpacks.toml` installs the `buf` CLI and runs `buf generate` before building. The proto files are copied from the parent directory during the build process.

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
