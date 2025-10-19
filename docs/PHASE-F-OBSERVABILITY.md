# Phase F: Observability Setup

## ✅ Automated (Code Changes)

### F1: Sentry SDK (DONE)
- ✅ Installed `@sentry/nextjs` v10.20.0
- ✅ Created `sentry.client.config.ts` (10% sampling, session replay)
- ✅ Created `sentry.server.config.ts` (filters sensitive data)
- ✅ Created `sentry.edge.config.ts` (edge runtime support)
- ✅ Updated `next.config.js` with `withSentryConfig`

**Required ENV variables:**
```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=orchestrator-admin
SENTRY_AUTH_TOKEN=your-token  # For sourcemap uploads
```

### F2: Prometheus Metrics (DONE)
- ✅ Installed `prom-client` v15.1.3
- ✅ Created `/api/metrics` endpoint
- ✅ Default metrics: CPU, memory, Node.js internals
- ✅ Custom counters:
  - `orchestrator_http_requests_total`
  - `orchestrator_comfy_api_calls_total`
  - `orchestrator_flux_generations_total`
- ✅ Histogram: `orchestrator_http_request_duration_seconds`

**Access metrics:**
```bash
curl http://localhost:3000/api/metrics
```

---

## 🔧 Manual Setup Required

### F3: Windows Exporter (20 min)

**1. Download:**
```powershell
Invoke-WebRequest -Uri "https://github.com/prometheus-community/windows_exporter/releases/download/v0.27.2/windows_exporter-0.27.2-amd64.msi" -OutFile "$env:TEMP\windows_exporter.msi"
```

**2. Install:**
```powershell
Start-Process msiexec.exe -ArgumentList "/i `"$env:TEMP\windows_exporter.msi`" ENABLED_COLLECTORS=cpu,memory,logical_disk,net,os,system /quiet" -Wait
```

**3. Verify:**
```powershell
curl http://localhost:9182/metrics
```

**4. Configure as NSSM service (if not using MSI installer):**
```powershell
nssm install WindowsExporter "C:\Program Files\windows_exporter\windows_exporter.exe" "--collectors.enabled cpu,memory,logical_disk,net,os,system"
nssm set WindowsExporter AppStdout "F:\Logs\windows_exporter-stdout.log"
nssm set WindowsExporter AppStderr "F:\Logs\windows_exporter-stderr.log"
nssm set WindowsExporter AppRotateFiles 1
nssm set WindowsExporter AppRotateBytes 10485760
nssm start WindowsExporter
```

---

### F4: Loki + Promtail (40 min)

**1. Download Loki & Promtail:**
```powershell
$lokiVersion = "3.0.0"
$lokiUrl = "https://github.com/grafana/loki/releases/download/v$lokiVersion/loki-windows-amd64.exe.zip"
$promtailUrl = "https://github.com/grafana/loki/releases/download/v$lokiVersion/promtail-windows-amd64.exe.zip"

Invoke-WebRequest -Uri $lokiUrl -OutFile "$env:TEMP\loki.zip"
Invoke-WebRequest -Uri $promtailUrl -OutFile "$env:TEMP\promtail.zip"

Expand-Archive -Path "$env:TEMP\loki.zip" -DestinationPath "C:\Program Files\Loki" -Force
Expand-Archive -Path "$env:TEMP\promtail.zip" -DestinationPath "C:\Program Files\Promtail" -Force
```

**2. Create Loki config:**
```yaml
# C:\Program Files\Loki\loki-config.yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  instance_addr: 127.0.0.1
  path_prefix: F:/Loki
  storage:
    filesystem:
      chunks_directory: F:/Loki/chunks
      rules_directory: F:/Loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093

limits_config:
  retention_period: 30d
  ingestion_rate_mb: 10
  ingestion_burst_size_mb: 20
```

**3. Create Promtail config:**
```yaml
# C:\Program Files\Promtail\promtail-config.yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: F:/Logs/promtail-positions.yaml

clients:
  - url: http://localhost:3100/loki/api/v1/push

scrape_configs:
  # Guardian logs
  - job_name: guardian
    static_configs:
      - targets:
          - localhost
        labels:
          job: guardian
          __path__: F:/Logs/guardian*.log

  # AdminPanel logs
  - job_name: adminpanel
    static_configs:
      - targets:
          - localhost
        labels:
          job: adminpanel
          __path__: F:/Logs/adminpanel*.log

  # ComfyUI logs
  - job_name: comfyui
    static_configs:
      - targets:
          - localhost
        labels:
          job: comfyui
          __path__: F:/Logs/comfyui*.log
