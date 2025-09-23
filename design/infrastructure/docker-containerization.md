# Docker Containerization Specifications

## Overview
This document provides comprehensive Docker containerization specifications for the D&D AI Campaign Management System. It covers multi-stage builds, optimization strategies, security hardening, and development workflows that align with the microservices architecture.

## Container Architecture Strategy

### Base Image Standards
All services follow a consistent base image strategy for security, performance, and maintainability:

```dockerfile
# Production base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Build base image
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Runtime user setup
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --shell /bin/false appuser
```

### Multi-Stage Build Pattern
Each microservice follows this optimized build pattern:

```dockerfile
# Example: Campaign Service Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --shell /bin/false appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy solution and project files first (for layer caching)
COPY ["src/Services/CampaignService/CampaignService.Api/CampaignService.Api.csproj", "src/Services/CampaignService/CampaignService.Api/"]
COPY ["src/Services/CampaignService/CampaignService.Application/CampaignService.Application.csproj", "src/Services/CampaignService/CampaignService.Application/"]
COPY ["src/Services/CampaignService/CampaignService.Domain/CampaignService.Domain.csproj", "src/Services/CampaignService/CampaignService.Domain/"]
COPY ["src/Services/CampaignService/CampaignService.Infrastructure/CampaignService.Infrastructure.csproj", "src/Services/CampaignService/CampaignService.Infrastructure/"]
COPY ["src/Shared/DnDAI.Shared.Kernel/DnDAI.Shared.Kernel.csproj", "src/Shared/DnDAI.Shared.Kernel/"]

# Restore dependencies
RUN dotnet restore "src/Services/CampaignService/CampaignService.Api/CampaignService.Api.csproj"

# Copy source code
COPY . .
WORKDIR "/src/src/Services/CampaignService/CampaignService.Api"

# Build application
RUN dotnet build "CampaignService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build --no-restore

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "CampaignService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy published application
COPY --from=publish /app/publish .

# Set ownership and permissions
RUN chown -R appuser:appgroup /app && \
    chmod -R 755 /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "CampaignService.Api.dll"]
```

## Service-Specific Dockerfiles

### 1. Campaign Service
```dockerfile
# src/Services/CampaignService/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --shell /bin/false appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files for dependency restoration
COPY ["src/Services/CampaignService/CampaignService.Api/CampaignService.Api.csproj", "src/Services/CampaignService/CampaignService.Api/"]
COPY ["src/Services/CampaignService/CampaignService.Application/CampaignService.Application.csproj", "src/Services/CampaignService/CampaignService.Application/"]
COPY ["src/Services/CampaignService/CampaignService.Domain/CampaignService.Domain.csproj", "src/Services/CampaignService/CampaignService.Domain/"]
COPY ["src/Services/CampaignService/CampaignService.Infrastructure/CampaignService.Infrastructure.csproj", "src/Services/CampaignService/CampaignService.Infrastructure/"]
COPY ["src/Shared/DnDAI.Shared.Kernel/DnDAI.Shared.Kernel.csproj", "src/Shared/DnDAI.Shared.Kernel/"]

RUN dotnet restore "src/Services/CampaignService/CampaignService.Api/CampaignService.Api.csproj"

COPY . .
WORKDIR "/src/src/Services/CampaignService/CampaignService.Api"
RUN dotnet build "CampaignService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build --no-restore

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "CampaignService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app

# Install health check dependencies
RUN apk add --no-cache curl

COPY --from=publish /app/publish .

# Set permissions
RUN chown -R appuser:appgroup /app && chmod -R 755 /app

USER appuser

# Campaign service specific health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health/ready || exit 1

ENTRYPOINT ["dotnet", "CampaignService.Api.dll"]
```

### 2. Character Service (with D&D Rule Engine)
```dockerfile
# src/Services/CharacterService/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --shell /bin/false appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files
COPY ["src/Services/CharacterService/CharacterService.Api/CharacterService.Api.csproj", "src/Services/CharacterService/CharacterService.Api/"]
COPY ["src/Services/CharacterService/CharacterService.Application/CharacterService.Application.csproj", "src/Services/CharacterService/CharacterService.Application/"]
COPY ["src/Services/CharacterService/CharacterService.Domain/CharacterService.Domain.csproj", "src/Services/CharacterService/CharacterService.Domain/"]
COPY ["src/Services/CharacterService/CharacterService.Infrastructure/CharacterService.Infrastructure.csproj", "src/Services/CharacterService/CharacterService.Infrastructure/"]
COPY ["src/Shared/DnDAI.Shared.Kernel/DnDAI.Shared.Kernel.csproj", "src/Shared/DnDAI.Shared.Kernel/"]

RUN dotnet restore "src/Services/CharacterService/CharacterService.Api/CharacterService.Api.csproj"

COPY . .

# Copy D&D 5e rule data files
COPY ["data/dnd5e/", "/app/data/dnd5e/"]

WORKDIR "/src/src/Services/CharacterService/CharacterService.Api"
RUN dotnet build "CharacterService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build --no-restore

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "CharacterService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=publish /app/publish .
COPY --from=build /app/data ./data

# Create data directory with proper permissions
RUN mkdir -p /app/data/dnd5e && \
    chown -R appuser:appgroup /app && \
    chmod -R 755 /app

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health/ready || exit 1

ENTRYPOINT ["dotnet", "CharacterService.Api.dll"]
```

