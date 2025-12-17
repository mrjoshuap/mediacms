# MediaCMS OpenShift 4.19 Deployment

This directory contains OpenShift 4.19 deployment configurations for MediaCMS using ArgoCD GitOps.

## Prerequisites

- OpenShift 4.19 cluster with cluster-admin access
- ArgoCD installed and configured
- `oc` CLI tool installed and configured
- Access to the Git repository (for BuildConfig)
- PostgreSQL database (can be deployed separately or use existing)
- Redis instance (can be deployed separately or use existing)

## Architecture

The deployment consists of:

- **Web Server**: Nginx reverse proxy (2+ replicas) serving static files and forwarding to uWSGI
- **uWSGI App**: Django application server (1+ replicas; scale based on CPU/RAM)
- **Celery Beat**: Scheduled tasks (1 replica, singleton)
- **Celery Short Workers**: Short-running tasks (2+ replicas)
- **Celery Long Workers**: Long-running video encoding tasks (2+ replicas)
- **Migrations Job**: One-time database migrations (runs before deployments)
- **PostgreSQL**: Application database (optional in-cluster `components/db.yaml`)
- **Redis**: Cache/broker (optional in-cluster `components/redis.yaml`)

## Directory Structure

```
deploy/openshift/
├── README.md                        # This file
├── base/
│   ├── mediacms-application.yaml    # ArgoCD Application manifest (defaults: main repo, main branch)
│   ├── mediacms-config.yaml         # Non-sensitive configuration (ConfigMap)
│   ├── mediacms-secrets.yaml        # Secret template with required keys
│   ├── namespace.yaml               # Namespace definition
│   ├── imagemagick-policy.yaml      # ImageMagick policy ConfigMap
│   ├── uwsgi-config.yaml            # uWSGI configuration ConfigMap
│   ├── web-config.yaml              # Nginx configuration ConfigMap
│   └── kustomization.yaml           # Kustomize base configuration
├── overlays/
│   ├── dev/
│   │   └── kustomization.yaml       # Dev overlay (fork repo, deploy/openshift-4.19 branch)
│   └── prod/
│       └── kustomization.yaml       # Prod overlay (uses base defaults)
├── builds/
│   ├── buildconfig-base.yaml        # Base image BuildConfig
│   ├── imagestream.yaml             # ImageStream definitions
│   └── kustomization.yaml           # Kustomize for builds
├── components/
│   ├── web.yaml                     # Web server Deployment
│   ├── uwsgi.yaml                   # uWSGI Service + Deployment
│   ├── celery-beat.yaml             # Celery Beat Deployment
│   ├── celery-short.yaml            # Celery Short Worker Deployment
│   ├── celery-long.yaml             # Celery Long Worker Deployment
│   ├── db.yaml                      # PostgreSQL Deployment
│   ├── redis.yaml                   # Redis Deployment (optional)
│   ├── migrations.yaml              # One-time migration Job (PreSync)
│   └── kustomization.yaml           # Kustomize for components
├── networking/
│   ├── route.yaml                   # OpenShift Route (Ingress)
│   └── kustomization.yaml           # Kustomize for networking
├── storage/
│   ├── media-pvc.yaml               # Media files PVC
│   ├── db-pvc.yaml                  # Database PVC
│   └── kustomization.yaml           # Kustomize for storage
├── scripts/                         # OpenShift-specific deployment scripts
│   ├── entrypoint.sh                # Container entrypoint, file permissions, logging setup
│   ├── prestart.sh                  # DB migrations, static files, service configuration
│   ├── start.sh                     # Supervisor startup script
│   └── README.md                    # Pointers to detailed script docs
```
## Kustomize Overlays

The deployment uses Kustomize overlays to support environment-specific configurations while maintaining sane defaults.

### Base Configuration

The `base/` directory contains the default configuration:
- **Repository**: `https://github.com/mediacms-io/mediacms.git`
- **Branch**: `main`
- **Application Path**: `deploy/openshift/base`

### Development Overlay

The `overlays/dev/` directory patches the base configuration for development:
- **Repository**: `https://github.com/mrjoshuap/mediacms.git` (fork)
- **Branch**: `deploy/openshift-4.19`
- Patches both the ArgoCD Application and BuildConfigs

### Production Overlay

