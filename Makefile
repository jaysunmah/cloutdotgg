.PHONY: dev db backend frontend install clean proto proto-go proto-ts

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

# Generate all protobuf code
proto: proto-go proto-ts

# Generate Go protobuf code
proto-go:
	@echo "Generating Go protobuf code..."
	@mkdir -p backend/internal/pb
	protoc \
		--go_out=backend/internal/pb \
		--go_opt=paths=source_relative \
		-I=proto \
		proto/api.proto
	@echo "Go protobuf code generated in backend/internal/pb/"

# Generate TypeScript protobuf code
proto-ts:
	@echo "Generating TypeScript protobuf code..."
	@mkdir -p frontend/src/lib/proto
	protoc \
		--plugin=frontend/node_modules/.bin/protoc-gen-ts_proto \
		--ts_proto_out=frontend/src/lib/proto \
		--ts_proto_opt=esModuleInterop=true \
		--ts_proto_opt=outputJsonMethods=true \
		--ts_proto_opt=outputEncodeMethods=true \
		--ts_proto_opt=outputClientImpl=false \
		-I=proto \
		proto/api.proto
	@echo "TypeScript protobuf code generated in frontend/src/lib/proto/"

# Install protobuf tools
install-proto-tools:
	@echo "Installing protobuf tools..."
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	cd frontend && npm install ts-proto @bufbuild/protobuf
	@echo "Protobuf tools installed."