```

**4. Install as NSSM services:**
```powershell
# Create F:\Loki directory
New-Item -ItemType Directory -Path "F:\Loki" -Force
New-Item -ItemType Directory -Path "F:\Loki\chunks" -Force
New-Item -ItemType Directory -Path "F:\Loki\rules" -Force

# Install Loki
nssm install OrchestratorLoki "C:\Program Files\Loki\loki-windows-amd64.exe" "-config.file=`"C:\Program Files\Loki\loki-config.yaml`""
nssm set OrchestratorLoki AppDirectory "C:\Program Files\Loki"
nssm set OrchestratorLoki AppStdout "F:\Logs\loki-stdout.log"
nssm set OrchestratorLoki AppStderr "F:\Logs\loki-stderr.log"
nssm set OrchestratorLoki AppRotateFiles 1
nssm set OrchestratorLoki AppRotateBytes 10485760
nssm start OrchestratorLoki

# Install Promtail
nssm install OrchestratorPromtail "C:\Program Files\Promtail\promtail-windows-amd64.exe" "-config.file=`"C:\Program Files\Promtail\promtail-config.yaml`""
nssm set OrchestratorPromtail AppDirectory "C:\Program Files\Promtail"
nssm set OrchestratorPromtail AppStdout "F:\Logs\promtail-stdout.log"
nssm set OrchestratorPromtail AppStderr "F:\Logs\promtail-stderr.log"
nssm set OrchestratorPromtail AppRotateFiles 1
nssm set OrchestratorPromtail AppRotateBytes 10485760
nssm start OrchestratorPromtail
```

**5. Verify:**
```powershell
# Check Loki
curl http://localhost:3100/ready

# Check Promtail
curl http://localhost:9080/ready

# Query logs
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={job="guardian"}'
```

---

## 🔍 Testing Phase F

### Test Sentry (Client-side)
1. Add DSN to `.env.local`
2. Visit AdminPanel, open browser console
3. Run: `throw new Error("Test Sentry error")`
4. Check Sentry dashboard

### Test Sentry (Server-side)
1. Create test API route that throws error
2. Call it via curl
3. Check Sentry dashboard

### Test Prometheus Metrics
```bash
curl http://localhost:3000/api/metrics
```
Should return metrics in Prometheus format

### Test Windows Exporter
```bash
curl http://localhost:9182/metrics | Select-String "windows_cpu"
```

### Test Loki + Promtail
```bash
# Wait 30s for logs to be scraped
Start-Sleep -Seconds 30

# Query Guardian logs
curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={job="guardian"}' | ConvertFrom-Json | Select-Object -ExpandProperty data
```

---

## 📊 Grafana Setup (Optional)

**1. Download Grafana:**
```powershell
Invoke-WebRequest -Uri "https://dl.grafana.com/oss/release/grafana-10.4.1.windows-amd64.zip" -OutFile "$env:TEMP\grafana.zip"
Expand-Archive -Path "$env:TEMP\grafana.zip" -DestinationPath "C:\Program Files\Grafana" -Force
```

**2. Install as service:**
```powershell
nssm install GrafanaServer "C:\Program Files\Grafana\grafana-10.4.1\bin\grafana-server.exe"
nssm set GrafanaServer AppDirectory "C:\Program Files\Grafana\grafana-10.4.1\bin"
nssm set GrafanaServer AppStdout "F:\Logs\grafana-stdout.log"
nssm set GrafanaServer AppStderr "F:\Logs\grafana-stderr.log"
nssm start GrafanaServer
```

**3. Configure data sources:**
- Prometheus: `http://localhost:9182` (Windows Exporter)
- Prometheus: `http://localhost:3000/api/metrics` (AdminPanel)
- Loki: `http://localhost:3100`

**4. Import dashboards:**
- Windows Node Exporter: Dashboard ID `14694`
- Loki Logs: Dashboard ID `13639`

---

## Phase F Complete Checklist
- [x] Sentry SDK installed and configured
- [x] Prometheus metrics endpoint created
- [ ] Windows Exporter installed as service
- [ ] Loki installed as service
- [ ] Promtail installed as service
- [ ] All services started and verified
- [ ] Grafana installed (optional)
- [ ] Test error captured in Sentry
- [ ] Test metrics scraped from /api/metrics
- [ ] Test logs flowing to Loki

**Estimated total time:** F1-F2 automated (10 min) + F3-F4 manual (60 min) = **70 minutes**