The `overlays/prod/` directory uses base defaults (main repository) but can be extended with production-specific patches like:
- Higher replica counts
- Different resource limits
- Production-specific configurations

#### Common production patch examples

Add patches under `overlays/prod/` and reference them from the prod `kustomization.yaml`.

**Scale web + uWSGI replicas**
```yaml
# overlays/prod/patches/replicas.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: mediacms
spec:
  replicas: 3
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: uwsgi
  namespace: mediacms
spec:
  replicas: 2
```

**Increase uWSGI resources**
```yaml
# overlays/prod/patches/uwsgi-resources.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: uwsgi
  namespace: mediacms
spec:
  template:
    spec:
      containers:
      - name: mediacms
        resources:
          requests:
            cpu: "1000m"
            memory: "2Gi"
          limits:
            cpu: "4000m"
            memory: "4Gi"
```

**Set Route host and enforce edge TLS**
```yaml
# overlays/prod/patches/route.yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: web
  namespace: mediacms
spec:
  host: mediacms.example.com
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

Reference patches in `overlays/prod/kustomization.yaml`:
```yaml
patches:
  - patches/replicas.yaml
  - patches/uwsgi-resources.yaml
  - patches/route.yaml
```

### Using Overlays

Note: Do not apply `kustomization.yaml` with `-f`; the server will return `no matches for kind "Kustomization"`. Always render with `-k` or pipe `oc kustomize ... | oc apply -f -`.

**Development (using fork):**
```bash
# Apply dev overlay
oc apply -k deploy/openshift/overlays/dev/

# Or preview what will be applied
oc kustomize deploy/openshift/overlays/dev/

# Quick sanity check before applying
oc kustomize deploy/openshift/overlays/dev/ | head -n 20
```

**Production (using main repo):**
```bash
# Apply base (or prod overlay)
oc apply -k deploy/openshift/base/

# Or use prod overlay
oc apply -k deploy/openshift/overlays/prod/
```

**Creating ArgoCD Application from overlay:**
```bash
# Generate the patched Application manifest
oc kustomize deploy/openshift/overlays/dev/ | oc apply -f -

# Or apply directly
oc apply -k deploy/openshift/overlays/dev/
```

### Customizing Overlays

To create a new overlay or modify existing ones:

1. Create a new directory under `overlays/` (e.g., `overlays/staging/`)
2. Create a `kustomization.yaml` that references `../../base`
3. Add patches for any resources you want to override
4. Apply with `oc apply -k deploy/openshift/overlays/staging/`

Example patch structure:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

patches:
  - target:
      kind: Application
      name: mediacms
    patch: |-
      - op: replace
        path: /spec/source/repoURL
        value: https://github.com/your-fork/mediacms.git
```

## Container Build Process

### Build Configuration

The deployment uses OpenShift BuildConfig to build containers from source:

- **Multi-stage Dockerfile** with three stages (see `Dockerfile.openshift`):
  1. `build-image`: Downloads and extracts ffmpeg and Bento4 binaries
  2. `base`: Main runtime image with Python dependencies (default target)

- **Build Context**: Root directory of the repository
- **Dockerfile**: `./Dockerfile.openshift` at repository root
- **Build Arguments**: `DEVELOPMENT_MODE` (defaults to `False`)
- **External Downloads**: Requires internet access for ffmpeg and Bento4

### BuildConfig Details

- **Base Image BuildConfig**: Builds the `base` target (standard deployment) from `Dockerfile.openshift`
- **ImageStreams**: Tracks built images for automatic deployment triggers
- **Build Triggers**: ConfigChange, ImageChange, and optional GitHub webhook

### OpenShift Dockerfile Notes

- Supervisor is removed; each pod runs a single process (nginx, uwsgi, or celery).
- ImageMagick policy is not baked into the image—`policy.xml` must come from the `imagemagick-policy` ConfigMap.
- OpenShift scripts are executable by default; writable directories are pre-created for arbitrary UIDs (`logs`, `media_files`, `static`, `staticfiles`, `/tmp/mediacms`).

### Frontend Assets

**Important**: Frontend static assets are expected to be pre-built before the container build. The Dockerfile copies static files from the `static/` directory but does not build them. If you need to build frontend assets:

1. Build them locally or in CI/CD before pushing to the branch
2. Or create a separate build pipeline that builds frontend assets and commits them
3. Or modify the BuildConfig to include a frontend build step

## OpenShift-Specific Scripts

The OpenShift deployment uses its own set of scripts located in `deploy/openshift/scripts/`. These scripts are adapted copies of the Docker deployment scripts (`deploy/docker/`) with OpenShift-specific modifications.

### Script Separation

The OpenShift deployment is completely separated from the Docker deployment:

- **OpenShift scripts**: `deploy/openshift/scripts/` - Used by OpenShift/Kubernetes deployments
- **Docker scripts**: `deploy/docker/` - Used by Docker Compose deployments (unchanged)

This separation allows:
- Independent evolution of OpenShift and Docker deployment configurations
- OpenShift-specific optimizations without affecting Docker deployments
- Clear distinction between deployment platforms

### Key Scripts

- **`prestart.sh`**: Handles database migrations, static file collection, and service configuration. Referenced by the migrations job.
- **`entrypoint.sh`**: Container entrypoint that sets up file permissions, logging, and environment. Note: In OpenShift, `local_settings.py` is typically provided via ConfigMap volume mount rather than copied from the scripts directory.
- **`start.sh`**: Starts the supervisor process manager with appropriate service configurations.

### Script Adaptations

The OpenShift scripts have been adapted from their Docker counterparts:

1. **Path Updates**: All internal script references use `deploy/openshift/scripts/` instead of `deploy/docker/`
2. **ConfigMap Integration**: `entrypoint.sh` checks for `local_settings.py` in the scripts directory but primarily relies on ConfigMap volume mounts in OpenShift
3. **Supervisor Configurations**: All supervisor config files reference OpenShift script paths

### Usage in Manifests

The migrations job explicitly references the OpenShift script:
```yaml
command: ["./deploy/openshift/scripts/prestart.sh"]
```

Other deployments (web, celery workers) rely on the OpenShift Dockerfile defaults, which point to `deploy/openshift/scripts/entrypoint.sh` and `deploy/openshift/scripts/start.sh` (single-process, no supervisord). Docker-oriented scripts remain in the image but are unused by default on OpenShift.

## Deployment Methods

### Method 1: ArgoCD GitOps (Recommended)

1. **Create Secrets** (one-time setup):
   ```bash
   oc create secret generic mediacms-secrets \
     --from-literal=SECRET_KEY='your-secret-key-here' \
     --from-literal=DB_PASSWORD='your-db-password' \
     --from-literal=ADMIN_PASSWORD='your-admin-password' \
     --namespace=mediacms
   
   oc label secret mediacms-secrets \
     app.kubernetes.io/name=mediacms \
     app.kubernetes.io/part-of=mediacms \
     app.kubernetes.io/managed-by=argocd \
     -n mediacms
   ```

2. **Create ArgoCD Application**:

   **For Production (main repository):**
   ```bash
   oc apply -k deploy/openshift/base/
   # Or specifically apply the Application
   oc apply -f deploy/openshift/base/mediacms-application.yaml
   ```

   **For Development (fork repository):**
   ```bash
   # Apply dev overlay which patches the Application
   oc apply -k deploy/openshift/overlays/dev/
   ```

3. **ArgoCD will automatically**:
   - Create the namespace
   - Create BuildConfigs and trigger builds
   - Deploy all components
   - Monitor and maintain desired state

4. **Monitor deployment**:
   ```bash
   # Check ArgoCD application status
   oc get application mediacms -n openshift-gitops
   
   # Check build status
   oc get builds -n mediacms
   
   # Check pod status
   oc get pods -n mediacms
   ```

### Method 2: Manual Deployment

**Using Base (Production):**
```bash
# Apply all base resources
oc apply -k deploy/openshift/base/
```

**Using Dev Overlay:**
```bash
# Apply all dev resources (with patches)
oc apply -k deploy/openshift/overlays/dev/
```

**Step-by-step (if needed):**

1. **Create Namespace**:
   ```bash
   oc apply -f deploy/openshift/base/namespace.yaml
   ```

2. **Create Secrets** (see Method 1, step 1)

3. **Create ConfigMap and other base resources**:
   ```bash
   oc apply -k deploy/openshift/base/
   ```