### 3. AI Gateway Service (with AI Provider Support)
```dockerfile
# src/Services/AIGatewayService/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --shell /bin/false appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/Services/AIGatewayService/AIGatewayService.Api/AIGatewayService.Api.csproj", "src/Services/AIGatewayService/AIGatewayService.Api/"]
COPY ["src/Services/AIGatewayService/AIGatewayService.Application/AIGatewayService.Application.csproj", "src/Services/AIGatewayService/AIGatewayService.Application/"]
COPY ["src/Services/AIGatewayService/AIGatewayService.Domain/AIGatewayService.Domain.csproj", "src/Services/AIGatewayService/AIGatewayService.Domain/"]
COPY ["src/Services/AIGatewayService/AIGatewayService.Infrastructure/AIGatewayService.Infrastructure.csproj", "src/Services/AIGatewayService/AIGatewayService.Infrastructure/"]
COPY ["src/Shared/DnDAI.Shared.Kernel/DnDAI.Shared.Kernel.csproj", "src/Shared/DnDAI.Shared.Kernel/"]

RUN dotnet restore "src/Services/AIGatewayService/AIGatewayService.Api/AIGatewayService.Api.csproj"

COPY . .

# Copy AI prompt templates and configuration
COPY ["templates/ai/", "/app/templates/ai/"]

WORKDIR "/src/src/Services/AIGatewayService/AIGatewayService.Api"
RUN dotnet build "AIGatewayService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build --no-restore

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "AIGatewayService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app

# Install additional dependencies for AI processing
RUN apk add --no-cache curl ca-certificates

COPY --from=publish /app/publish .
COPY --from=build /app/templates ./templates

# Create cache and temp directories
RUN mkdir -p /app/cache /app/temp && \
    chown -R appuser:appgroup /app && \
    chmod -R 755 /app

USER appuser

# AI Gateway specific health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health/ready || exit 1

ENTRYPOINT ["dotnet", "AIGatewayService.Api.dll"]
```

### 4. Real-time Service (with SignalR)
```dockerfile
# src/Services/RealtimeService/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --shell /bin/false appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/Services/RealtimeService/RealtimeService.Api/RealtimeService.Api.csproj", "src/Services/RealtimeService/RealtimeService.Api/"]
COPY ["src/Services/RealtimeService/RealtimeService.Application/RealtimeService.Application.csproj", "src/Services/RealtimeService/RealtimeService.Application/"]
COPY ["src/Services/RealtimeService/RealtimeService.Domain/RealtimeService.Domain.csproj", "src/Services/RealtimeService/RealtimeService.Domain/"]
COPY ["src/Services/RealtimeService/RealtimeService.Infrastructure/RealtimeService.Infrastructure.csproj", "src/Services/RealtimeService/RealtimeService.Infrastructure/"]
COPY ["src/Shared/DnDAI.Shared.Kernel/DnDAI.Shared.Kernel.csproj", "src/Shared/DnDAI.Shared.Kernel/"]

RUN dotnet restore "src/Services/RealtimeService/RealtimeService.Api/RealtimeService.Api.csproj"

COPY . .
WORKDIR "/src/src/Services/RealtimeService/RealtimeService.Api"
RUN dotnet build "RealtimeService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build --no-restore

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "RealtimeService.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=publish /app/publish .

RUN chown -R appuser:appgroup /app && chmod -R 755 /app

USER appuser

# Real-time service specific health check (includes SignalR)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health/ready || exit 1

ENTRYPOINT ["dotnet", "RealtimeService.Api.dll"]
```

