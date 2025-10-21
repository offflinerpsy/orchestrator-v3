# Docker Deployment Guide — Orchestrator V3

Containerized deployment for **Windows/WSL2** and Linux environments.

## Quick Start

### Development Mode (Hot Reload)

```powershell
# Start dev server in Docker
pnpm dev:docker

# Server will be available at http://localhost:3002
# Code changes will hot-reload automatically

# Stop and cleanup
pnpm dev:docker:down
```

### Production Mode

```powershell
# Build production image
pnpm docker:build

# Run production container
pnpm docker:run

# Or manually:
docker run --rm -p 3002:3002 --env-file .env.local orchestrator-admin:latest
```

---

## Windows/WSL2 Survival Kit

### ⚠️ Critical: File System Location

**For optimal performance**, clone the repository inside WSL2 filesystem:

```powershell
# ✅ GOOD (fast file watching)
\\wsl$\Ubuntu\home\user\orchestrator-v3

# ❌ BAD (slow polling, high CPU)
C:\Work\orchestrator-v3
```

**Why?** Docker Desktop on Windows uses WSL2 backend. Files on Windows NTFS require expensive polling for change detection. Files on WSL2 native filesystem use efficient inotify.

**Refs:**
- https://docs.docker.com/desktop/features/wsl/
- https://learn.microsoft.com/windows/wsl/tutorials/wsl-containers

### File Watching Configuration

The dev container uses **polling mode** for compatibility with Windows bind mounts:

```dockerfile
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_INTERVAL=300  # Poll every 300ms (reduce CPU)
```

**Refs:**
- https://github.com/paulmillr/chokidar
- https://syntackle.com/blog/the-issue-of-watching-file-changes-in-docker/
- https://stackoverflow.com/q/38318188

If hot-reload is slow:
1. Move repo to WSL2 filesystem (see above)
2. Increase `CHOKIDAR_INTERVAL` in `docker-compose.dev.yml` (trade-off: slower detection vs lower CPU)
3. Use VS Code Dev Containers (see below) for native-like performance

---

## VS Code Dev Containers

**Best developer experience**: code runs inside the container with full IntelliSense and debugging.

### Setup

1. Install **Dev Containers** extension in VS Code
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Select: **Dev Containers: Open Folder in Container...**
4. Choose the `orchestrator-v3` folder
5. VS Code will rebuild the container and reopen inside it

### Attach to Running Container

If dev container is already running via `pnpm dev:docker`:

1. Command Palette → **Dev Containers: Attach to Running Container...**
2. Select `orchestrator-admin-dev`
3. Open folder: `/app`

**Refs:**
- https://code.visualstudio.com/docs/devcontainers/containers

---

## Architecture

### Development Image (`Dockerfile.dev`)

- **Base**: `node:20-bookworm-slim`
- **Features**:
  - pnpm via Corepack
  - Polling-based file watching (Windows/WSL2 compatible)
  - Health check endpoint (`/api/health`)
  - Source code mounted as volume (hot-reload)
  - Port: `3002`

### Production Image (`Dockerfile`)

Multi-stage build:
1. **deps**: Install dependencies with pnpm
2. **builder**: Run `next build`
3. **runner**: Minimal image with built artifacts

**Optimizations**:
- Non-root user (`nextjs:nodejs`)
- Production-only dependencies
- Layer caching for faster rebuilds
- Health check built-in

**Refs:**
- https://nextjs.org/docs/app/guides/self-hosting
- https://nextjs.org/docs/app/getting-started/deploying

---

## Configuration

### Environment Variables

Create `.env.local` in project root (gitignored):

```bash
# Required
HF_TOKEN=hf_your_token_here
BFL_API_KEY=your_bfl_key_here
V0_API_KEY=v1:your_v0_key_here

# Optional
COMFYUI_URL=http://host.docker.internal:8188  # Access host services
DATA_DIR=/app/data
ALLOW_GENERATION=true
```

