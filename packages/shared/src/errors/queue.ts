import { AppError } from './app-error.ts'

export class QueueConnectionError extends AppError {
  readonly statusCode = 503
  readonly code = 'QUEUE_CONNECTION_ERROR'
}

export class QueuePublishError extends AppError {
  readonly statusCode = 500
  readonly code = 'QUEUE_PUBLISH_ERROR'
}

export class QueueConsumeError extends AppError {
  readonly statusCode = 500
  readonly code = 'QUEUE_CONSUME_ERROR'
}
