# CloutGG

Full-stack webapp with **Go** backend, **PostgreSQL** database, and **Next.js** frontend.

## Project Structure

```
.
├── backend/               # Go API server
│   ├── internal/
│   │   ├── api/          # HTTP handlers and routing
│   │   └── db/           # Database connection
│   ├── migrations/       # SQL migrations
│   ├── go.mod
│   └── main.go
├── frontend/             # Next.js app
│   ├── src/app/         # App router pages
│   ├── package.json
│   └── ...
├── docker-compose.yml    # PostgreSQL container
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

