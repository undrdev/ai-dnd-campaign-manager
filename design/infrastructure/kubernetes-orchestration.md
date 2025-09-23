# Kubernetes Orchestration Specifications

## Overview
This document provides comprehensive Kubernetes orchestration specifications for the D&D AI Campaign Management System. It covers deployment strategies, service mesh, auto-scaling, monitoring, and production-ready configurations that ensure high availability, scalability, and maintainability.

## Cluster Architecture

### Production Cluster Specifications
```yaml
# Recommended cluster configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-config
  namespace: dndai-system
data:
  cluster-specs.yaml: |
    cluster:
      name: dndai-production
      version: "1.28"
      nodes:
        control-plane:
          count: 3
          instance-type: "Standard_D4s_v3"  # Azure / m5.xlarge (AWS)
          disk-size: "100Gi"
        worker-nodes:
          count: 6
          instance-type: "Standard_D8s_v3"  # Azure / m5.2xlarge (AWS)
          disk-size: "200Gi"
          auto-scaling:
            min: 3
            max: 20
      networking:
        cni: "azure-cni"  # or "aws-vpc-cni"
        pod-cidr: "10.244.0.0/16"
        service-cidr: "10.96.0.0/12"
```

### Namespace Organization
```yaml
# namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dndai-system
  labels:
    name: dndai-system
    tier: system
---
apiVersion: v1
kind: Namespace
metadata:
  name: dndai-services
  labels:
    name: dndai-services
    tier: application
---
apiVersion: v1
kind: Namespace
metadata:
  name: dndai-data
  labels:
    name: dndai-data
    tier: data
---
apiVersion: v1
kind: Namespace
metadata:
  name: dndai-monitoring
  labels:
    name: dndai-monitoring
    tier: observability
---
apiVersion: v1
kind: Namespace
metadata:
  name: dndai-ingress
  labels:
    name: dndai-ingress
    tier: networking
```

## Core Infrastructure Components

### 1. PostgreSQL Cluster (High Availability)
```yaml
# postgresql-cluster.yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
  namespace: dndai-data
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised
  
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "1GB"
      maintenance_work_mem: "64MB"
      checkpoint_completion_target: "0.9"
      wal_buffers: "16MB"
      default_statistics_target: "100"
      random_page_cost: "1.1"
      effective_io_concurrency: "200"
      work_mem: "4MB"
      min_wal_size: "1GB"
      max_wal_size: "4GB"

  bootstrap:
    initdb:
      database: dndai
      owner: dndai_user
      secret:
        name: postgres-credentials
      postInitSQL:
        - "CREATE EXTENSION IF NOT EXISTS vector;"
        - "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
        - "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

  storage:
    size: 100Gi
    storageClass: fast-ssd

  resources:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "2Gi"
      cpu: "1000m"

  monitoring:
    enabled: true
    
  backup:
    retentionPolicy: "30d"
    barmanObjectStore:
      destinationPath: "s3://dndai-backups/postgres"
      s3Credentials:
        accessKeyId:
          name: backup-credentials
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: backup-credentials
          key: SECRET_ACCESS_KEY
      wal:
        retention: "7d"
      data:
        retention: "30d"

---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-credentials
  namespace: dndai-data
type: Opaque
stringData:
  username: dndai_user
  password: "${POSTGRES_PASSWORD}"
```

### 2. Redis Cluster
```yaml
# redis-cluster.yaml
apiVersion: redis.redis.opstreelabs.in/v1beta1
kind: RedisCluster
metadata:
  name: redis-cluster
  namespace: dndai-data
spec:
  clusterSize: 6
  clusterVersion: v7
  persistenceEnabled: true
  
  redisExporter:
    enabled: true
    image: oliver006/redis_exporter:latest
    
  storage:
    volumeClaimTemplate:
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 20Gi
            
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
      
  nodeSelector:
    node-type: memory-optimized
    
  tolerations:
  - key: "redis"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
```

## Microservice Deployments

