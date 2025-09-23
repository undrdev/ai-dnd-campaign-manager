# Development Environment Setup

## Overview
This document provides comprehensive setup instructions for the D&D AI Campaign Management System development environment, including all required tools, dependencies, and local services.

---

## Prerequisites

### System Requirements
- **OS**: Windows 10/11, macOS 12+, or Ubuntu 20.04+
- **RAM**: Minimum 16GB (32GB recommended for full stack development)
- **Storage**: 50GB+ free space (SSDs recommended)
- **Network**: Stable internet connection for package downloads and AI API calls

### Required Accounts
- **GitHub**: For source code access and version control
- **Docker Hub**: For container image access (optional)
- **OpenAI**: For AI integration testing (API key required)
- **Anthropic**: For Claude AI integration (API key required, optional)

---

## Core Development Tools

### 1. .NET SDK
```bash
# Install .NET 8 SDK (latest LTS)
# Windows (using winget)
winget install Microsoft.DotNet.SDK.8

# macOS (using Homebrew)
brew install --cask dotnet

# Linux (Ubuntu/Debian)
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0

# Verify installation
dotnet --version  # Should show 8.x.x
```

### 2. Node.js and npm
```bash
# Install Node.js 18+ LTS
# Windows (using winget)
winget install OpenJS.NodeJS

# macOS (using Homebrew)
brew install node

# Linux (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or v20.x.x
npm --version   # Should show 9.x.x or 10.x.x
```

### 3. Flutter SDK
```bash
# Download Flutter SDK
# Windows
# Download from https://flutter.dev/docs/get-started/install/windows
# Extract to C:\flutter
# Add C:\flutter\bin to PATH

# macOS
git clone https://github.com/flutter/flutter.git -b stable ~/flutter
export PATH="$PATH:~/flutter/bin"
# Add to ~/.zshrc or ~/.bash_profile

# Linux
git clone https://github.com/flutter/flutter.git -b stable ~/flutter
export PATH="$PATH:~/flutter/bin"
# Add to ~/.bashrc

# Verify installation and check dependencies
flutter --version
flutter doctor
```

### 4. Docker Desktop
```bash
# Install Docker Desktop
# Windows: Download from https://www.docker.com/products/docker-desktop/
# macOS: Download from https://www.docker.com/products/docker-desktop/
# Linux: Use docker engine instead

# Linux (Ubuntu) - Docker Engine
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group (Linux only)
sudo usermod -aG docker $USER
# Log out and back in

# Verify installation
docker --version
docker compose version
```

---

## IDEs and Editors

### Primary IDE: Visual Studio Code
```bash
# Install VS Code
# Windows (using winget)
winget install Microsoft.VisualStudioCode

# macOS (using Homebrew)
brew install --cask visual-studio-code

# Linux (Ubuntu/Debian)
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list
sudo apt update
sudo apt install code
```

#### Required VS Code Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    // C# Development
    "ms-dotnettools.csharp",
    "ms-dotnettools.csdevkit",
    "ms-dotnettools.vscode-dotnet-runtime",
    
    // Flutter Development
    "dart-code.dart-code",
    "dart-code.flutter",
    
    // Database
    "ms-mssql.mssql",
    "ckolkman.vscode-postgres",
    
    // Docker
    "ms-azuretools.vscode-docker",
    
    // Version Control
    "github.vscode-pull-request-github",
    "github.copilot",
    "github.copilot-chat",
    
    // Code Quality
    "sonarsource.sonarlint-vscode",
    "streetsidesoftware.code-spell-checker",
    "esbenp.prettier-vscode",
    
    // Productivity
    "ms-vscode.powershell",
    "redhat.vscode-yaml",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "hashicorp.terraform"
  ]
}
```

#### VS Code Settings
```json
// .vscode/settings.json
{
  "dotnet.defaultSolution": "DnDAICampaignManager.sln",
  "omnisharp.enableEditorConfigSupport": true,
  "omnisharp.enableImportCompletion": true,
  "omnisharp.enableRoslynAnalyzers": true,
  
  "dart.flutterSdkPath": "~/flutter",
  "dart.checkForSdkUpdates": true,
  "dart.previewFlutterUiGuides": true,
  
  "files.exclude": {
    "**/bin": true,
    "**/obj": true,
    "**/.dart_tool": true,
    "**/build": true
  },
  
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  
  "csharp.format.enable": true,
  "csharp.semanticHighlighting.enabled": true
}
```

### Alternative IDEs (Optional)
```bash
# Visual Studio 2022 (Windows only)
# Download from https://visualstudio.microsoft.com/vs/

# JetBrains Rider (Cross-platform, paid)
# Download from https://www.jetbrains.com/rider/

# Android Studio (for Flutter development)
# Download from https://developer.android.com/studio
```

---

## Database Setup

### PostgreSQL Installation
```bash
# Install PostgreSQL 15+
# Windows (using winget)
winget install PostgreSQL.PostgreSQL

# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Linux (Ubuntu/Debian)
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-contrib-15

