#!/bin/bash
# Start Docker daemon if not already running
if ! docker ps >/dev/null 2>&1; then
    echo "Starting Docker daemon..."
    sudo dockerd > /tmp/dockerd.log 2>&1 &
    sleep 5
    sudo chmod 666 /var/run/docker.sock
    echo "Docker daemon started."
else
    echo "Docker daemon is already running."
fi