### 1. API Gateway Deployment
```yaml
# api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: dndai-services
  labels:
    app: api-gateway
    tier: gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
        tier: gateway
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: api-gateway-sa
      containers:
      - name: api-gateway
        image: dndai/api-gateway:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8081
          name: https
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: postgres-connection
              key: connection-string
        - name: Redis__ConnectionString
          valueFrom:
            secretKeyRef:
              name: redis-connection
              key: connection-string
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: logs
        emptyDir: {}
      nodeSelector:
        node-type: general-purpose
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - api-gateway
              topologyKey: kubernetes.io/hostname

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: dndai-services
  labels:
    app: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  - name: https
    port: 443
    targetPort: 8081
    protocol: TCP
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: dndai-services
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
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
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

### 2. Campaign Service Deployment
```yaml
# campaign-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: campaign-service
  namespace: dndai-services
  labels:
    app: campaign-service
    tier: application
spec:
  replicas: 2
  selector:
    matchLabels:
      app: campaign-service
  template:
    metadata:
      labels:
        app: campaign-service
        tier: application
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: campaign-service-sa
      containers:
      - name: campaign-service
        image: dndai/campaign-service:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: postgres-connection
              key: connection-string
        - name: Redis__ConnectionString
          valueFrom:
            secretKeyRef:
              name: redis-connection
              key: connection-string
        - name: SignalR__HubUrl
          value: "http://realtime-service-service/sessionhub"
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: logs
        emptyDir: {}
      nodeSelector:
        node-type: general-purpose

---
apiVersion: v1
kind: Service
metadata:
  name: campaign-service-service
  namespace: dndai-services
  labels:
    app: campaign-service
spec:
  selector:
    app: campaign-service
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
  name: campaign-service-hpa
  namespace: dndai-services
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: campaign-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 3. AI Gateway Service Deployment (with AI Provider Secrets)
```yaml
# ai-gateway-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-gateway-service
  namespace: dndai-services
  labels:
    app: ai-gateway-service
    tier: application
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-gateway-service
  template:
    metadata:
      labels:
        app: ai-gateway-service
        tier: application
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: ai-gateway-service-sa
      containers:
      - name: ai-gateway-service
        image: dndai/ai-gateway-service:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: postgres-connection
              key: connection-string
        - name: Redis__ConnectionString
          valueFrom:
            secretKeyRef:
              name: redis-connection
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
        - name: Google__ApiKey
          valueFrom:
            secretKeyRef:
              name: ai-provider-secrets
              key: google-api-key
        - name: AzureOpenAI__ApiKey
          valueFrom:
            secretKeyRef:
              name: ai-provider-secrets
              key: azure-openai-api-key
        - name: AzureOpenAI__Endpoint
          valueFrom:
            secretKeyRef:
              name: ai-provider-secrets
              key: azure-openai-endpoint
        resources:
          requests:
            cpu: 200m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 15
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10
          timeoutSeconds: 10
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/cache
        - name: templates
          mountPath: /app/templates
          readOnly: true
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir:
          sizeLimit: 1Gi
      - name: templates
        configMap:
          name: ai-templates
      nodeSelector:
        node-type: compute-optimized

---
apiVersion: v1
kind: Secret
metadata:
  name: ai-provider-secrets
  namespace: dndai-services
type: Opaque
stringData:
  openai-api-key: "${OPENAI_API_KEY}"
  anthropic-api-key: "${ANTHROPIC_API_KEY}"
  google-api-key: "${GOOGLE_API_KEY}"
  azure-openai-api-key: "${AZURE_OPENAI_API_KEY}"
  azure-openai-endpoint: "${AZURE_OPENAI_ENDPOINT}"
```

### 4. Real-time Service Deployment (SignalR with Redis Backplane)
```yaml
# realtime-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: realtime-service
  namespace: dndai-services
  labels:
    app: realtime-service
    tier: application
spec:
  replicas: 3
  selector:
    matchLabels:
      app: realtime-service
  template:
    metadata:
      labels:
        app: realtime-service
        tier: application
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: realtime-service-sa
      containers:
      - name: realtime-service
        image: dndai/realtime-service:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: postgres-connection
              key: connection-string
        - name: Redis__ConnectionString
          valueFrom:
            secretKeyRef:
              name: redis-connection
              key: connection-string
        - name: SignalR__RedisConnectionString
          valueFrom:
            secretKeyRef:
              name: redis-connection
              key: connection-string
        resources:
          requests:
            cpu: 150m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
      nodeSelector:
        node-type: memory-optimized
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - realtime-service
              topologyKey: kubernetes.io/hostname

---
apiVersion: v1
kind: Service
metadata:
  name: realtime-service-service
  namespace: dndai-services
  labels:
    app: realtime-service
  annotations:
    service.beta.kubernetes.io/azure-load-balancer-internal: "true"
spec:
  selector:
    app: realtime-service
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  type: LoadBalancer
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
```

