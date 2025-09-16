#!/bin/bash
set -e

REPO="https://github.com/yourname/docker-app.git"  # <-- change to your repo URL if you host it
APPDIR="docker-app"

echo "Updating apt..."
sudo apt-get update -y

# Install docker if not present
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  sudo apt-get install -y ca-certificates curl gnupg lsb-release
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io
fi

# Install docker compose plugin if not present (docker compose v2)
if ! docker compose version >/dev/null 2>&1; then
  echo "Installing docker compose plugin..."
  sudo apt-get install -y docker-compose-plugin
fi

# Clone repo
if [ -d "$APPDIR" ]; then
  echo "Directory $APPDIR exists, pulling latest"
  cd $APPDIR
  git pull || true
else
  echo "Cloning repo..."
  git clone "$REPO" "$APPDIR"
  cd "$APPDIR"
fi

# Start containers
echo "Starting docker compose..."
docker compose up --build -d

echo "Done. Visit: https://docker-app1.hcann.com (make sure DNS A record points to this droplet IP)."
