#!/bin/bash
# Install script for CloutGG development environment
# This script is idempotent and can be run multiple times safely

set -e

# Ensure Go tools are installed (only if not present)
export PATH="$HOME/go/bin:$PATH"

# Install Go development tools if not already installed
if ! command -v sqlc &> /dev/null; then
    echo "Installing sqlc..."
    go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
fi

if ! command -v migrate &> /dev/null; then
    echo "Installing golang-migrate..."
    go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
fi

if ! command -v protoc-gen-go &> /dev/null; then
    echo "Installing protoc-gen-go..."
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
fi

# Install buf CLI if not already installed
if ! command -v buf &> /dev/null; then
    echo "Installing buf CLI..."
    curl -sSL "https://github.com/bufbuild/buf/releases/download/v1.61.0/buf-Linux-x86_64" -o /tmp/buf
    chmod +x /tmp/buf
    sudo mv /tmp/buf /usr/local/bin/buf
fi

# Install backend dependencies
echo "Installing Go dependencies..."
cd /workspace/backend
go mod download

# Install frontend dependencies
echo "Installing Node.js dependencies..."
cd /workspace/frontend
npm install

# Generate code (protobuf and sqlc)
echo "Generating code..."
cd /workspace
make generate

echo "Installation complete!"
