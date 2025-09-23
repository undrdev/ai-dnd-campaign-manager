# Helm Charts Specifications

## Overview
This document provides comprehensive Helm chart specifications for the D&D AI Campaign Management System. It covers parameterized deployments, environment-specific configurations, dependency management, and GitOps-ready chart structures that enable consistent deployments across development, staging, and production environments.

## Chart Structure and Organization

### Main Chart Structure
```
charts/
├── dndai-platform/                 # Umbrella chart
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── values-dev.yaml
│   ├── values-staging.yaml
│   ├── values-prod.yaml
│   ├── templates/
│   │   ├── _helpers.tpl
│   │   ├── namespace.yaml
│   │   ├── secrets.yaml
│   │   └── configmap.yaml
│   └── charts/                     # Subcharts
│       ├── api-gateway/
│       ├── campaign-service/
│       ├── character-service/
│       ├── npc-service/
│       ├── auth-service/
│       ├── ai-gateway-service/
│       ├── realtime-service/
│       ├── web-app/
│       ├── postgresql/
│       └── redis/
└── library/                        # Library charts
    ├── common/
    └── microservice/
```

## Umbrella Chart - Platform Deployment

### Chart.yaml
```yaml
# charts/dndai-platform/Chart.yaml
apiVersion: v2
name: dndai-platform
description: D&D AI Campaign Management System - Complete Platform
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - dnd
  - ai
  - gaming
  - microservices
home: https://dndai.app
sources:
  - https://github.com/dndai/campaign-manager
maintainers:
  - name: D&D AI Team
    email: dev@dndai.app
dependencies:
  - name: postgresql
    version: "12.12.10"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
  - name: redis
    version: "18.1.5"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
  - name: nginx-ingress
    version: "4.8.3"
    repository: "https://kubernetes.github.io/ingress-nginx"
    condition: ingress.enabled
  - name: cert-manager
    version: "1.13.2"
    repository: "https://charts.jetstack.io"
    condition: certManager.enabled
  - name: prometheus
    version: "25.1.0"
    repository: "https://prometheus-community.github.io/helm-charts"
    condition: monitoring.prometheus.enabled
  - name: grafana
    version: "7.0.3"
    repository: "https://grafana.github.io/helm-charts"
    condition: monitoring.grafana.enabled
```

