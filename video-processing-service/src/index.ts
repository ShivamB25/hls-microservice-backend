import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import connectDB from './db';
import processVideoQueue from './videoProcessor';
import { connectRabbitMQ, getChannel } from '../../src/utils/rabbitMQ';
import logger from '../../src/utils/logger';

const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const queueName = process.env.RABBITMQ_QUEUE || 'video-upload-queue';

connectDB().then(() => {
  logger.info('MongoDB connection established');
}).catch((error) => {
  logger.error('Failed to connect to MongoDB:', error.message, error.stack);
  process.exit(1); // Exit process with failure
});

// Connect to RabbitMQ and start processing videos
connectRabbitMQ(rabbitMQUrl, queueName).then(() => {
  const channel = getChannel();
  if (channel) {
    logger.info('RabbitMQ connection established');
    processVideoQueue();
  } else {
    logger.error('Failed to get RabbitMQ channel');
    process.exit(1); 
  }
}).catch((error: { message: any; stack: any; }) => {
  logger.error('Failed to connect to RabbitMQ:', error.message, error.stack);
  process.exit(1);
});

// Add logging for video processing start and end
logger.info('Video processing service started');
process.on('SIGINT', () => {
  logger.info('Video processing service shutting down');
  process.exit();
});