# Create development database
sudo -u postgres psql -c "CREATE USER dnddev WITH PASSWORD 'devpassword';"
sudo -u postgres psql -c "CREATE DATABASE dndcampaign_dev OWNER dnddev;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dndcampaign_dev TO dnddev;"
```

### Redis Installation
```bash
# Install Redis
# Windows (using winget)
winget install Redis.Redis

# macOS (using Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Configure Redis for development
# Edit /etc/redis/redis.conf (Linux) or /usr/local/etc/redis.conf (macOS)
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

# Start Redis service
sudo systemctl start redis-server  # Linux
redis-server  # macOS/Windows
```

### Database Tools
```bash
# pgAdmin (GUI for PostgreSQL)
# Download from https://www.pgadmin.org/download/

# Redis CLI (comes with Redis)
redis-cli ping  # Should return PONG

# DBeaver (Universal database tool)
# Download from https://dbeaver.io/download/
```

---

## Environment Configuration

### Environment Variables
Create a `.env` file in the project root:

```bash
# .env file for development
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=dndcampaign_dev
DATABASE_USER=dnddev
DATABASE_PASSWORD=devpassword
DATABASE_URL=postgresql://dnddev:devpassword@localhost:5432/dndcampaign_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# JWT
JWT_SECRET_KEY=your_super_secret_jwt_key_for_development_only
JWT_ISSUER=DnDAICampaignManager
JWT_AUDIENCE=DnDAICampaignManager.Client

# Application
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=https://localhost:5001;http://localhost:5000

# Logging
SERILOG_MINIMUM_LEVEL=Debug
SERILOG_WRITE_TO_CONSOLE=true

# Feature Flags
FEATURE_AI_ENABLED=true
FEATURE_REALTIME_ENABLED=true
FEATURE_ANALYTICS_ENABLED=false
```

### User Secrets (Recommended for sensitive data)
```bash
# Initialize user secrets for each project
cd src/Services/CampaignService/CampaignService.API
dotnet user-secrets init
dotnet user-secrets set "OpenAI:ApiKey" "your_actual_openai_key"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your_actual_connection_string"

cd ../../../AIGateway/AIGateway.API
dotnet user-secrets init
dotnet user-secrets set "OpenAI:ApiKey" "your_actual_openai_key"
dotnet user-secrets set "Anthropic:ApiKey" "your_actual_anthropic_key"
```

---

## Docker Development Environment

### Docker Compose Configuration
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: dnd-postgres-dev
    environment:
      POSTGRES_DB: dndcampaign_dev
      POSTGRES_USER: dnddev
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/database/init:/docker-entrypoint-initdb.d
    networks:
      - dnd-dev-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: dnd-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    networks:
      - dnd-dev-network

  # pgAdmin (Database GUI)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: dnd-pgadmin-dev
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@dndcampaign.dev
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - dnd-dev-network

  # Redis Commander (Redis GUI)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: dnd-redis-commander-dev
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis
    networks:
      - dnd-dev-network

volumes:
  postgres_data:
  redis_data:

networks:
  dnd-dev-network:
    driver: bridge
```

### Development Scripts
```bash
# scripts/dev-setup.sh
#!/bin/bash
set -e

echo "Setting up D&D AI Campaign Manager development environment..."

# Start Docker services
echo "Starting Docker services..."
docker compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec dnd-postgres-dev pg_isready -U dnddev -d dndcampaign_dev; do
  sleep 1
done

# Run database migrations
echo "Running database migrations..."
cd src/Services/CampaignService/CampaignService.API
dotnet ef database update

# Install .NET dependencies
echo "Restoring .NET packages..."
cd ../../../../
dotnet restore

# Install Flutter dependencies
echo "Getting Flutter packages..."
cd src/Client/dnd_campaign_manager
flutter pub get

echo "Development environment setup complete!"
echo "Services available at:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - pgAdmin: http://localhost:5050 (admin@dndcampaign.dev/admin)"
echo "  - Redis Commander: http://localhost:8081"
```

```bash
# scripts/dev-start.sh
#!/bin/bash
set -e

echo "Starting D&D AI Campaign Manager development services..."

# Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# Start .NET services in background
echo "Starting .NET services..."
cd src/Services/CampaignService/CampaignService.API
dotnet run --urls "https://localhost:5001" &
CAMPAIGN_PID=$!

cd ../../../CharacterService/CharacterService.API
dotnet run --urls "https://localhost:5002" &
CHARACTER_PID=$!

cd ../../../AIGateway/AIGateway.API
dotnet run --urls "https://localhost:5003" &
AI_PID=$!

cd ../../../Gateway/APIGateway
dotnet run --urls "https://localhost:5000" &
GATEWAY_PID=$!

# Start Flutter app
echo "Starting Flutter app..."
cd ../../Client/dnd_campaign_manager
flutter run -d chrome --web-port 3000 &
FLUTTER_PID=$!

echo "All services started!"
echo "API Gateway: https://localhost:5000"
echo "Flutter Web: http://localhost:3000"

# Wait for Ctrl+C
trap 'kill $CAMPAIGN_PID $CHARACTER_PID $AI_PID $GATEWAY_PID $FLUTTER_PID; docker compose -f docker-compose.dev.yml down' SIGINT
wait
```