### Platform Values (values.yaml)
```yaml
# charts/dndai-platform/values.yaml
global:
  imageRegistry: ""
  imagePullSecrets: []
  storageClass: ""
  postgresql:
    auth:
      existingSecret: "postgresql-credentials"
      secretKeys:
        adminPasswordKey: "postgres-password"
        userPasswordKey: "password"
  redis:
    auth:
      existingSecret: "redis-credentials"
      existingSecretPasswordKey: "password"

# Environment Configuration
environment: production
replicaCount: 2
imageTag: "latest"

# Namespace Configuration
namespaces:
  create: true
  services: "dndai-services"
  data: "dndai-data"
  monitoring: "dndai-monitoring"
  ingress: "dndai-ingress"

# Database Configuration
postgresql:
  enabled: true
  auth:
    postgresPassword: ""
    username: "dndai_user"
    password: ""
    database: "dndai"
  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "fast-ssd"
    resources:
      requests:
        memory: "1Gi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "1000m"
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
      namespace: "dndai-monitoring"

redis:
  enabled: true
  auth:
    enabled: true
    password: ""
  cluster:
    enabled: true
    nodes: 6
  persistence:
    enabled: true
    size: 20Gi
    storageClass: "fast-ssd"
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
      namespace: "dndai-monitoring"

# Ingress Configuration
ingress:
  enabled: true
  className: "nginx"
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: api.dndai.app
      paths:
        - path: /
          pathType: Prefix
          service: api-gateway
    - host: app.dndai.app
      paths:
        - path: /
          pathType: Prefix
          service: web-app
    - host: realtime.dndai.app
      paths:
        - path: /sessionhub
          pathType: Prefix
          service: realtime-service
  tls:
    - secretName: dndai-tls
      hosts:
        - api.dndai.app
        - app.dndai.app
        - realtime.dndai.app

# SSL Certificate Management
certManager:
  enabled: true
  clusterIssuer:
    name: letsencrypt-prod
    email: admin@dndai.app
    server: https://acme-v02.api.letsencrypt.org/directory

# Monitoring Configuration
monitoring:
  prometheus:
    enabled: true
    retention: "30d"
    storageSize: "50Gi"
    resources:
      requests:
        memory: "2Gi"
        cpu: "500m"
      limits:
        memory: "4Gi"
        cpu: "1000m"
  grafana:
    enabled: true
    adminPassword: ""
    persistence:
      enabled: true
      size: "10Gi"
    dashboards:
      enabled: true
      label: grafana_dashboard
      labelValue: "1"

# Service Configuration
services:
  apiGateway:
    enabled: true
    image:
      repository: dndai/api-gateway
      tag: ""
      pullPolicy: IfNotPresent
    replicaCount: 3
    resources:
      requests:
        memory: "256Mi"
        cpu: "200m"
      limits:
        memory: "512Mi"
        cpu: "1000m"
    autoscaling:
      enabled: true
      minReplicas: 3
      maxReplicas: 20
      targetCPUUtilizationPercentage: 70
      targetMemoryUtilizationPercentage: 80

  campaignService:
    enabled: true
    image:
      repository: dndai/campaign-service
      tag: ""
      pullPolicy: IfNotPresent
    replicaCount: 2
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "500m"
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 10
      targetCPUUtilizationPercentage: 70

  characterService:
    enabled: true
    image:
      repository: dndai/character-service
      tag: ""
      pullPolicy: IfNotPresent
    replicaCount: 2
    resources:
      requests:
        memory: "512Mi"
        cpu: "200m"
      limits:
        memory: "1Gi"
        cpu: "500m"
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 8
      targetCPUUtilizationPercentage: 70

  npcService:
    enabled: true
    image:
      repository: dndai/npc-service
      tag: ""
      pullPolicy: IfNotPresent
    replicaCount: 2
    resources:
      requests:
        memory: "256Mi"
        cpu: "150m"
      limits:
        memory: "512Mi"
        cpu: "500m"
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 8
      targetCPUUtilizationPercentage: 70

  authService:
    enabled: true
    image:
      repository: dndai/auth-service
      tag: ""
      pullPolicy: IfNotPresent
    replicaCount: 2
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "500m"
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 6
      targetCPUUtilizationPercentage: 70

  aiGatewayService:
    enabled: true
    image:
      repository: dndai/ai-gateway-service
      tag: ""
      pullPolicy: IfNotPresent
    replicaCount: 2
    resources:
      requests:
        memory: "512Mi"
        cpu: "200m"
      limits:
        memory: "1Gi"
        cpu: "1000m"
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 10
      targetCPUUtilizationPercentage: 70
    aiProviders:
      openai:
        apiKeySecret: "ai-provider-secrets"
        apiKeyKey: "openai-api-key"
      anthropic:
        apiKeySecret: "ai-provider-secrets"
        apiKeyKey: "anthropic-api-key"
      google:
        apiKeySecret: "ai-provider-secrets"
        apiKeyKey: "google-api-key"
      azureOpenAI:
        apiKeySecret: "ai-provider-secrets"
        apiKeyKey: "azure-openai-api-key"
        endpointSecret: "ai-provider-secrets"
        endpointKey: "azure-openai-endpoint"

  realtimeService:
    enabled: true
    image:
      repository: dndai/realtime-service
      tag: ""
      pullPolicy: IfNotPresent
    replicaCount: 3
    resources:
      requests:
        memory: "256Mi"
        cpu: "150m"
      limits:
        memory: "512Mi"
        cpu: "500m"
    autoscaling:
      enabled: true
      minReplicas: 3
      maxReplicas: 12
      targetCPUUtilizationPercentage: 70
    service:
      type: LoadBalancer
      sessionAffinity: ClientIP

  webApp:
    enabled: true
    image:
      repository: dndai/web-app
      tag: ""
      pullPolicy: IfNotPresent
    replicaCount: 2
    resources:
      requests:
        memory: "64Mi"
        cpu: "50m"
      limits:
        memory: "128Mi"
        cpu: "100m"
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 10
      targetCPUUtilizationPercentage: 70

# Security Configuration
security:
  networkPolicies:
    enabled: true
  podSecurityPolicy:
    enabled: true
  serviceAccounts:
    create: true
  rbac:
    create: true

# Configuration Management
config:
  appSettings:
    logLevel: "Information"
    healthChecks:
      enabled: true
      evaluationTimeInSeconds: 10
    metrics:
      enabled: true
      port: 9090
  aiTemplates:
    npcGeneration: |
      You are a creative D&D Dungeon Master assistant...
    worldBuilding: |
      Generate detailed world content for a D&D campaign...
    questGeneration: |
      Create an engaging quest for D&D players...

# Secrets Configuration (populated by CI/CD or external secret management)
secrets:
  postgresql:
    password: ""
    postgresPassword: ""
  redis:
    password: ""
  aiProviders:
    openaiApiKey: ""
    anthropicApiKey: ""
    googleApiKey: ""
    azureOpenAIApiKey: ""
    azureOpenAIEndpoint: ""
  jwt:
    secretKey: ""
    issuer: "https://api.dndai.app"
    audience: "dndai-app"
```