4. **Create BuildConfigs and ImageStreams** (already included in base):
   ```bash
   # Or apply separately if needed
   oc apply -k deploy/openshift/builds/
   ```

5. **Trigger Initial Build**:
   ```bash
   oc start-build mediacms-base -n mediacms
   # Wait for build to complete
   oc get builds -n mediacms -w
   ```

6. **Deploy Components** (already included in base):
   ```bash
   # Or apply separately if needed
   oc apply -k deploy/openshift/components/
   ```

7. **Create Route** (already included in base):
   ```bash
   # Or apply separately if needed
   oc apply -k deploy/openshift/networking/
   ```

8. **Create Storage** (already included in base):
   ```bash
   # Or apply separately if needed
   oc apply -k deploy/openshift/storage/
   ```

## Configuration

### ConfigMap

The `base/mediacms-config.yaml` contains non-sensitive configuration. Edit it to customize:

- Application settings (portal name, theme, etc.)
- Database connection (host, port, name)
- Redis connection
- Media paths
- Feature flags

### Secrets

**Never commit actual secrets to Git!**

Use `base/mediacms-secrets.yaml` as the template (placeholders included), then create the actual secret:

```bash
oc create secret generic mediacms-secrets \
  --from-literal=SECRET_KEY='generate-with-django' \
  --from-literal=DB_PASSWORD='your-password' \
  --from-literal=ADMIN_PASSWORD='admin-password' \
  --from-literal=ADMIN_USER='admin' \
  --from-literal=ADMIN_EMAIL='admin@example.com' \
  -n mediacms
```

Generate Django secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Database and Redis

This deployment assumes PostgreSQL and Redis are available. You can:

1. Deploy them separately in OpenShift
2. Use external managed services
3. Use OpenShift operators (PostgreSQL Operator, Redis Operator)

Update the ConfigMap with the correct hostnames:
- `DB_HOST`: Service name or external hostname
- `REDIS_HOST`: Service name or external hostname

## Storage

### Persistent Volume Claims

Defined PVCs:
- **Media** (`media-files-pvc`): see `storage/media-pvc.yaml`
  - Size: 100Gi (adjust in `storage/media-pvc.yaml`)
  - Access Mode: ReadWriteMany (preferred) or ReadWriteOnce
- **Database** (`mediacms-db-pvc`): see `storage/db-pvc.yaml`
  - Size: 20Gi (adjust in `storage/db-pvc.yaml`)
  - Access Mode: ReadWriteOnce
- Storage Class: uses cluster default unless `storageClassName` is set

**Note**: If ReadWriteMany is not supported, you may need to:
- Use a shared storage solution (NFS, CephFS, etc.)
- Or use ReadWriteOnce and ensure only one pod mounts it
- Or use a distributed file system

## Networking

### Route Configuration

Edit `networking/route.yaml` to set:

- **Hostname**: Uncomment and set `spec.host`
- **TLS**: Currently set to edge termination with redirect
- **TLS Certificate**: OpenShift will use default certificate, or configure custom

### Network Policies

Optional network policies can be added to `networking/network-policy.yaml` for additional security.

## Resource Requirements

### Default Resource Limits

- **Web**: 2 CPU, 2Gi memory (requests: 500m CPU, 1Gi memory)
- **Celery Beat**: 1 CPU, 1Gi memory (requests: 200m CPU, 512Mi memory)
- **Celery Short**: 2 CPU, 2Gi memory (requests: 500m CPU, 1Gi memory)
- **Celery Long**: 4 CPU, 4Gi memory (requests: 1 CPU, 2Gi memory)

Adjust these in the deployment files based on your workload.

### uWSGI concurrency sizing

- Default config: `workers = 2`, `threads = 1`, sized for the current `limits.cpu: 2000m` in `components/uwsgi.yaml`.
- If lowering the uWSGI pod to ~1 vCPU, set `workers = 1` (keep `threads = 1`).
- Prefer horizontal scaling (more pods/HPA) over adding threads; extra workers/threads increase DB connections and memory per pod.
- If increasing workers, raise CPU/memory limits accordingly to avoid CPU throttling and OOM kills.

### Web (nginx) sizing

