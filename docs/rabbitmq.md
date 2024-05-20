## Purpose of RabbitMQ

RabbitMQ is used in the `microservice-example_` project to manage message queuing between the main application and the video processing service. It enables asynchronous processing of video files, allowing the system to scale and handle multiple video processing tasks simultaneously.

## How RabbitMQ is Used

RabbitMQ is used to facilitate communication between the main application and the video processing service through message queues. When a video is uploaded via the main application, a message is published to a RabbitMQ queue. The video processing service listens to this queue and processes videos as they arrive.

### Key Benefits:

- **Asynchronous Processing:** Allows the main application to handle requests without waiting for video processing to complete.
- **Scalability:** Multiple instances of the video processing service can be deployed to handle larger volumes of video processing tasks.
- **Reliability:** Ensures that video processing tasks are not lost even if the processing service is temporarily unavailable.

## Configuration

The RabbitMQ configuration is defined in the `.env` file and used across the project. Here are the relevant environment variables:

```ini
RABBITMQ_URL=amqp://localhost
RABBITMQ_QUEUE=video-upload-queue
VIDEO_PROCESSING_RABBITMQ_URL=amqp://localhost 
VIDEO_PROCESSING_RABBITMQ_QUEUE=video-processing-queue 
```

These variables specify the RabbitMQ server URL and the names of the queues used for video upload and processing.

## Example Usage

### Publishing Messages

Messages are published to the RabbitMQ queue by the main application when a video is uploaded. Here is an example of how this is done in the `src/utils/rabbitMQ.ts` file:

```typescript
import amqp from 'amqplib';
import logger from './logger';

let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async (url: string, queue: string) => {
  try {
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    logger.info('RabbitMQ connected successfully');

    await channel.assertQueue(queue, { durable: true });
    logger.info(`Queue '${queue}' is ready`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error connecting to RabbitMQ:', error.message, error.stack);
    } else {
      logger.error('Unknown error connecting to RabbitMQ:', error);
    }
    process.exit(1); // Exit process with failure
  }
};

export const publishToQueue = async (queue: string, message: string) => {
  const availableChannel = channel ?? getChannel();

  try {
    await availableChannel.assertQueue(queue, { durable: true });
    availableChannel.sendToQueue(queue, Buffer.from(message));
    logger.info(`Message sent to queue '${queue}': ${message}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error publishing to queue:', error.message, error.stack);
    } else {
      logger.error('Unknown error publishing to queue:', error);
    }
    throw error;
  }
};
```

### Subscribing to Messages

The video processing service subscribes to the RabbitMQ queue to receive video processing tasks. Here is an example of how this is done in the `video-processing-service/src/videoProcessor.ts` file:

```typescript
import amqp from 'amqplib';
import logger from './logger';
import { processVideo } from './videoProcessor';
import { connectRabbitMQ, subscribeToQueue } from './rabbitMQ';

const queueName = process.env.RABBITMQ_QUEUE || 'video-upload-queue';

const processVideoQueue = async () => {
  await connectRabbitMQ(process.env.RABBITMQ_URL || 'amqp://localhost', queueName);

  subscribeToQueue(queueName, async (msg) => {
    if (msg) {
      const messageContent = msg.content.toString();
      logger.info(`Processing video: ${messageContent}`);
      await processVideo(messageContent);
      logger.info(`Video processed: ${messageContent}`);
    }
  });
};

processVideoQueue();
```

## Conclusion

RabbitMQ plays a crucial role in the `microservice-example_` project by enabling asynchronous processing of video files. It decouples the main application from the video processing service, allowing each to scale and function independently. By following the examples provided, you can understand how RabbitMQ is configured and used within the project.
