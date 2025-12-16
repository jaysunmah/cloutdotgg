# CloutGG

Full‑stack web app with a **Go** backend, **PostgreSQL**, and a **Next.js** frontend. The frontend talks to the backend via **Connect RPC** (type-safe, protobuf-backed) and the backend uses **sqlc** for type-safe database queries.

## Architecture

```
┌─────────────┐     Connect RPC      ┌─────────────┐
│   Next.js   │ ◄──────────────────► │   Go API    │
│  Frontend   │     (HTTP + JSON)    │   Server    │
└─────────────┘                      └──────┬──────┘
                                            │
                                     ┌──────▼──────┐
                                     │ PostgreSQL  │
                                     │  Database   │
                                     └─────────────┘
```

## Repo layout

```
.
├── proto/                      # Protobuf module (buf)
│   └── apiv1/api.proto          # RPC service + messages
├── backend/                     # Go API server
│   ├── db/migrations/           # golang-migrate *.up.sql / *.down.sql
│   ├── internal/
│   │   ├── db/sqlc/             # sqlc query definitions + generated code
│   │   └── service/             # RPC implementations
│   └── internal/gen/            # Generated protobuf/connect-go code (not committed)
├── frontend/                    # Next.js app
│   └── src/lib/gen/             # Generated protobuf/connect-es code (not committed)
├── buf.gen.yaml                 # Shared buf generation template
├── docker-compose.yml           # Local Postgres (port 5434)
└── Makefile                     # Common dev commands
```

> Generated code under `backend/internal/gen/` and `frontend/src/lib/gen/` is **not committed**. Run `make generate` after cloning.

## Prerequisites

- **Go**: 1.22+ (see `backend/go.mod`)
- **Node.js**: 20+ (frontend uses Node 20 in `Dockerfile.frontend`)
- **Docker**: for local PostgreSQL
- **Buf CLI**: required for `make generate-proto`
  - Install: [Buf installation](https://buf.build/docs/installation)

Optional (only if you want to run DB migrations locally):
- **golang-migrate** CLI (`migrate`)

## Quickstart (local dev)

### 1) Install dependencies

```bash
make install
```

### 2) Generate code (protobuf + sqlc)

```bash
make generate
```

### 3) Start PostgreSQL

```bash
docker compose up -d
```

Postgres is exposed on **localhost:5434**.

### 4) Run the backend

```bash
# in one terminal
make backend
```

Backend defaults:
- `PORT=8080`
- `DATABASE_URL=postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable`

### 5) Run the frontend

```bash
# in a second terminal
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Environment variables

### Backend

- **`DATABASE_URL`**: PostgreSQL connection string
- **`PORT`**: server port (default `8080`)

The backend will load `.env` files if present (repo root or `backend/.env`).

### Frontend

- **`NEXT_PUBLIC_API_URL`**: backend base URL (default `http://localhost:8080`)

### Auth0 (required for protected routes)

The app protects `'/vote'` and `'/leaderboard'` via Auth0 middleware.

Set the standard `@auth0/nextjs-auth0` variables in `frontend/.env.local` (or your deployment env):

```bash
AUTH0_SECRET=...
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_DOMAIN
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
```

## Migrations

Migrations live in `backend/db/migrations/` and use **golang-migrate** naming (`*.up.sql` / `*.down.sql`).

To apply migrations locally:

```bash
export DATABASE_URL='postgres://postgres:postgres@localhost:5434/cloutgg?sslmode=disable'
make migrate-up
```

> `make migrate-up` requires the `migrate` CLI to be installed.

## Proto / API changes

- Edit: `proto/apiv1/api.proto`
- Regenerate clients/servers:

```bash
make generate-proto
```

## Useful commands

- **Install deps**: `make install`
- **Generate everything**: `make generate`
- **Start DB**: `make db`
- **Run backend**: `make backend`
- **Run frontend**: `make frontend`
- **Typecheck + tests**: `make test`

> `make dev` runs `db`, then starts the backend in the foreground. Run backend + frontend in separate terminals (or use `make -j` if you prefer parallel make).

## Deployment (Railway)

This repo includes Dockerfiles for Railway:
- `Dockerfile.backend`
- `Dockerfile.frontend`

High level:
- **Database**: add a Railway PostgreSQL plugin and use its `DATABASE_URL` for the backend.
- **Backend service**: build with `Dockerfile.backend` and set `DATABASE_URL`.
- **Frontend service**: build with `Dockerfile.frontend` and set:
  - `NEXT_PUBLIC_API_URL` to your backend public URL
  - Auth0 environment variables

## Troubleshooting

- **Docker won’t start (this VM)**: run `./start-docker.sh` first.
- **Missing generated code errors**: run `make generate`.
- **DB connection fails**: confirm Postgres is on `localhost:5434` (not `5432`).