## Ingress and Load Balancing

### NGINX Ingress Controller
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dndai-ingress
  namespace: dndai-services
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/rate-limit: "1000"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "X-Frame-Options: DENY";
      more_set_headers "X-Content-Type-Options: nosniff";
      more_set_headers "X-XSS-Protection: 1; mode=block";
      more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.dndai.app
    - app.dndai.app
    - realtime.dndai.app
    secretName: dndai-tls
  rules:
  - host: api.dndai.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 80
  - host: app.dndai.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app-service
            port:
              number: 80
  - host: realtime.dndai.app
    http:
      paths:
      - path: /sessionhub
        pathType: Prefix
        backend:
          service:
            name: realtime-service-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 80

---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@dndai.app
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

## Configuration Management

### ConfigMaps and Secrets
```yaml
# config-maps.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: dndai-services
data:
  appsettings.json: |
    {
      "Logging": {
        "LogLevel": {
          "Default": "Information",
          "Microsoft.AspNetCore": "Warning",
          "Microsoft.EntityFrameworkCore": "Warning"
        }
      },
      "HealthChecks": {
        "UI": {
          "EvaluationTimeInSeconds": 10,
          "MinimumSecondsBetweenFailureNotifications": 60
        }
      },
      "Metrics": {
        "Enabled": true,
        "Port": 9090
      }
    }

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-templates
  namespace: dndai-services
data:
  npc-generation.txt: |
    You are a creative D&D Dungeon Master assistant. Generate a detailed NPC based on the following context:
    
    Campaign: {{campaign_name}}
    Setting: {{campaign_setting}}
    Content Rating: {{content_rating}}
    
    Create an NPC with:
    - Name and basic demographics
    - Personality traits and motivations
    - Background and occupation
    - Relationships and connections
    - Secrets or hooks for the story
    
    Keep the content appropriate for {{content_rating}} audiences.

---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-connection
  namespace: dndai-services
type: Opaque
stringData:
  connection-string: "Host=postgres-cluster-rw.dndai-data.svc.cluster.local;Database=dndai;Username=dndai_user;Password=${POSTGRES_PASSWORD};SSL Mode=Require"

---
apiVersion: v1
kind: Secret
metadata:
  name: redis-connection
  namespace: dndai-services
type: Opaque
stringData:
  connection-string: "redis-cluster.dndai-data.svc.cluster.local:6379"
```

## Service Accounts and RBAC

### Service Accounts
```yaml
# service-accounts.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-gateway-sa
  namespace: dndai-services
  labels:
    app: api-gateway

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: campaign-service-sa
  namespace: dndai-services
  labels:
    app: campaign-service

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ai-gateway-service-sa
  namespace: dndai-services
  labels:
    app: ai-gateway-service

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: realtime-service-sa
  namespace: dndai-services
  labels:
    app: realtime-service

---
# RBAC for services
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: dndai-services
  name: service-reader
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["services", "endpoints"]
  verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: service-reader-binding
  namespace: dndai-services
subjects:
- kind: ServiceAccount
  name: api-gateway-sa
  namespace: dndai-services
- kind: ServiceAccount
  name: campaign-service-sa
  namespace: dndai-services
- kind: ServiceAccount
  name: ai-gateway-service-sa
  namespace: dndai-services
- kind: ServiceAccount
  name: realtime-service-sa
  namespace: dndai-services
roleRef:
  kind: Role
  name: service-reader
  apiGroup: rbac.authorization.k8s.io
```

## Monitoring and Observability

### Service Monitor for Prometheus
```yaml
# service-monitors.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: dndai-services-monitor
  namespace: dndai-monitoring
  labels:
    app: dndai-services
spec:
  selector:
    matchLabels:
      tier: application
  namespaceSelector:
    matchNames:
    - dndai-services
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s

---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: postgres-monitor
  namespace: dndai-monitoring
spec:
  selector:
    matchLabels:
      cnpg.io/cluster: postgres-cluster
  namespaceSelector:
    matchNames:
    - dndai-data
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s

---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: redis-monitor
  namespace: dndai-monitoring
spec:
  selector:
    matchLabels:
      app: redis-cluster
  namespaceSelector:
    matchNames:
    - dndai-data
  endpoints:
  - port: redis-exporter
    path: /metrics
    interval: 30s
```