### 5. API Gateway (YARP)
```dockerfile
# src/Gateway/APIGateway/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --shell /bin/false appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/Gateway/APIGateway/APIGateway.csproj", "src/Gateway/APIGateway/"]
COPY ["src/Shared/DnDAI.Shared.Kernel/DnDAI.Shared.Kernel.csproj", "src/Shared/DnDAI.Shared.Kernel/"]

RUN dotnet restore "src/Gateway/APIGateway/APIGateway.csproj"

COPY . .
WORKDIR "/src/src/Gateway/APIGateway"
RUN dotnet build "APIGateway.csproj" -c $BUILD_CONFIGURATION -o /app/build --no-restore

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "APIGateway.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=publish /app/publish .

RUN chown -R appuser:appgroup /app && chmod -R 755 /app

USER appuser

# Gateway specific health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health/ready || exit 1

ENTRYPOINT ["dotnet", "APIGateway.dll"]
```

### 6. Flutter Web Application
```dockerfile
# src/Client/Flutter/Dockerfile
FROM cirrusci/flutter:3.16.0 AS build

WORKDIR /app

# Copy pubspec files
COPY pubspec.yaml pubspec.lock ./

# Get dependencies
RUN flutter pub get

# Copy source code
COPY . .

# Build for web
RUN flutter build web --release --web-renderer html

# Production stage
FROM nginx:alpine AS final

# Copy built web app
COPY --from=build /app/build/web /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --shell /bin/false appuser

# Set permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d

RUN touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

## Database Containers

### PostgreSQL with Extensions
```dockerfile
# infrastructure/postgres/Dockerfile
FROM postgres:16-alpine

# Install additional extensions
RUN apk add --no-cache \
    postgresql-contrib \
    postgresql-dev \
    build-base \
    git

# Install pgvector extension
RUN cd /tmp && \
    git clone https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make && \
    make install

# Copy initialization scripts
COPY init-scripts/ /docker-entrypoint-initdb.d/

# Set proper permissions
RUN chmod -R 755 /docker-entrypoint-initdb.d/

EXPOSE 5432

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1
```

### Secure Redis with TLS and Authentication
```dockerfile
# infrastructure/redis/Dockerfile
FROM redis:7-alpine

# Install security tools
RUN apk add --no-cache openssl

# Copy custom Redis configuration
COPY redis.conf /etc/redis/redis.conf
COPY redis-tls.conf /etc/redis/redis-tls.conf
COPY generate-certs.sh /usr/local/bin/
COPY entrypoint.sh /usr/local/bin/

# Create non-root user
RUN addgroup --system --gid 1001 redis && \
    adduser --system --uid 1001 --ingroup redis --shell /bin/false redis

# Create directories for certificates and data
RUN mkdir -p /etc/redis/certs /data/redis && \
    chown -R redis:redis /etc/redis /data/redis

# Set permissions
RUN chmod +x /usr/local/bin/generate-certs.sh /usr/local/bin/entrypoint.sh

USER redis

EXPOSE 6379 6380

# Health check with AUTH support
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD redis-cli --tls --cert /etc/redis/certs/redis.crt --key /etc/redis/certs/redis.key --cacert /etc/redis/certs/ca.crt -a "$REDIS_PASSWORD" ping || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["redis-server", "/etc/redis/redis-tls.conf"]
```

### Redis Security Configuration
```bash
# infrastructure/redis/redis-tls.conf
# Redis secure configuration with TLS and authentication

# Network and Security
bind 0.0.0.0
port 0
tls-port 6380

# TLS Configuration
tls-cert-file /etc/redis/certs/redis.crt
tls-key-file /etc/redis/certs/redis.key
tls-ca-cert-file /etc/redis/certs/ca.crt
tls-dh-params-file /etc/redis/certs/redis.dh

# Client certificate verification
tls-auth-clients yes
tls-protocols "TLSv1.2 TLSv1.3"
tls-ciphers "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256"
tls-prefer-server-ciphers yes

# Authentication
requirepass ${REDIS_PASSWORD}
masterauth ${REDIS_PASSWORD}

# Security Settings
protected-mode yes
tcp-keepalive 300
timeout 300

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG "CONFIG_a89f2e3c4d5b6789"
rename-command SHUTDOWN "SHUTDOWN_a89f2e3c4d5b6789"
rename-command DEBUG ""
rename-command EVAL ""

# Logging
loglevel notice
logfile /data/redis/redis.log
syslog-enabled yes
syslog-ident redis

# Memory Management
maxmemory 2gb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data/redis

# Append Only File
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Client Connection Limits
maxclients 10000
tcp-backlog 511

# Slow Log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency Monitoring
latency-monitor-threshold 100
```

### Certificate Generation Script
```bash
#!/bin/bash
# infrastructure/redis/generate-certs.sh
set -e

