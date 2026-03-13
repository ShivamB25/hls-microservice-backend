# System Explanation

This project converts raw video files into HLS (`.m3u8` and `.ts` segments) using an asynchronous worker pattern. It was rewritten in 2025 to run natively on Bun.

## Components

### 1. API Gateway (Hono)
- **Role:** Ingest uploads and serve metadata.
- **Stack:** Hono, Bun.serve, Zod.
- **Behavior:** Parses multipart `video` streams using `c.req.parseBody()`, validates payloads with Zod, and dumps the file directly to a shared persistent volume via `Bun.write()`. Saves the record to MongoDB (`status: 'uploaded'`) and drops a `VideoJob` message onto RabbitMQ.

### 2. Video Processor (Worker)
- **Role:** Transcode videos.
- **Stack:** Bun, fluent-ffmpeg, Mongoose.
- **Behavior:** Consumes from RabbitMQ. It uses `findOneAndUpdate` to lock the DB record to prevent duplicate processing if a message is redelivered. Calls `fluent-ffmpeg` to generate HLS segments. If `fluent-ffmpeg` fails inside Bun, it falls back to a raw `Bun.spawn` child process execution. Updates the DB state to `processed` or `failed` and acks/nacks the message.

### 3. Messaging (RabbitMQ)
- **Role:** Decouple ingest from the CPU-heavy transcode process.
- **Topology:** Messages go to a topic exchange (`video.events`) and route to a Quorum queue (`video.transcode`).
- **Failure Handling:** There is no active retry loop. If a worker nacks a message without requeuing, RabbitMQ routes it through a fanout Dead Letter Exchange (`video.events.dlx`) to a Quorum Dead Letter Queue (`video.transcode.dlq`).
- **Manager:** The custom `RabbitManager` enforces idempotency, jittered exponential backoff for connection failures, and safe consumer re-registration if the channel collapses.

### 4. Infrastructure (Kubernetes & Helm)
- **Storage:** Both the API (uploading) and the worker (transcoding) mount a `ReadWriteMany` (RWX) PersistentVolumeClaim. The API writes the raw `.mp4`, and the worker reads it and writes the `.m3u8`/`.ts` output to the same volume.
- **Scaling (API):** HorizontalPodAutoscaler (HPA) scales the API gateway pods based on CPU utilization.
- **Scaling (Worker):** KEDA `ScaledObject` scales the worker pods based on the length of the `video.transcode` RabbitMQ queue. If the queue is empty, workers can scale to 0.
- **Ingress:** NGINX ingress configured with `proxy-body-size: 500m` to match the Hono `bodyLimit` middleware, and `least_conn` load balancing.

### 5. Monorepo (Bun Workspaces)
- The repository uses Bun's native workspace feature. Shared logic (RabbitMQ topology, Pino structured JSON logging, Zod schemas, AppError hierarchy) lives in `packages/shared`. Both the API and the worker pull it locally via `"@hls/shared": "workspace:*"`.

## Data Flow

1. `POST /api/upload` -> Hono validates -> `Bun.write()` -> Mongo `uploaded` -> RabbitMQ publish.
2. Worker picks up job -> Mongo `processing` -> FFmpeg runs -> HLS files written -> Mongo `processed` -> Ack message.
3. If FFmpeg fails -> Mongo `failed` -> Nack message -> RabbitMQ routes to DLQ.