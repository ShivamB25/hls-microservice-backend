# Code Architecture

## Overview

The `hls-microservice-backend` project is designed to transform video files into HLS (HTTP Live Streaming) format using a microservices architecture. It has been fully rewritten in 2025 to utilize **Bun** as the native runtime and **Hono** as the web framework.

## Architecture Components

### API Gateway (Hono)
The Hono server handles HTTP requests for uploading videos and fetching processed videos. It interacts with MongoDB to store and retrieve video metadata and publishes messages to RabbitMQ to queue video processing tasks.

- **Key responsibilities:**
  - Handle high-performance video uploads using `c.req.parseBody()` and `Bun.write()`.
  - Validate all inputs strictly using Zod and `@hono/zod-validator`.
  - Store video metadata in MongoDB.
  - Publish tasks to RabbitMQ.
  - Serve structured JSON logs via Pino.

### Video Processing Service (Worker)
The worker listens to RabbitMQ for video processing tasks. Upon receiving a task, it utilizes `fluent-ffmpeg` (with a native `Bun.spawn` fallback) to convert the video to HLS format. After processing, it conditionally updates the video's status in MongoDB to prevent duplicate processing.

- **Key responsibilities:**
  - Consume RabbitMQ video processing tasks.
  - Transcode videos to HLS format robustly.
  - Manage the MongoDB state machine (`uploaded` -> `processing` -> `processed` / `failed`).
  - Expose health metrics via a minimal internal Hono app on port 3001.

### MongoDB
MongoDB is used to store metadata about videos. The schema uses strict Mongoose v9 typing and integrates Zod validation rules at the schema level.

### RabbitMQ (Custom Manager)
A custom `RabbitManager` class in the shared workspace handles connection resilience, consumer idempotency, exponential backoff, and DLQ (Dead Letter Queue) routing.

## Data Flow

1. **Video Upload:**
   - A user uploads a video via an HTTP request to the API Gateway.
   - The server validates the file and writes it to disk.
   - The server publishes a `VideoJob` message to RabbitMQ.

2. **Video Processing:**
   - The Worker Service receives the message.
   - It locks the job in MongoDB (changing status to `processing`).
   - It transcodes the file into HLS segments (`.m3u8` and `.ts`).
   - It updates the database with the final status and output path.
   - Failures are routed to the Dead Letter Queue.

3. **Fetching Processed Videos:**
   - Users fetch the video list or details via the API Gateway.
   - The data is mapped to a strict API response payload before returning to the client.

## Key Files and Directories

### Shared Workspace (`packages/shared/`)
- **src/rabbit/manager.ts:** The resilient RabbitMQ connection class.
- **src/rabbit/topology.ts:** Quorum queue and DLX (Dead Letter Exchange) configuration.
- **src/logging/logger.ts:** Shared Pino logger factory.
- **src/errors/:** Shared typed application errors.

### API Gateway (`src/`)
- **src/server.ts:** The `Bun.serve()` entry point.
- **src/app.ts:** The Hono router, middleware wiring, and CORS config.
- **src/routes/upload.ts:** High-performance file upload handler.
- **src/schemas/video.schema.ts:** The single source of truth for validation rules (Zod).

### Video Processing Service (`video-processing-service/`)
- **src/worker.ts:** Entry point. Connects DB/RabbitMQ and starts consumers.
- **src/consumers/video-process.consumer.ts:** Validates job schemas and handles state.
- **src/services/transcoder.ts:** FFmpeg implementation with aggregate error fallback.

### Configuration & Tooling
- **package.json:** Bun workspace root defining the monorepo structure.
- **biome.json:** Formatting and linting rules replacing Prettier/ESLint.
- **docker-compose.yml:** Compose spec (v2) for local infra (Mongo 8.0, RabbitMQ 4.0).
- **charts/hls-microservice-backend-chart/:** Production-grade Helm chart with HPA, KEDA, and strict probes.