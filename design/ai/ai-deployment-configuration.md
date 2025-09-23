# AI Service Deployment & Scaling Configuration

## Overview
This document defines the comprehensive deployment and scaling configuration for AI services, including containerization, Kubernetes orchestration, auto-scaling policies, load balancing, service mesh integration, and production deployment strategies to ensure reliable, scalable, and cost-effective AI service operation.

---

## AI Deployment Architecture

### **Multi-Environment Deployment Pipeline**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Environment                      │
│  Docker Compose | Local K8s | Feature Testing                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   CI/CD Pipeline      │
                    │ (Build, Test, Package,│
                    │  Security Scan)       │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Staging     │    │   Production    │    │   Disaster      │
│  Environment  │    │   Environment   │    │   Recovery      │
│ (Integration  │    │ (Live Traffic   │    │  Environment    │
│   Testing)    │    │  & Monitoring)  │    │  (Backup Site)  │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Auto-scaling &      │
                    │   Load Balancing      │
                    │  (Horizontal Pod      │
                    │   Autoscaler)         │
                    └───────────────────────┘
```

### **AI Service Containerization**

#### **AI Gateway Service Dockerfile**
```dockerfile
# AI Gateway Service
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Install security updates
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --shell /bin/false appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/Services/AI/AIGateway/AIGateway.csproj", "src/Services/AI/AIGateway/"]
COPY ["src/Shared/DnDAI.Shared/DnDAI.Shared.csproj", "src/Shared/DnDAI.Shared/"]

# Restore dependencies
RUN dotnet restore "src/Services/AI/AIGateway/AIGateway.csproj"

# Copy source code
COPY . .
WORKDIR "/src/src/Services/AI/AIGateway"

# Build application
RUN dotnet build "AIGateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AIGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Set ownership and permissions
RUN chown -R appuser:appgroup /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "AIGateway.dll"]
```

#### **AI Service Docker Compose (Development)**
```yaml
# docker-compose.ai-services.yml
version: '3.8'