---

## Development Workflow

### Project Structure Verification
```bash
# Verify project structure
ls -la
# Should see:
# - src/
# - tests/
# - infrastructure/
# - docs/
# - scripts/

# Navigate to solution root
cd DnDAICampaignManager/

# Verify solution builds
dotnet build

# Run tests
dotnet test

# Check Flutter setup
cd src/Client/dnd_campaign_manager
flutter doctor
flutter analyze
```

### Git Configuration
```bash
# Configure Git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up Git hooks for the project
cd .git/hooks
# Create pre-commit hook
cat > pre-commit << 'EOF'
#!/bin/sh
# Run .NET formatting
dotnet format --no-restore --verbosity quiet
# Run Flutter formatting
cd src/Client/dnd_campaign_manager && flutter format . && cd -
# Run tests
dotnet test --no-build --verbosity quiet
EOF
chmod +x pre-commit
```

### Hot Reload Setup
```bash
# .NET hot reload (automatically enabled in .NET 6+)
dotnet watch run --project src/Services/CampaignService/CampaignService.API

# Flutter hot reload (automatically enabled)
cd src/Client/dnd_campaign_manager
flutter run -d chrome
# Press 'r' for hot reload, 'R' for hot restart
```

---

## Debugging Configuration

### Launch Configuration (VS Code)
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Campaign API",
      "type": "coreclr",
      "request": "launch",
      "program": "${workspaceFolder}/src/Services/CampaignService/CampaignService.API/bin/Debug/net8.0/CampaignService.API.dll",
      "args": [],
      "cwd": "${workspaceFolder}/src/Services/CampaignService/CampaignService.API",
      "console": "internalConsole",
      "stopAtEntry": false,
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    {
      "name": "Launch AI Gateway",
      "type": "coreclr",
      "request": "launch",
      "program": "${workspaceFolder}/src/Services/AIGateway/AIGateway.API/bin/Debug/net8.0/AIGateway.API.dll",
      "args": [],
      "cwd": "${workspaceFolder}/src/Services/AIGateway/AIGateway.API",
      "console": "internalConsole",
      "stopAtEntry": false,
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    {
      "name": "Flutter: Debug",
      "type": "dart",
      "request": "launch",
      "program": "${workspaceFolder}/src/Client/dnd_campaign_manager/lib/main.dart"
    }
  ],
  "compounds": [
    {
      "name": "Launch All Services",
      "configurations": [
        "Launch Campaign API",
        "Launch AI Gateway"
      ]
    }
  ]
}
```

### Tasks Configuration
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build-dotnet",
      "command": "dotnet",
      "type": "process",
      "args": ["build"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "silent",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": "$msCompile"
    },
    {
      "label": "test-dotnet",
      "command": "dotnet",
      "type": "process",
      "args": ["test"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": "$msCompile"
    },
    {
      "label": "flutter-build",
      "command": "flutter",
      "type": "process",
      "args": ["build", "web"],
      "options": {
        "cwd": "${workspaceFolder}/src/Client/dnd_campaign_manager"
      },
      "group": "build"
    },
    {
      "label": "start-infrastructure",
      "command": "docker",
      "type": "process",
      "args": ["compose", "-f", "docker-compose.dev.yml", "up", "-d"],
      "group": "build"
    }
  ]
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs dnd-postgres-dev

# Reset PostgreSQL data
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d postgres

# Test connection
psql -h localhost -U dnddev -d dndcampaign_dev -c "SELECT version();"
```

#### .NET Build Issues
```bash
# Clean and rebuild
dotnet clean
dotnet restore
dotnet build

# Clear NuGet cache
dotnet nuget locals all --clear

# Update tools
dotnet tool update -g dotnet-ef
```

#### Flutter Issues
```bash
# Check Flutter installation
flutter doctor

# Clean Flutter cache
flutter clean
flutter pub get

# Fix common Flutter issues
flutter pub cache repair
dart pub cache clean
```

### Performance Optimization
```bash
# Enable BuildKit for faster Docker builds
export DOCKER_BUILDKIT=1

# Use SSD for Docker volumes (Windows/Mac)
# Configure Docker Desktop to use SSD location

# Increase Docker memory allocation
# Docker Desktop -> Settings -> Resources -> Memory -> 8GB+
```

---

## Verification Checklist

After completing the setup, verify everything works:

- [ ] .NET SDK installed and `dotnet --version` works
- [ ] Node.js installed and `npm --version` works  
- [ ] Flutter installed and `flutter doctor` shows no issues
- [ ] Docker installed and `docker --version` works
- [ ] PostgreSQL container starts and accepts connections
- [ ] Redis container starts and `redis-cli ping` returns PONG
- [ ] VS Code opens project without errors
- [ ] Solution builds with `dotnet build`
- [ ] Tests run with `dotnet test`
- [ ] Flutter app builds with `flutter build web`
- [ ] All environment variables are set correctly
- [ ] Database migrations run successfully
- [ ] Hot reload works for both .NET and Flutter

This development environment setup ensures all team members have a consistent, fully-functional development experience.