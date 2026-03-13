# Kubernetes

This chart runs the current stack. No Express leftovers. No local-cluster tutorial junk. Just the parts that keep uploads, transcodes, and HLS delivery working.

## Chart path

- `charts/hls-microservice-backend-chart`

## What gets deployed

- `main-service`
  - Bun + Hono API
  - service port: `3000`
  - default replicas: `2`
  - CPU-based HPA enabled
- `video-processor`
  - Bun worker with RabbitMQ consumer and ffmpeg work
  - service port: `3001`
  - queue-based KEDA scaling enabled
- `hls-static`
  - unprivileged NGINX serving generated HLS output
  - service port: `8080`
  - default replicas: `2`
- shared PVC
  - access mode: `ReadWriteMany`
  - default size: `200Gi`
  - mounts uploads and HLS output into all workloads that need them
- optional ingress
  - `/api` -> `main-service`
  - `/hls` -> `hls-static`

## Why the PVC is `ReadWriteMany`

All three workloads touch the same media tree.

- API writes uploads to `UPLOAD_DIR`
- worker reads from `UPLOAD_DIR`
- worker writes playlists and segments to `HLS_OUTPUT_DIR`
- NGINX serves `HLS_OUTPUT_DIR` as static files

If you switch this to `ReadWriteOnce`, you are choosing pain.

## Storage layout

- upload path: `/usr/src/app/uploads`
- HLS path: `/usr/src/app/hls`
- PVC subpaths:
  - `uploads`
  - `hls`
- `hls-static` mounts the `hls` subpath read-only at `/usr/share/nginx/html/hls`

## API scaling

The API uses a plain HPA. That is enough.

- min replicas: `2`
- max replicas: `10`
- target CPU utilization: `70`
- scale up behavior:
  - up to `100%` per `60s`
  - or `2` pods per `60s`
- scale down stabilization: `300s`

Do not wire the API to queue depth. The API is request-driven, not backlog-driven.

## Worker scaling with KEDA

The worker scales off RabbitMQ queue length. That is the whole point.

- `ScaledObject` target: `video-processor` deployment
- trigger type: `rabbitmq`
- queue name: `video.transcode`
- mode: `QueueLength`
- activation value: `1`
- target value: `5`
- polling interval: `30s`
- cooldown period: `300s`
- min replicas: `1`
- max replicas: `10`

`TriggerAuthentication` reads `RABBITMQ_URL` from the chart secret. If that secret is wrong, KEDA does nothing and backlog grows.

## Worker concurrency inside each pod

KEDA scales pod count. `MAX_CONCURRENT_JOBS` scales work per pod.

- worker RabbitMQ prefetch = `MAX_CONCURRENT_JOBS`
- env default = `4`
- effective parallelism is roughly:

```text
worker pods * MAX_CONCURRENT_JOBS
```

Do not tune this blind. More concurrency means more ffmpeg processes, more CPU, more memory, and more IO against the shared volume.

## Probes and startup gates

Both main workloads block on dependencies before starting.

- init container waits for MongoDB on `27017`
- init container waits for RabbitMQ on `5672`
- API probes:
  - live: `/health/live`
  - ready: `/health/ready`
- worker probes:
  - live: `/health`
  - ready: `/ready`
- termination grace period:
  - API: `60s`
  - worker: `180s`

That long worker grace period is deliberate. Killing ffmpeg jobs mid-write is a good way to produce garbage files.

## Ingress and upload limits

If ingress is enabled, NGINX is configured with these annotations:

```yaml
nginx.ingress.kubernetes.io/load-balance: least_conn
nginx.ingress.kubernetes.io/proxy-body-size: "500m"
nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
nginx.ingress.kubernetes.io/proxy-buffering: "off"
```

`proxy-body-size` must stay aligned with the application limits.

- Bun server: `maxRequestBodySize = MAX_UPLOAD_BYTES`
- Hono upload route: `bodyLimit({ maxSize: MAX_UPLOAD_BYTES })`
- default app limit: `500 * 1024 * 1024`
- default ingress limit: `500m`

If one layer is lower than the others, uploads fail there first. Then you get support tickets about random `413` responses and broken uploads.

## Minimal install

```sh
helm upgrade --install hls ./charts/hls-microservice-backend-chart \
  --namespace video \
  --create-namespace \
  --set secret.data.mongoUri='mongodb://mongodb.video.svc.cluster.local:27017/hls-microservice' \
  --set secret.data.rabbitmqUrl='amqp://user:pass@rabbitmq.video.svc.cluster.local:5672'
```

Use a real values override file for anything beyond a smoke test.

## Values that matter first

```yaml
secret:
  data:
    mongoUri: mongodb://mongodb.video.svc.cluster.local:27017/hls-microservice
    rabbitmqUrl: amqp://user:pass@rabbitmq.video.svc.cluster.local:5672

config:
  rabbitmqQueue: video.transcode
  uploadDir: /usr/src/app/uploads
  hlsDir: /usr/src/app/hls

persistence:
  enabled: true
  accessModes:
    - ReadWriteMany

mainService:
  autoscaling:
    enabled: true

videoProcessor:
  keda:
    enabled: true

ingress:
  enabled: true
```

## Sanity checks after deploy

```sh
kubectl get pods -n video
kubectl get hpa -n video
kubectl get scaledobject -n video
kubectl get pvc -n video
kubectl describe scaledobject <scaledobject-name> -n video
```

- API pods should reach ready state and settle behind the HPA.
- worker pods should scale when `video.transcode` backlog grows.
- PVC must bind with `ReadWriteMany`. If it does not, the architecture does not work as designed.
- ingress uploads must accept files up to the configured limit. Test that before calling the release done.

## Things that will hurt you

- Disabling KEDA and pretending worker HPA on CPU is an equivalent substitute.
- Using a storage class that cannot provide `ReadWriteMany`.
- Changing queue names in one place and not the other two.
- Lowering ingress body size below the Bun and Hono upload limits.
- Shortening worker termination grace because you are impatient.