### Environment-Specific Values

#### Development (values-dev.yaml)
```yaml
# charts/dndai-platform/values-dev.yaml
environment: development
imageTag: "dev"
replicaCount: 1

# Reduced resources for development
postgresql:
  primary:
    persistence:
      size: 10Gi
    resources:
      requests:
        memory: "256Mi"
        cpu: "100m"
      limits:
        memory: "512Mi"
        cpu: "250m"

redis:
  cluster:
    nodes: 3
  persistence:
    size: 5Gi
  resources:
    requests:
      memory: "64Mi"
      cpu: "50m"
    limits:
      memory: "128Mi"
      cpu: "100m"

# Ingress for development
ingress:
  hosts:
    - host: api-dev.dndai.app
      paths:
        - path: /
          pathType: Prefix
          service: api-gateway
    - host: app-dev.dndai.app
      paths:
        - path: /
          pathType: Prefix
          service: web-app
  tls:
    - secretName: dndai-dev-tls
      hosts:
        - api-dev.dndai.app
        - app-dev.dndai.app

# Reduced service resources
services:
  apiGateway:
    replicaCount: 1
    resources:
      requests:
        memory: "128Mi"
        cpu: "50m"
      limits:
        memory: "256Mi"
        cpu: "200m"
    autoscaling:
      enabled: false

  campaignService:
    replicaCount: 1
    resources:
      requests:
        memory: "128Mi"
        cpu: "50m"
      limits:
        memory: "256Mi"
        cpu: "200m"
    autoscaling:
      enabled: false

# Development-specific configuration
config:
  appSettings:
    logLevel: "Debug"
```

#### Production (values-prod.yaml)
```yaml
# charts/dndai-platform/values-prod.yaml
environment: production
imageTag: "stable"

# Production database configuration
postgresql:
  primary:
    persistence:
      size: 500Gi
      storageClass: "premium-ssd"
    resources:
      requests:
        memory: "4Gi"
        cpu: "2000m"
      limits:
        memory: "8Gi"
        cpu: "4000m"
  readReplicas:
    replicaCount: 2
    persistence:
      size: 500Gi
    resources:
      requests:
        memory: "2Gi"
        cpu: "1000m"
      limits:
        memory: "4Gi"
        cpu: "2000m"

redis:
  cluster:
    nodes: 6
  persistence:
    size: 100Gi
    storageClass: "premium-ssd"
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "500m"

# Production monitoring
monitoring:
  prometheus:
    retention: "90d"
    storageSize: "200Gi"
    resources:
      requests:
        memory: "8Gi"
        cpu: "2000m"
      limits:
        memory: "16Gi"
        cpu: "4000m"

# Enhanced security for production
security:
  networkPolicies:
    enabled: true
    denyAll: true
  podSecurityPolicy:
    enabled: true
    privileged: false
    allowPrivilegeEscalation: false
    runAsNonRoot: true
    runAsUser: 1001
```

