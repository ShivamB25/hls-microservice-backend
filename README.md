# HLS Video Processing Microservice

A highly scalable and efficient system for transforming video files into HLS (HTTP Live Streaming) format using a microservices architecture.

## 🚀 2025 Architecture Rewrite

This project has been completely rewritten from its original Node.js/Express stack to a high-performance **Bun + Hono** architecture. 

### Key Upgrades:
- **Bun Native**: Replaced Node.js, `npm`, and `ts-node`. Bun is now the runtime (`Bun.serve`), package manager (Bun Workspaces), bundler, and test runner.
- **Hono.js**: Replaced Express with the blazing-fast Hono framework, utilizing `Bun.write` for zero-overhead multi-part file uploads (replacing `multer`).
- **Zod Validation**: Replaced manual checks with strict `Zod` schemas and `@hono/zod-validator`.
- **Resilient RabbitMQ**: Replaced raw `amqplib` with a robust `RabbitManager` featuring exponential backoff, jitter, quorum queues, and a Dead Letter Queue (DLQ).
- **Structured Logging**: Replaced `winston` with `pino` for low-overhead, request-scoped JSON logging.
- **Monorepo**: Extracted shared logic into a `@hls/shared` workspace package to eliminate cross-service coupling.
- **Production Kubernetes**: Fully rewritten Helm chart with KEDA (queue-based scaling), HPAs, proper probes, and ReadWriteMany PVCs.

---

## Overview

The system consists of two microservices that communicate asynchronously via RabbitMQ to process heavy video payloads without blocking the API:

1. **API Gateway (`src/`)**: A stateless Hono server that receives uploads, validates them with Zod, writes them to disk, and queues them in RabbitMQ.
2. **Video Processor (`video-processing-service/`)**: A stateful worker that consumes RabbitMQ jobs, transcodes the video to HLS via `fluent-ffmpeg` (with a native `Bun.spawn` fallback), and manages the Mongoose state machine.

### Project Structure

```text
hls-microservice-backend/
├── package.json              # Bun workspace root
├── packages/
│   └── shared/               # @hls/shared workspace (RabbitManager, Pino, Errors)
├── src/                      # API Gateway (Hono)
│   ├── server.ts             # Bun.serve() entry point
│   ├── routes/               # Hono routers (upload, videos, health)
│   └── schemas/              # Zod validation schemas
├── video-processing-service/ # Worker Service
│   ├── src/worker.ts         # Consumer entry point
│   ├── src/consumers/        # RabbitMQ message handlers
│   └── src/services/         # FFmpeg transcoder and storage
├── models/                   # Mongoose schemas (shared)
├── Dockerfile                # Multi-stage Bun build for API
└── charts/hls-microservice-backend-chart/ # Production Helm Chart
```

## Getting started

### Requirements
- [Bun](https://bun.sh/) (v1.x)
- MongoDB (v8.x recommended)
- RabbitMQ (v4.x with management plugin recommended)
- FFmpeg (installed locally for dev)
- Docker & Kubernetes (optional, for prod deployment)

### Quickstart

1. **Clone the repository**
   ```sh
   git clone https://github.com/ShivamB25/hls-microservice-backend.git
   cd hls-microservice-backend
   ```

2. **Install dependencies using Bun**
   ```sh
   bun install
   ```
   *(This installs dependencies for the root, the shared package, and the worker simultaneously via Bun workspaces).*

3. **Set up environment variables**
   ```sh
   cp .env.example .env
   ```
   *(Ensure MongoDB and RabbitMQ are running locally or via Docker Compose).*

4. **Run the services locally**
   - Run the API Gateway (Port 3000):
     ```sh
     bun run dev
     ```
   - Run the Video Processor (Port 3001):
     ```sh
     bun run dev:worker
     ```

5. **Docker Compose (Local Infra)**
   ```sh
   docker compose up -d
   ```

6. **Optional: build the edge-friendly API entrypoint**
   ```sh
   bun run build:edge
   ```
   This builds `src/edge.ts`, which keeps the Hono API router portable for platforms that expect a `fetch()` handler.

## Documentation

For detailed architecture and deployment information, see:

1. [Code Architecture](./docs/code-architecture.md) - Deep dive into the Bun/Hono monorepo, data flow, and error handling.
2. [RabbitMQ Usage](./docs/rabbitmq.md) - Details on Quorum queues, the Dead Letter Exchange, and the custom RabbitManager.
3. [Kubernetes Deployment Guide](./docs/kubernetes.md) - How to deploy the Helm chart with KEDA scaling and ReadWriteMany PVCs.

## Deployment Target Compatibility

Current code is **Bun container-native**. Hono is multi-runtime, but this repository uses Bun-specific and server/container-only primitives.

| Target | Status | Notes |
|---|---|---|
| Docker / Kubernetes | ✅ Supported | Primary deployment path for this repo. |
| VM / Bare metal (Bun) | ✅ Supported | Run with `bun run start` and external Mongo/RabbitMQ/FFmpeg installed. |
| Cloudflare Workers | ⚠️ Partial | `src/edge.ts` provides a portable Hono fetch entrypoint, but upload persistence, MongoDB, RabbitMQ, and ffmpeg still require container mode or service replacement. |
| Vercel Edge / Netlify Edge | ❌ Not direct | Same constraints as Workers for filesystem/TCP/processes. |

### Why Cloudflare is not direct right now

- API uses `Bun.serve()` and upload path uses `Bun.write()` to local disk.
- Worker uses `fluent-ffmpeg` and `Bun.spawn` to execute ffmpeg.
- Data plane uses MongoDB and RabbitMQ over TCP (`mongoose`, `amqplib`).

### What the extra portability mode gives you

- A real Hono `fetch()` entrypoint in `src/edge.ts`.
- Runtime-aware upload behavior: on non-Bun runtimes, binary ingestion returns `501` instead of pretending to work.
- Shared router/middleware logic that stays reusable across Bun server mode and edge-style fetch mode.

### Path to Cloudflare-friendly architecture

1. Keep the worker in containers/Kubernetes for ffmpeg.
2. Optionally move API ingress to Workers with Hono adapter.
3. Replace local disk with object storage (e.g., R2/S3).
4. Replace broker/DB access with edge-compatible services or HTTP APIs.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.
