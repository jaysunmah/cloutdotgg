.PHONY: dev db backend frontend install clean clean-all generate generate-proto generate-sqlc test docker-up docker-up-d docker-down docker-build docker-logs

# Start everything for local development (requires local Go/Node installed)
dev: db backend frontend

# Start all services via Docker Compose (db, backend, frontend)
docker-up:
	docker compose up --build

# Start all services in detached mode
docker-up-d:
	docker compose up --build -d

# Stop all Docker services
docker-down:
	docker compose down

# Build Docker images without starting
docker-build:
	docker compose build

# View logs from all services
docker-logs:
	docker compose logs -f

# View logs from specific service (usage: make docker-logs-backend)
docker-logs-%:
	docker compose logs -f $*

# Start PostgreSQL only (for local development)
db:
	docker compose up -d db

# Run Go backend locally
backend:
	cd backend && go run .

# Run Next.js frontend locally
frontend:
	cd frontend && npm run dev

# Install all dependencies
install: install-tools
	cd backend && go mod download
	cd frontend && npm install

# Install development tools
install-tools:
	@echo "Installing development tools..."
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@echo "Tools installed."

# Stop and clean up
clean:
	docker compose down -v
	rm -rf backend/internal/gen
	rm -rf frontend/src/lib/gen

# Full cleanup including Docker images
clean-all: clean
	docker compose down -v --rmi local

# Generate all code
generate: generate-proto generate-sqlc

# Generate protobuf code using buf
generate-proto:
	@echo "Generating protobuf code..."
	@mkdir -p backend/internal/gen frontend/src/lib/gen
	buf generate proto
	@echo "Protobuf code generated."

# Generate sqlc database code
generate-sqlc:
	@echo "Generating sqlc code..."
	cd backend && sqlc generate
	@echo "sqlc code generated."

# Run all tests
test: test-backend test-frontend

# Run backend tests
test-backend:
	cd backend && go test ./... -v

# Run frontend type checking
test-frontend:
	cd frontend && npx tsc --noEmit

# Lint proto files
lint-proto:
	buf lint proto

# Format proto files
format-proto:
	buf format -w proto

# Database migrations (requires DATABASE_URL)
migrate-up:
	migrate -path backend/db/migrations -database "$$DATABASE_URL" up

migrate-down:
	migrate -path backend/db/migrations -database "$$DATABASE_URL" down

migrate-create:
	@read -p "Migration name: " name; \
	migrate create -ext sql -dir backend/db/migrations -seq $$name