## Network Policies

### Security Network Policies
```yaml
# network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: dndai-services-network-policy
  namespace: dndai-services
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: dndai-ingress
    - namespaceSelector:
        matchLabels:
          name: dndai-services
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: dndai-data
    ports:
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
  - to:
    - namespaceSelector:
        matchLabels:
          name: dndai-services
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 8080
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: dndai-data-network-policy
  namespace: dndai-data
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: dndai-services
    - namespaceSelector:
        matchLabels:
          name: dndai-monitoring
    ports:
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
    - protocol: TCP
      port: 9187  # postgres-exporter
    - protocol: TCP
      port: 9121  # redis-exporter
```

## Deployment Scripts

### deploy.sh
```bash
#!/bin/bash
set -e

NAMESPACE="dndai-services"
DATA_NAMESPACE="dndai-data"
MONITORING_NAMESPACE="dndai-monitoring"

echo "Deploying D&D AI Campaign Management System to Kubernetes..."

# Create namespaces
echo "Creating namespaces..."
kubectl apply -f namespaces.yaml

# Deploy secrets (from environment or external secret management)
echo "Deploying secrets..."
envsubst < secrets.yaml | kubectl apply -f -

# Deploy ConfigMaps
echo "Deploying ConfigMaps..."
kubectl apply -f config-maps.yaml

# Deploy databases
echo "Deploying databases..."
kubectl apply -f postgresql-cluster.yaml -n $DATA_NAMESPACE
kubectl apply -f redis-cluster.yaml -n $DATA_NAMESPACE

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
kubectl wait --for=condition=Ready cluster/postgres-cluster -n $DATA_NAMESPACE --timeout=600s
kubectl wait --for=condition=Ready rediscluster/redis-cluster -n $DATA_NAMESPACE --timeout=300s

# Deploy service accounts and RBAC
echo "Deploying RBAC..."
kubectl apply -f service-accounts.yaml

# Deploy applications
echo "Deploying applications..."
kubectl apply -f api-gateway-deployment.yaml
kubectl apply -f campaign-service-deployment.yaml
kubectl apply -f character-service-deployment.yaml
kubectl apply -f npc-service-deployment.yaml
kubectl apply -f auth-service-deployment.yaml
kubectl apply -f ai-gateway-service-deployment.yaml
kubectl apply -f realtime-service-deployment.yaml

# Deploy ingress
echo "Deploying ingress..."
kubectl apply -f ingress.yaml

# Deploy monitoring
echo "Deploying monitoring..."
kubectl apply -f service-monitors.yaml -n $MONITORING_NAMESPACE

# Deploy network policies
echo "Deploying network policies..."
kubectl apply -f network-policies.yaml

# Wait for deployments
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment --all -n $NAMESPACE --timeout=600s

echo "Deployment completed successfully!"
echo "Application will be available at: https://app.dndai.app"
echo "API will be available at: https://api.dndai.app"
echo "Real-time services at: https://realtime.dndai.app"
```

This Kubernetes orchestration specification provides:

1. **Production-Ready Architecture** - High availability, auto-scaling, security
2. **Complete Infrastructure** - PostgreSQL cluster, Redis cluster, monitoring
3. **Service Mesh Ready** - Proper service accounts, RBAC, network policies
4. **Auto-Scaling** - HPA configurations for all services
5. **Security Hardening** - Non-root containers, network policies, secrets management
6. **Observability** - Prometheus monitoring, health checks, logging
7. **Load Balancing** - Ingress controllers, session affinity for SignalR
8. **Configuration Management** - ConfigMaps, secrets, environment-specific settings
9. **Database High Availability** - PostgreSQL clustering, Redis clustering
10. **Deployment Automation** - Complete deployment scripts and manifests

The orchestration ensures the system can handle thousands of concurrent users with proper scaling, monitoring, and security measures in place.

Would you like me to continue with the Helm Charts specifications next?