**Note**: Use `host.docker.internal` instead of `localhost` to access services running on your host machine from inside the container.

### Ports

- **3002**: Admin panel (Next.js)

If port 3002 is already in use, modify `docker-compose.dev.yml`:

```yaml
services:
  admin:
    ports:
      - "3003:3002"  # Map host 3003 to container 3002
```

---

## Troubleshooting

### Container exits immediately

**Symptoms**: `docker compose up` shows "exited with code 1" after "Ready in X.Xs"

**Causes**:
1. Port 3002 already in use on host
2. Missing `.env.local` with required keys
3. Windows services (OrchestratorGuardian, OrchestratorPanel) killing Node processes

**Solutions**:
```powershell
# Check if port is occupied
netstat -ano | findstr :3002

# Stop conflicting Windows services (requires admin)
Stop-Service OrchestratorGuardian
Stop-Service OrchestratorPanel

# Check container logs
docker compose -f docker-compose.dev.yml logs admin
```

### Hot reload not working

**Solution**: Move repository to WSL2 filesystem (see "Windows/WSL2 Survival Kit" above).

### High CPU usage

**Cause**: Polling interval too aggressive.

**Solution**: Increase `CHOKIDAR_INTERVAL` in `docker-compose.dev.yml`:

```yaml
environment:
  - CHOKIDAR_INTERVAL=1000  # Poll every 1 second (default: 300ms)
```

### "Cannot find module" errors

**Cause**: `node_modules` not installed or overwritten by host volume.

**Solution**: Rebuild container:

```powershell
pnpm dev:docker:down
pnpm dev:docker  # Fresh build
```

### Health check failing

**Symptoms**: `docker ps` shows container as `unhealthy`

**Check**:
```powershell
# Inside container
docker exec orchestrator-admin-dev curl http://localhost:3002/api/health

# From host
curl http://localhost:3002/api/health
```

**Expected response**:
```json
{
  "overall": "healthy",
  "timestamp": "2025-10-21T12:00:00.000Z",
  "services": { ... }
}
```

---

## Resource Limits

Default limits (adjust in `docker-compose.dev.yml`):

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
    reservations:
      cpus: '1'
      memory: 2G
```

For low-spec machines:
- Reduce to `memory: 2G` limit, `1G` reservation
- Consider disabling health checks (remove `healthcheck:` from Dockerfile)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build production image
        run: docker build -t orchestrator-admin:${{ github.sha }} .
      
      - name: Test health endpoint
        run: |
          docker run -d --name test -p 3002:3002 orchestrator-admin:${{ github.sha }}
          sleep 10
          curl -f http://localhost:3002/api/health || exit 1
          docker stop test
```

---

## Known Limitations

1. **Native dependencies**: `better-sqlite3` requires build tools in container (already included in `node:20-bookworm-slim`)
2. **Sentry**: Currently disabled in `next.config.js` for debugging (re-enable for production)
3. **File uploads**: Persistent volumes needed for user-uploaded files (not configured by default)

---

## References

- Next.js Docker Deployment: https://nextjs.org/docs/app/guides/self-hosting
- Next.js 15 Release: https://nextjs.org/blog/next-15
- Docker Desktop WSL2: https://docs.docker.com/desktop/features/wsl/
- VS Code Dev Containers: https://code.visualstudio.com/docs/devcontainers/containers
- Chokidar Polling: https://github.com/paulmillr/chokidar
- pnpm Installation: https://pnpm.io/installation

---

## Support

If issues persist after following this guide:
1. Check container logs: `docker compose logs admin`
2. Verify environment variables: `docker exec orchestrator-admin-dev env | grep -E 'NODE|NEXT|CHOKIDAR'`
3. Test outside Docker: `pnpm dev` (eliminate containerization as variable)
4. Consult `docs/_artifacts/revive-*/` for recent debugging sessions
