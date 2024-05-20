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

export const getChannel = () => {
  if (!channel) {
    const errorMsg = 'Channel is not available.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  return channel;
};

const assertQueueAndPublishMessage = async (queue: string, message: string) => {
  try {
    await channel?.assertQueue(queue, { durable: true });
    channel?.sendToQueue(queue, Buffer.from(message));
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

export const publishToQueue = async (queue: string, message: string) => {
  const availableChannel = channel ?? getChannel();

  await assertQueueAndPublishMessage(queue, message);
};

export const subscribeToQueue = async (queue: string, callback: (msg: amqp.ConsumeMessage | null) => void) => {
  const availableChannel = channel ?? getChannel();

  try {
    await availableChannel.assertQueue(queue, { durable: true });
    availableChannel.consume(queue, (msg) => {
      if (msg !== null) {
        logger.info(`Message received from queue '${queue}': ${msg.content.toString()}`);
        callback(msg);
        availableChannel.ack(msg);
      }
    });
    logger.info(`Subscribed to queue '${queue}'`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error subscribing to queue:', error.message, error.stack);
    } else {
      logger.error('Unknown error subscribing to queue:', error);
    }
    throw error;
  }
};