services:
  ai-gateway:
    build:
      context: .
      dockerfile: src/Services/AI/AIGateway/Dockerfile
    ports:
      - "5001:8080"
      - "5011:8081"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:8080;https://+:8081
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=${DB_PASSWORD}
      - Redis__ConnectionString=redis:6379
      - OpenAI__ApiKey=${OPENAI_API_KEY}
      - Anthropic__ApiKey=${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./src/Services/AI/AIGateway/logs:/app/logs
    networks:
      - dndai-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  ai-context-service:
    build:
      context: .
      dockerfile: src/Services/AI/ContextService/Dockerfile
    ports:
      - "5002:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=${DB_PASSWORD}
      - Redis__ConnectionString=redis:6379
      - VectorDatabase__ConnectionString=${PINECONE_API_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - dndai-network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'

  ai-quality-service:
    build:
      context: .
      dockerfile: src/Services/AI/QualityService/Dockerfile
    ports:
      - "5003:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=dndai_dev;Username=dndai_user;Password=${DB_PASSWORD}
      - Redis__ConnectionString=redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - dndai-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

  # Supporting services
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: dndai_dev
      POSTGRES_USER: dndai_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - dndai-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - dndai-network
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./infrastructure/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - dndai-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./infrastructure/monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    networks:
      - dndai-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  dndai-network:
    driver: bridge
```

### **Kubernetes Deployment Configurations**

#### **AI Gateway Service Deployment**
```yaml
# k8s/ai-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-gateway
  namespace: dndai-ai
  labels:
    app: ai-gateway
    component: ai-services
    tier: gateway
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: ai-gateway
  template:
    metadata:
      labels:
        app: ai-gateway
        component: ai-services
        tier: gateway
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: ai-gateway-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: ai-gateway
        image: dndai/ai-gateway:latest
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        - containerPort: 8081
          name: https
          protocol: TCP
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ASPNETCORE_URLS
          value: "http://+:8080"
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: connection-string
        - name: Redis__ConnectionString
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: connection-string
        - name: OpenAI__ApiKey
          valueFrom:
            secretKeyRef:
              name: ai-provider-secrets
              key: openai-api-key
        - name: Anthropic__ApiKey
          valueFrom:
            secretKeyRef:
              name: ai-provider-secrets
              key: anthropic-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: logs
          mountPath: /app/logs
        - name: config
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: logs
        emptyDir: {}
      - name: config
        configMap:
          name: ai-gateway-config
      nodeSelector:
        node-type: compute
      tolerations:
      - key: "ai-workload"
        operator: "Equal"
        value: "true"
        effect: "NoSchedule"
---
apiVersion: v1
kind: Service
metadata:
  name: ai-gateway-service
  namespace: dndai-ai
  labels:
    app: ai-gateway
spec:
  selector:
    app: ai-gateway
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-gateway-hpa
  namespace: dndai-ai
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: ai_requests_per_second
      target:
        type: AverageValue
        averageValue: "10"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
      selectPolicy: Min
```

#### **AI Context Service Deployment**
```yaml
# k8s/ai-context-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-context-service
  namespace: dndai-ai
  labels:
    app: ai-context-service
    component: ai-services
    tier: context
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ai-context-service
  template:
    metadata:
      labels:
        app: ai-context-service
        component: ai-services
        tier: context
    spec:
      serviceAccountName: ai-context-service-sa
      containers:
      - name: ai-context-service
        image: dndai/ai-context-service:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: connection-string
        - name: Redis__ConnectionString
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: connection-string
        - name: VectorDatabase__ConnectionString
          valueFrom:
            secretKeyRef:
              name: vector-db-secrets
              key: connection-string
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-context-service-hpa
  namespace: dndai-ai
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-context-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 85
```

### **Configuration Management**

#### **AI Services ConfigMap**
```yaml
# k8s/ai-services-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-gateway-config
  namespace: dndai-ai
data:
  appsettings.Production.json: |
    {
      "Logging": {
        "LogLevel": {
          "Default": "Information",
          "Microsoft.AspNetCore": "Warning",
          "System.Net.Http.HttpClient": "Warning"
        }
      },
      "AI": {
        "Providers": {
          "OpenAI": {
            "BaseUrl": "https://api.openai.com/v1",
            "MaxRetries": 3,
            "TimeoutSeconds": 30,
            "RateLimitPerMinute": 60
          },
          "Anthropic": {
            "BaseUrl": "https://api.anthropic.com/v1",
            "MaxRetries": 3,
            "TimeoutSeconds": 45,
            "RateLimitPerMinute": 30
          }
        },
        "QualityAssurance": {
          "EnableContentFiltering": true,
          "EnableQualityScoring": true,
          "MinimumQualityScore": 0.6
        },
        "UsageTracking": {
          "EnableTracking": true,
          "TrackingInterval": "00:01:00"
        }
      },
      "Cache": {
        "DefaultExpiration": "01:00:00",
        "SlidingExpiration": "00:30:00"
      },
      "HealthChecks": {
        "UI": {
          "EvaluationTimeInSeconds": 10,
          "MinimumSecondsBetweenFailureNotifications": 300
        }
      }
    }
---
apiVersion: v1
kind: Secret
metadata:
  name: ai-provider-secrets
  namespace: dndai-ai
type: Opaque
data:
  openai-api-key: <base64-encoded-key>
  anthropic-api-key: <base64-encoded-key>
  pinecone-api-key: <base64-encoded-key>
---
apiVersion: v1
kind: Secret
metadata:
  name: database-secrets
  namespace: dndai-ai
type: Opaque
data:
  connection-string: <base64-encoded-connection-string>
---
apiVersion: v1
kind: Secret
metadata:
  name: redis-secrets
  namespace: dndai-ai
type: Opaque
data:
  connection-string: <base64-encoded-connection-string>
```

### **Service Mesh Integration (Istio)**

#### **AI Services VirtualService**
```yaml
# k8s/istio/ai-services-virtualservice.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ai-gateway-vs
  namespace: dndai-ai
spec:
  hosts:
  - ai-gateway.dndai.local
  gateways:
  - ai-gateway
  http:
  - match:
    - uri:
        prefix: "/api/ai"
    route:
    - destination:
        host: ai-gateway-service
        port:
          number: 80
      weight: 100
    timeout: 30s
    retries:
      attempts: 3
      perTryTimeout: 10s
      retryOn: gateway-error,connect-failure,refused-stream
  - match:
    - uri:
        prefix: "/health"
    route:
    - destination:
        host: ai-gateway-service
        port:
          number: 80
    timeout: 5s
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ai-gateway-dr
  namespace: dndai-ai
spec:
  host: ai-gateway-service
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 10
        maxRetries: 3
    circuitBreaker:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
    outlierDetection:
      consecutive5xxErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 50
```

### **Monitoring and Observability**

#### **Prometheus ServiceMonitor**
```yaml
# k8s/monitoring/ai-services-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ai-services-monitor
  namespace: dndai-ai
  labels:
    app: ai-services
spec:
  selector:
    matchLabels:
      component: ai-services
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
  namespaceSelector:
    matchNames:
    - dndai-ai
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ai-services-alerts
  namespace: dndai-ai
spec:
  groups:
  - name: ai-services
    rules:
    - alert: AIServiceDown
      expr: up{job="ai-gateway-service"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "AI Gateway service is down"
        description: "AI Gateway service has been down for more than 1 minute"
    
    - alert: HighAIResponseTime
      expr: histogram_quantile(0.95, ai_request_duration_seconds_bucket) > 10
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "High AI response time"
        description: "95th percentile response time is {{ $value }}s"
    
    - alert: HighAIErrorRate
      expr: rate(ai_requests_total{status="error"}[5m]) / rate(ai_requests_total[5m]) > 0.05
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "High AI error rate"
        description: "AI error rate is {{ $value | humanizePercentage }}"
    
    - alert: AIServiceHighMemoryUsage
      expr: container_memory_usage_bytes{pod=~"ai-.*"} / container_spec_memory_limit_bytes > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage in AI service"
        description: "Memory usage is above 90% for {{ $labels.pod }}"
```

### **Deployment Scripts and Automation**

#### **Helm Chart Values**
```yaml
# helm/ai-services/values.yaml
global:
  imageRegistry: dndai
  imagePullPolicy: IfNotPresent
  storageClass: fast-ssd

aiGateway:
  name: ai-gateway
  image:
    repository: ai-gateway
    tag: latest
  replicaCount: 3
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 1Gi
      cpu: 500m
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80

aiContextService:
  name: ai-context-service
  image:
    repository: ai-context-service
    tag: latest
  replicaCount: 2
  resources:
    requests:
      memory: 1Gi
      cpu: 500m
    limits:
      memory: 2Gi
      cpu: 1000m
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 75

secrets:
  aiProviders:
    openaiApiKey: ""
    anthropicApiKey: ""
    pineconeApiKey: ""
  database:
    connectionString: ""
  redis:
    connectionString: ""

monitoring:
  prometheus:
    enabled: true
  grafana:
    enabled: true
  jaeger:
    enabled: true

ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
  hosts:
    - host: ai.dndai.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ai-dndai-tls
      hosts:
        - ai.dndai.com
```

#### **Deployment Script**
```bash
#!/bin/bash
# scripts/deploy-ai-services.sh

set -e

ENVIRONMENT=${1:-staging}
NAMESPACE="dndai-ai"
CHART_PATH="./helm/ai-services"

echo "Deploying AI services to $ENVIRONMENT environment..."

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
echo "Applying secrets..."
kubectl apply -f k8s/secrets/ -n $NAMESPACE

# Deploy with Helm
echo "Deploying with Helm..."
helm upgrade --install ai-services $CHART_PATH \
  --namespace $NAMESPACE \
  --values $CHART_PATH/values-$ENVIRONMENT.yaml \
  --timeout 10m \
  --wait

# Wait for rollout
echo "Waiting for deployment rollout..."
kubectl rollout status deployment/ai-gateway -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/ai-context-service -n $NAMESPACE --timeout=300s

# Run health checks
echo "Running health checks..."
kubectl wait --for=condition=ready pod -l app=ai-gateway -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=ai-context-service -n $NAMESPACE --timeout=300s

echo "AI services deployment completed successfully!"

# Display service status
kubectl get pods,svc,hpa -n $NAMESPACE
```

This comprehensive deployment configuration provides production-ready, scalable, and observable AI services with proper security, monitoring, and automation for reliable operation in Kubernetes environments.