## Microservice Chart Template

### Library Chart for Microservices
```yaml
# charts/library/microservice/Chart.yaml
apiVersion: v2
name: microservice
description: Library chart for D&D AI microservices
type: library
version: 1.0.0
```

```yaml
# charts/library/microservice/values.yaml
# Default values for microservice library chart
image:
  repository: ""
  tag: ""
  pullPolicy: IfNotPresent

nameOverride: ""
fullnameOverride: ""

replicaCount: 2

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: false
  className: ""
  annotations: {}
  hosts: []
  tls: []

resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}
tolerations: []
affinity: {}

podAnnotations: {}
podSecurityContext: {}
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL

livenessProbe:
  httpGet:
    path: /health/live
    port: http
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: http
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

env: []
envFrom: []
volumeMounts: []
volumes: []

serviceAccount:
  create: true
  annotations: {}
  name: ""

serviceMonitor:
  enabled: true
  interval: 30s
  path: /metrics
  port: http
```

### Microservice Deployment Template
```yaml
# charts/library/microservice/templates/deployment.yaml
{{- define "microservice.deployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "microservice.fullname" . }}
  namespace: {{ .Values.namespace | default .Release.Namespace }}
  labels:
    {{- include "microservice.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "microservice.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "microservice.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "microservice.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.targetPort }}
              protocol: TCP
          env:
            - name: ASPNETCORE_ENVIRONMENT
              value: {{ .Values.environment | default "Production" }}
            - name: ConnectionStrings__DefaultConnection
              valueFrom:
                secretKeyRef:
                  name: postgresql-connection
                  key: connection-string
            - name: Redis__ConnectionString
              valueFrom:
                secretKeyRef:
                  name: redis-connection
                  key: connection-string
            {{- with .Values.env }}
            {{- toYaml . | nindent 12 }}
            {{- end }}
          {{- with .Values.envFrom }}
          envFrom:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          livenessProbe:
            {{- toYaml .Values.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            {{- with .Values.volumeMounts }}
            {{- toYaml . | nindent 12 }}
            {{- end }}
      volumes:
        - name: tmp
          emptyDir: {}
        {{- with .Values.volumes }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
{{- end }}
```

### Service Template
```yaml
# charts/library/microservice/templates/service.yaml
{{- define "microservice.service" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "microservice.fullname" . }}
  namespace: {{ .Values.namespace | default .Release.Namespace }}
  labels:
    {{- include "microservice.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "microservice.selectorLabels" . | nindent 4 }}
  {{- if eq .Values.service.type "LoadBalancer" }}
  {{- with .Values.service.sessionAffinity }}
  sessionAffinity: {{ . }}
  {{- end }}
  {{- end }}
{{- end }}
```

### HPA Template
```yaml
# charts/library/microservice/templates/hpa.yaml
{{- define "microservice.hpa" -}}
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "microservice.fullname" . }}
  namespace: {{ .Values.namespace | default .Release.Namespace }}
  labels:
    {{- include "microservice.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "microservice.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
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
{{- end }}
{{- end }}
```

## Service-Specific Charts

### Campaign Service Chart
```yaml
# charts/dndai-platform/charts/campaign-service/Chart.yaml
apiVersion: v2
name: campaign-service
description: Campaign Service for D&D AI Platform
type: application
version: 1.0.0
appVersion: "1.0.0"
dependencies:
  - name: microservice
    version: "1.0.0"
    repository: "file://../../../library/microservice"
```

```yaml
# charts/dndai-platform/charts/campaign-service/values.yaml
# Campaign Service specific values
image:
  repository: dndai/campaign-service
  tag: ""
  pullPolicy: IfNotPresent

replicaCount: 2

resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

env:
  - name: SignalR__HubUrl
    value: "http://realtime-service/sessionhub"

nodeSelector:
  node-type: general-purpose

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

```yaml
# charts/dndai-platform/charts/campaign-service/templates/deployment.yaml
{{- include "microservice.deployment" . }}
```

### AI Gateway Service Chart
```yaml
# charts/dndai-platform/charts/ai-gateway-service/values.yaml
image:
  repository: dndai/ai-gateway-service
  tag: ""
  pullPolicy: IfNotPresent

