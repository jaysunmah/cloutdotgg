#!/bin/bash
# Start Docker daemon with vfs storage driver
# This is needed in this VM environment due to overlay filesystem limitations

# Check if Docker daemon is already running
if sudo docker info > /dev/null 2>&1; then
    echo "Docker is already running"
    exit 0
fi

# Start Docker daemon with vfs storage driver in background
echo "Starting Docker daemon with vfs storage driver..."
sudo dockerd --storage-driver=vfs > /dev/null 2>&1 &

# Wait for Docker to be ready
echo "Waiting for Docker to be ready..."
for i in {1..30}; do
    if sudo docker info > /dev/null 2>&1; then
        echo "Docker is ready!"
        exit 0
    fi
    sleep 1
done

echo "Error: Docker failed to start"
exit 1