- Nginx concurrency is modest: `worker_processes auto`, `worker_connections 1024`, `worker_rlimit_nofile 2048` in `base/web-config.yaml`. Adjust upward only if CPU/memory limits are raised.
- Web deployment is 2 replicas by default; prefer HPA for more capacity.
- Session affinity is disabled by default. Only enable sticky sessions if strictly required by clients (e.g., very large uploads) and ensure at least 2 replicas to avoid hotspots.
- Keep large `client_max_body_size` if you expect big uploads; otherwise consider reducing it and aligning ingress/WAF limits.

### Celery sizing

- General: Scale replicas first; increase per-pod concurrency only when replicas are insufficient. Match resource limits to concurrency and task cost.
- Beat: 1 replica, 1 vCPU/1Gi limit; no extra tuning needed.
- Short workers (web/short tasks): defaults set via env in `components/celery-short.yaml` → concurrency 4, prefetch 4, max-tasks-per-child 100, soft/hard time limits 300s/360s. Increase replicas before raising concurrency; adjust CPU/memory if concurrency rises.
- Long workers (transcoding): defaults in `components/celery-long.yaml` → concurrency 1, prefetch 1, max-tasks-per-child 20, soft/hard time limits 3600s/5400s. Add replicas for more throughput; keep prefetch low to avoid head-of-line blocking; ensure CPU/memory match transcode load (limits 4 vCPU/4Gi by default).
- Prefetch guidance: keep prefetch small (1–4) for heavy or variable-duration tasks; larger prefetch can starve other queues.
- Recycling: `max-tasks-per-child` prevents leaks; tune upward cautiously if startup overhead dominates.

## Health Checks

All deployments include:

- **Liveness Probes**: Restart pods if unhealthy
- **Readiness Probes**: Remove from service if not ready

Web server uses HTTP checks on port 80. Celery workers use process checks.

## Troubleshooting

### Build Failures

1. **Check build logs**:
   ```bash
   oc logs build/mediacms-base-<number> -n mediacms
   ```

2. **Common issues**:
   - Network access: Build pods need internet to download ffmpeg/Bento4
   - Resource limits: Increase if builds are killed
   - Dockerfile errors: Check Dockerfile syntax

### Pod Failures

1. **Check pod logs**:
   ```bash
   oc logs <pod-name> -n mediacms
   ```

2. **Check pod events**:
   ```bash
   oc describe pod <pod-name> -n mediacms
   ```

3. **Common issues**:
   - Database connection: Verify DB_HOST and credentials
   - Redis connection: Verify REDIS_HOST
   - Storage: Check PVC is bound and accessible
   - Secrets: Verify all required secrets exist

### ArgoCD Sync Issues

1. **Check application status**:
   ```bash
   oc get application mediacms -n openshift-gitops -o yaml
   ```

2. **Check sync logs**:
   ```bash
   oc logs -l app.kubernetes.io/name=argocd-application-controller -n openshift-gitops
   ```

3. **Force sync** (if needed):
   ```bash
   argocd app sync mediacms
   ```

### Database Migrations

Migrations run automatically via the Job before deployments (ArgoCD PreSync hook).

To manually run migrations:
```bash
oc create job --from=job/migrations migrations-manual -n mediacms
```

## Upgrades

1. **Update the branch** or change the target revision in ArgoCD Application
2. **ArgoCD will detect changes** and sync automatically
3. **BuildConfig will trigger** a new build if source changes
4. **Deployments will update** when new images are available

For manual upgrades:
```bash
# Update source code
git checkout deploy/openshift-4.19
git pull

# Trigger new build
oc start-build mediacms-base -n mediacms

# Wait for build, then restart deployments
oc rollout restart deployment/web -n mediacms
```

## Branch-Specific Notes

This branch (`deploy/openshift-4.19`) combines:
- Fix for issue #1447 (missing migration for Meta options)
- Quick bug fixes (regex denoter fix, celerybeat gitignore)

The branch is tracked separately from `main` for OpenShift-specific deployment configurations.

## Additional Resources

- [OpenShift Documentation](https://docs.openshift.com/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [MediaCMS Documentation](https://github.com/mediacms-io/mediacms)

## Support

For issues specific to this deployment:
1. Check the troubleshooting section above
2. Review OpenShift and ArgoCD logs
3. Consult MediaCMS documentation for application-specific issues
