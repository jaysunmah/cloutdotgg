.PHONY: dev db backend frontend install clean generate generate-proto generate-sqlc test

# Start everything for development
dev: db backend frontend

# Start PostgreSQL
db:
	docker compose up -d

# Run Go backend
backend:
	cd backend && go run .

# Run Next.js frontend
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

