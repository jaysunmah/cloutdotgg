.PHONY: dev db backend frontend install clean

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
install:
	cd backend && go mod download
	cd frontend && npm install

# Stop and clean up
clean:
	docker compose down -v