replicaCount: 2

resources:
  requests:
    memory: "512Mi"
    cpu: "200m"
  limits:
    memory: "1Gi"
    cpu: "1000m"

env:
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

volumes:
  - name: cache
    emptyDir:
      sizeLimit: 1Gi
  - name: templates
    configMap:
      name: ai-templates

volumeMounts:
  - name: cache
    mountPath: /app/cache
  - name: templates
    mountPath: /app/templates
    readOnly: true

nodeSelector:
  node-type: compute-optimized

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

## Deployment Scripts and GitOps

### Helm Deployment Script
```bash
#!/bin/bash
# scripts/deploy-helm.sh
set -e

NAMESPACE="dndai-services"
RELEASE_NAME="dndai-platform"
CHART_PATH="./charts/dndai-platform"
ENVIRONMENT=${1:-"production"}

echo "Deploying D&D AI Platform using Helm..."
echo "Environment: $ENVIRONMENT"
echo "Release: $RELEASE_NAME"
echo "Namespace: $NAMESPACE"

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Add required Helm repositories
echo "Adding Helm repositories..."
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Deploy cert-manager first (if needed)
if ! kubectl get crd certificates.cert-manager.io > /dev/null 2>&1; then
    echo "Installing cert-manager..."
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --set installCRDs=true \
        --wait
fi

# Validate Helm chart
echo "Validating Helm chart..."
helm lint $CHART_PATH
helm template $RELEASE_NAME $CHART_PATH \
    --values $CHART_PATH/values-$ENVIRONMENT.yaml \
    --debug --dry-run > /dev/null

# Deploy the platform
echo "Deploying platform..."
helm upgrade --install $RELEASE_NAME $CHART_PATH \
    --namespace $NAMESPACE \
    --values $CHART_PATH/values-$ENVIRONMENT.yaml \
    --timeout 15m \
    --wait \
    --atomic

# Verify deployment
echo "Verifying deployment..."
helm test $RELEASE_NAME --namespace $NAMESPACE

echo "Deployment completed successfully!"
echo "Application URL: https://app.dndai.app"
echo "API URL: https://api.dndai.app"

# Show status
helm status $RELEASE_NAME --namespace $NAMESPACE
kubectl get pods --namespace $NAMESPACE
```

### ArgoCD Application Manifest
```yaml
# argocd/applications/dndai-platform.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: dndai-platform
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/dndai/campaign-manager
    targetRevision: main
    path: charts/dndai-platform
    helm:
      valueFiles:
        - values-production.yaml
      parameters:
        - name: global.imageTag
          value: "v1.0.0"
        - name: environment
          value: "production"
  destination:
    server: https://kubernetes.default.svc
    namespace: dndai-services
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
```

### Chart Testing
```yaml
# charts/dndai-platform/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "dndai-platform.fullname" . }}-test-connection"
  labels:
    {{- include "dndai-platform.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-weight": "1"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: wget
      image: busybox:1.36
      command: ['wget']
      args: ['{{ include "dndai-platform.fullname" . }}:{{ .Values.service.port }}']
      resources:
        requests:
          memory: "64Mi"
          cpu: "50m"
        limits:
          memory: "128Mi"
          cpu: "100m"
```

This Helm Charts specification provides:

1. **Comprehensive Platform Chart** - Umbrella chart managing all components
2. **Environment-Specific Configurations** - Dev, staging, production values
3. **Library Chart Pattern** - Reusable microservice templates
4. **Dependency Management** - External charts for databases, ingress, monitoring
5. **GitOps Ready** - ArgoCD integration for automated deployments
6. **Security Hardening** - Pod security contexts, network policies, RBAC
7. **Auto-scaling Configuration** - HPA for all services
8. **Monitoring Integration** - Prometheus service monitors
9. **Testing Framework** - Helm tests for deployment validation
10. **Production Optimizations** - Resource limits, node selectors, affinity rules

The Helm charts enable consistent, parameterized deployments across all environments while maintaining security, scalability, and operational best practices.

Would you like me to continue with the CI/CD Pipeline specifications next?
