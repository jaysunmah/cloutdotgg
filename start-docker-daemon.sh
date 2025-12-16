#!/bin/bash
# Start Docker daemon with vfs storage driver (required for this VM environment)
# This script is needed because the VM doesn't use systemd

set -e

# Check if Docker daemon is already running
if sudo docker ps >/dev/null 2>&1; then
    echo "Docker daemon is already running"
    exit 0
fi

# Remove stale PID file if it exists
sudo rm -f /var/run/docker.pid

# Start Docker daemon in the background with vfs storage driver
echo "Starting Docker daemon with vfs storage driver..."
sudo dockerd --storage-driver=vfs > /tmp/dockerd.log 2>&1 &

# Wait for Docker to be ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if sudo docker ps >/dev/null 2>&1; then
        echo "Docker daemon is ready"
        exit 0
    fi
    echo "Waiting for Docker daemon to start... ($((attempt + 1))/$max_attempts)"
    sleep 1
    attempt=$((attempt + 1))
done

echo "Failed to start Docker daemon"
exit 1