CERT_DIR="/etc/redis/certs"
mkdir -p $CERT_DIR
cd $CERT_DIR

# Generate CA private key
openssl genrsa -out ca.key 4096

# Generate CA certificate
openssl req -new -x509 -days 365 -key ca.key -out ca.crt -subj "/C=US/ST=CA/L=San Francisco/O=DnDAI/CN=Redis CA"

# Generate server private key
openssl genrsa -out redis.key 2048

# Generate server certificate signing request
openssl req -new -key redis.key -out redis.csr -subj "/C=US/ST=CA/L=San Francisco/O=DnDAI/CN=redis"

# Generate server certificate
openssl x509 -req -days 365 -in redis.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out redis.crt

# Generate client private key
openssl genrsa -out client.key 2048

# Generate client certificate signing request
openssl req -new -key client.key -out client.csr -subj "/C=US/ST=CA/L=San Francisco/O=DnDAI/CN=redis-client"

# Generate client certificate
openssl x509 -req -days 365 -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt

# Generate DH parameters
openssl dhparam -out redis.dh 2048

# Set permissions
chmod 600 *.key
chmod 644 *.crt *.dh

# Clean up CSR files
rm -f *.csr

echo "Redis TLS certificates generated successfully"
```

### Secure Entrypoint Script
```bash
#!/bin/bash
# infrastructure/redis/entrypoint.sh
set -e

# Generate certificates if they don't exist
if [ ! -f "/etc/redis/certs/redis.crt" ]; then
    echo "Generating Redis TLS certificates..."
    /usr/local/bin/generate-certs.sh
fi

# Set default password if not provided
if [ -z "$REDIS_PASSWORD" ]; then
    export REDIS_PASSWORD=$(openssl rand -base64 32)
    echo "Generated Redis password: $REDIS_PASSWORD"
fi

# Replace password placeholders in config
sed -i "s/\${REDIS_PASSWORD}/$REDIS_PASSWORD/g" /etc/redis/redis-tls.conf

# Start Redis with the provided command
exec "$@"
```

## Docker Compose Development Environment

### docker-compose.yml
```yaml
version: '3.8'

