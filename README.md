# CloutGG

Full-stack webapp with **Go** backend, **PostgreSQL** database, and **Next.js** frontend. Supports **Protocol Buffers** for efficient data serialization.

## Project Structure

```
.
├── proto/                 # Protocol Buffer definitions
│   └── api.proto          # API message definitions
├── backend/               # Go API server
│   ├── internal/
│   │   ├── api/          # HTTP handlers and routing
│   │   ├── db/           # Database connection
│   │   └── pb/           # Generated protobuf Go code
│   ├── migrations/       # SQL migrations
│   ├── go.mod
│   └── main.go
├── frontend/             # Next.js app
│   ├── src/
│   │   ├── app/         # App router pages
│   │   └── lib/
│   │       ├── api.ts    # API client (supports JSON & protobuf)
│   │       └── proto/    # Generated protobuf TypeScript code
│   ├── package.json
│   └── ...
├── docker-compose.yml    # PostgreSQL container
├── Makefile              # Build automation
└── README.md
```

## Prerequisites

- [Go 1.22+](https://golang.org/dl/)
- [Node.js 20+](https://nodejs.org/)
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 and automatically runs the initial migration.

### 2. Start the Go Backend

```bash
cd backend
go mod download
go run .
```

The API server runs on http://localhost:8080

### 3. Start the Next.js Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:3000

## API Endpoints

| Method | Endpoint        | Description      |
| ------ | --------------- | ---------------- |
| GET    | `/health`       | Health check     |
| GET    | `/api/users`    | List all users   |
| POST   | `/api/users`    | Create a user    |
| GET    | `/api/users/:id`| Get user by ID   |

### Example: Create a User

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cloutgg?sslmode=disable

# Backend
PORT=8080

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Development

### Reset Database

```bash
docker compose down -v
docker compose up -d
```

### Build for Production

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

## Tech Stack

- **Backend:** Go 1.22, Chi router, pgx (PostgreSQL driver)
- **Database:** PostgreSQL 16
- **Frontend:** Next.js 15, React 18, Tailwind CSS, TypeScript
- **Serialization:** Protocol Buffers (with JSON fallback)

## Protocol Buffers

This project uses Protocol Buffers for efficient data serialization between the frontend and backend. The API supports both JSON and protobuf formats based on the `Content-Type` and `Accept` headers.

### Prerequisites for Protobuf

- [protoc](https://grpc.io/docs/protoc-installation/) (Protocol Buffer Compiler)
- Go protobuf plugin: `go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`
- TypeScript protobuf plugin: `npm install ts-proto @bufbuild/protobuf` (in frontend)

### Generate Protobuf Code

Regenerate protobuf code after modifying `proto/api.proto`:

```bash
# Generate both Go and TypeScript code
make proto

# Generate only Go code
make proto-go

# Generate only TypeScript code
make proto-ts

# Or from the frontend directory
cd frontend && npm run proto
```

### Using Protobuf

**Backend (Go):**
The API automatically negotiates the response format based on the `Accept` header:
- `Accept: application/x-protobuf` → Returns protobuf-encoded response
- `Accept: application/json` (or no header) → Returns JSON response

For requests with a body, the `Content-Type` header determines the expected format:
- `Content-Type: application/x-protobuf` → Expects protobuf-encoded body
- `Content-Type: application/json` → Expects JSON body

**Frontend (TypeScript):**
Set the environment variable to enable protobuf:
```bash
NEXT_PUBLIC_USE_PROTOBUF=true
```

The API client in `src/lib/api.ts` will automatically use protobuf when enabled, with JSON as the fallback.

### Protobuf Message Definitions

All message types are defined in `proto/api.proto`. Key messages include:

- `Company` - AI company with rankings and metadata
- `VoteRequest` / `VoteResponse` - Voting requests and responses
- `MatchupPair` - Two companies for head-to-head voting
- `LeaderboardResponse` - Paginated leaderboard data
- `StatsResponse` - Platform statistics
- `CompanyRating` / `AggregatedRating` - Company ratings
- `CompanyComment` / `CommentList` - Company comments

## Deploy to Railway (Recommended)

Railway supports Go, Next.js, and PostgreSQL out of the box.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create cloutdotgg --public --push
```

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `cloutdotgg` repo

**Add PostgreSQL:**
- Click **"+ New"** → **"Database"** → **"PostgreSQL"**
- Copy the `DATABASE_URL` from the Postgres service

**Deploy Backend:**
- Click **"+ New"** → **"GitHub Repo"** → Select repo
- Set **Root Directory** to `backend`
- Add environment variable: `DATABASE_URL` = (paste from Postgres)
- Railway will auto-detect Go and deploy

**Deploy Frontend:**
- Click **"+ New"** → **"GitHub Repo"** → Select repo
- Set **Root Directory** to `frontend`
- Add environment variable: `NEXT_PUBLIC_API_URL` = (your backend URL, e.g., `https://backend-xxx.railway.app`)
- Railway will auto-detect Next.js and deploy

### 3. Run Database Migration

In Railway, open the backend service terminal and run:
```bash
psql $DATABASE_URL -f /app/migrations/001_init.sql
```

Or connect to the Postgres service directly and run the SQL.

That's it! Your app is live 🚀

