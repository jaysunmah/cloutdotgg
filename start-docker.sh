#!/bin/bash

# Docker startup script for non-systemd environments
# This script starts the Docker daemon in the background

echo "Starting Docker daemon..."

# Check if Docker is already running
if pgrep -x "dockerd" > /dev/null; then
    echo "Docker is already running"
    exit 0
fi

# Clean up any stale runtime directories
sudo rm -rf /var/run/docker /var/run/containerd 2>/dev/null

# Start Docker daemon in background
sudo dockerd > /tmp/dockerd.log 2>&1 &

# Wait for Docker to start
echo "Waiting for Docker to initialize..."
sleep 5

# Check if Docker started successfully
if pgrep -x "dockerd" > /dev/null; then
    echo "Docker started successfully!"
    echo "Docker version: $(docker --version)"
    echo ""
    echo "You can now use Docker commands with sudo, e.g.:"
    echo "  sudo docker ps"
    echo "  sudo docker run hello-world"
    echo ""
    echo "Or use Docker without sudo (requires re-login or newgrp):"
    echo "  newgrp docker"
else
    echo "Failed to start Docker. Check logs at /tmp/dockerd.log"
    exit 1
fi