services:
  # Databases
  postgres:
    build:
      context: ./infrastructure/postgres
    environment:
      POSTGRES_DB: dndai_dev
      POSTGRES_USER: dndai_user
      POSTGRES_PASSWORD: dndai_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init-scripts:/docker-entrypoint-initdb.d
    networks:
      - dndai-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dndai_user -d dndai_dev"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    build:
      context: ./infrastructure/redis
    ports:
      - "6380:6380"  # TLS port
    volumes:
      - redis_data:/data/redis
      - redis_certs:/etc/redis/certs
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-$(openssl rand -base64 32)}
    networks:
      - dndai-network
    healthcheck:
      test: ["CMD", "redis-cli", "--tls", "--cert", "/etc/redis/certs/redis.crt", "--key", "/etc/redis/certs/redis.key", "--cacert", "/etc/redis/certs/ca.crt", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # API Gateway
  api-gateway:
    build:
      context: .
      dockerfile: src/Gateway/APIGateway/Dockerfile
    ports:
      - "8080:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=dndai_password
      - Redis__ConnectionString=redis:6380,ssl=true,password=${REDIS_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dndai-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Microservices
  campaign-service:
    build:
      context: .
      dockerfile: src/Services/CampaignService/Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=dndai_password
      - Redis__ConnectionString=redis:6380,ssl=true,password=${REDIS_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dndai-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  character-service:
    build:
      context: .
      dockerfile: src/Services/CharacterService/Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=dndai_password
      - Redis__ConnectionString=redis:6380,ssl=true,password=${REDIS_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dndai-network

  npc-service:
    build:
      context: .
      dockerfile: src/Services/NPCService/Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=dndai_password
      - Redis__ConnectionString=redis:6380,ssl=true,password=${REDIS_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dndai-network

  auth-service:
    build:
      context: .
      dockerfile: src/Services/AuthService/Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=dndai_password
      - Redis__ConnectionString=redis:6380,ssl=true,password=${REDIS_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dndai-network

  ai-gateway-service:
    build:
      context: .
      dockerfile: src/Services/AIGatewayService/Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=dndai_password
      - Redis__ConnectionString=redis:6380,ssl=true,password=${REDIS_PASSWORD}
      - OpenAI__ApiKey=${OPENAI_API_KEY}
      - Anthropic__ApiKey=${ANTHROPIC_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dndai-network

  realtime-service:
    build:
      context: .
      dockerfile: src/Services/RealtimeService/Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=dndai_password
      - Redis__ConnectionString=redis:6380,ssl=true,password=${REDIS_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - dndai-network

  # Flutter Web App
  web-app:
    build:
      context: ./src/Client/Flutter
      dockerfile: Dockerfile
    ports:
      - "3000:8080"
    depends_on:
      - api-gateway
    networks:
      - dndai-network

volumes:
  postgres_data:
  redis_data:
  redis_certs:

networks:
  dndai-network:
    driver: bridge
```

### docker-compose.override.yml (Development)
```yaml
version: '3.8'

services:
  # Development overrides
  campaign-service:
    volumes:
      - ./src/Services/CampaignService:/app/src
      - ./logs:/app/logs
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - Logging__LogLevel__Default=Debug

  character-service:
    volumes:
      - ./src/Services/CharacterService:/app/src
      - ./logs:/app/logs
      - ./data/dnd5e:/app/data/dnd5e
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - Logging__LogLevel__Default=Debug

  # Development tools
  adminer:
    image: adminer:4.8.1
    restart: always
    ports:
      - "8081:8080"
    networks:
      - dndai-network

  redis-commander:
    image: rediscommander/redis-commander:latest
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8082:8081"
    networks:
      - dndai-network
```

## Container Optimization Strategies

### 1. Layer Caching Optimization
- Copy dependency files first for better layer caching
- Use `.dockerignore` to exclude unnecessary files
- Minimize layer count while maintaining readability

### 2. Security Hardening
- Use non-root users in all containers
- Minimal base images (Alpine Linux)
- Regular security updates
- Scan images for vulnerabilities

### 3. Performance Optimization
- Multi-stage builds to reduce final image size
- Proper health checks for container orchestration
- Resource limits and requests
- Efficient dependency management

### 4. Development Workflow
- Development-specific compose overrides
- Volume mounting for live code reload
- Debug configurations
- Local development tools integration

## Build Scripts and Automation

### build.sh
```bash
#!/bin/bash
set -e

# Build all services
echo "Building D&D AI Campaign Management System..."

# Build order (dependencies first)
SERVICES=(
    "src/Shared/DnDAI.Shared.Kernel"
    "src/Gateway/APIGateway"
    "src/Services/AuthService"
    "src/Services/CampaignService"
    "src/Services/CharacterService"
    "src/Services/NPCService"
    "src/Services/AIGatewayService"
    "src/Services/RealtimeService"
)

for service in "${SERVICES[@]}"; do
    echo "Building $service..."
    docker build -f "$service/Dockerfile" -t "dndai/$(basename $service | tr '[:upper:]' '[:lower:]')" .
done

# Build databases
echo "Building databases..."
docker build -f infrastructure/postgres/Dockerfile -t dndai/postgres infrastructure/postgres
docker build -f infrastructure/redis/Dockerfile -t dndai/redis infrastructure/redis

# Build Flutter web app
echo "Building Flutter web app..."
docker build -f src/Client/Flutter/Dockerfile -t dndai/web-app src/Client/Flutter

echo "Build completed successfully!"
```

### .dockerignore
```
# Git
.git
.gitignore
.gitattributes

# Documentation
*.md
docs/

# IDE
.vs/
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build artifacts
**/bin/
**/obj/
**/out/
**/build/

# Test results
TestResults/
**/*.trx
**/*.coverage

# Logs
logs/
*.log

# Temporary files
tmp/
temp/

# Node modules (if any)
node_modules/

# Flutter specific
**/.dart_tool/
**/.packages
**/build/
**/.flutter-plugins
**/.flutter-plugins-dependencies

# Environment files
.env
.env.local
.env.*.local
```

This Docker containerization specification provides:

1. **Production-Ready Containers** - Multi-stage builds with security hardening
2. **Consistent Base Images** - Standardized Alpine Linux base images
3. **Security Best Practices** - Non-root users, minimal attack surface
4. **Development Workflow** - Docker Compose for local development
5. **Performance Optimization** - Layer caching, minimal image sizes
6. **Health Checks** - Proper container health monitoring
7. **Service-Specific Optimizations** - Tailored configurations for each microservice
8. **Database Integration** - PostgreSQL with extensions, Redis configuration
9. **Build Automation** - Scripts for consistent container builds
10. **Development Tools** - Database admin tools, debugging support

The containerization strategy ensures consistent deployment across all environments while maintaining security, performance, and developer productivity.

Would you like me to continue with the Kubernetes orchestration specifications next?
