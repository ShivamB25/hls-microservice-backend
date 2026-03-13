# RabbitMQ

RabbitMQ carries transcode jobs between the Bun/Hono API and the worker. If this path is broken, uploads pile up, workers go idle, and someone gets paged.

## Source of truth

- `packages/shared/src/rabbit/contracts.ts`
- `packages/shared/src/rabbit/topology.ts`
- `packages/shared/src/rabbit/manager.ts`
- `src/lib/rabbit.ts`
- `video-processing-service/src/lib/rabbit.ts`
- `video-processing-service/src/worker.ts`
- `video-processing-service/src/consumers/video-process.consumer.ts`

## Topology

- Exchange: `video.events`
  - Type: `topic`
  - Durable: `true`
- Dead letter exchange: `video.events.dlx`
  - Type: `fanout`
  - Durable: `true`
- Work queue: `video.transcode`
  - Durable: `true`
  - Queue type: `quorum`
  - Dead letters: `video.events.dlx`
  - Message TTL: `86400000` ms (`24h`)
- Dead letter queue: `video.transcode.dlq`
  - Durable: `true`
  - Queue type: `quorum`
- Binding:
  - `video.transcode` <- `video.events` with routing key `video.transcode.requested`
  - `video.transcode.dlq` <- `video.events.dlx` with routing key `#`

```text
API -> video.events -> video.transcode -> worker
                               |
                               +-> nack / expired -> video.events.dlx -> video.transcode.dlq
```

## What the API publishes

- File uploads land on disk first. The API writes them with `Bun.write`.
- After the `Video` document is saved, the API publishes a JSON job with:
  - `videoId`
  - `filePath`
  - `targetResolutions`
  - `correlationId`
- Publish path:
  - exchange: `video.events`
  - routing key: `video.transcode.requested`
  - content type: `application/json`
  - persistence: `true`
  - timestamp: set by the publisher

## RabbitManager

`RabbitManager` is the only RabbitMQ client wrapper that matters here.

- Connects with `amqplib`.
- Declares topology on every connect or reconnect. This is idempotent. Use it.
- Applies channel prefetch before consuming.
- Tracks registered consumers and re-registers them after reconnect.
- Refuses duplicate consumer registration for the same queue.
- Exposes a permanent failure hook so the process can shut itself down instead of pretending everything is fine.

### Default knobs

- `maxRetries`: `10`
- `initialDelayMs`: `500`
- `maxDelayMs`: `30000`
- API prefetch: `10`
- Worker prefetch: `MAX_CONCURRENT_JOBS`

## Backoff and reconnect behavior

This backoff is for broker connectivity, not for retrying failed jobs.

- `RabbitManager` retries connection setup with exponential backoff plus jitter.
- Delay formula in `packages/shared/src/rabbit/backoff.ts` is effectively:

```ts
Math.min(baseMs * 2 ** attempt + randomJitterUpTo1s, maxMs)
```

- If the connection or channel closes unexpectedly, `RabbitManager` schedules a reconnect.
- If reconnects fail past `maxRetries`, the permanent failure handler runs.
- Both API and worker wire that permanent failure handler to process shutdown. Good. A half-dead queue client is worse than a crash.

## Consumer behavior

The worker consumes `video.transcode` and handles jobs in `video-process.consumer.ts`.

- Incoming payload is validated with Zod.
- Invalid payloads throw immediately and go to the DLQ.
- Missing `Video` documents throw immediately and go to the DLQ.
- Already processed videos are skipped.
- Duplicate deliveries are handled by an atomic claim in MongoDB:
  - only videos in `uploaded` or `failed` state can move to `processing`
  - if the claim fails, the worker logs and exits the handler without reprocessing
- Successful jobs call `markProcessed(playlistPath)`.
- Failed jobs call `markFailed(reason)` and then rethrow.

## Ack, nack, and DLQ rules

- Handler success -> `ack`
- Handler failure -> `nack(msg, false, false)`
- `requeue=false` means failed messages do not bounce forever in the work queue.
- Because the work queue has `x-dead-letter-exchange`, failed or expired messages land in `video.transcode.dlq`.

If you want in-queue retries with delayed redelivery, that does not exist here. The current design is simple on purpose:

- transient broker failures -> reconnect with backoff
- bad jobs or failed transcodes -> DLQ
- manual investigation -> human work

## Runtime config that must stay aligned

```ini
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE=video.transcode
MAX_CONCURRENT_JOBS=4
```

- `RABBITMQ_URL` points both services at the same broker.
- `video.transcode` is the canonical queue name. Keep broker topology, Helm `config.rabbitmqQueue`, KEDA, and any env surface aligned to that value.
- `MAX_CONCURRENT_JOBS` controls worker prefetch. Raising it raises per-pod concurrency and resource pressure.

## What to check when jobs stop moving

```sh
rabbitmqadmin list queues name type durable consumers messages messages_ready messages_unacknowledged arguments
rabbitmqadmin get queue=video.transcode count=5 ackmode=ack_requeue_false
rabbitmqadmin get queue=video.transcode.dlq count=20 ackmode=ack_requeue_false
```

- `video.transcode` growing while workers stay flat means KEDA is not scaling or workers are broken.
- `messages_unacknowledged` climbing means workers are stuck or overloaded.
- Anything in `video.transcode.dlq` is a real failure. Read it. Fix the producer, payload, storage, DB state, or transcoder.

## Things that will hurt you

- Replacing quorum queues with classic queues because they look familiar.
- Cranking `MAX_CONCURRENT_JOBS` without checking CPU, memory, and ffmpeg contention.
- Letting broker topology, Helm, and KEDA disagree on the queue name.
- Treating the DLQ like a trash can instead of an alarm.