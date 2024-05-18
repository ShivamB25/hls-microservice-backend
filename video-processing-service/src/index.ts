import dotenv from 'dotenv';
dotenv.config();

import connectDB from './db';
import processVideoQueue from './videoProcessor';
import { connectRabbitMQ } from '../../src/utils/rabbitMQ';

const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const queueName = process.env.RABBITMQ_QUEUE || 'video-upload-queue';

// Connect to MongoDB
connectDB().then(() => {
  console.log('MongoDB connection established');
}).catch((error) => {
  console.error('Failed to connect to MongoDB:', error.message, error.stack);
  process.exit(1); // Exit process with failure
});

// Connect to RabbitMQ and start processing videos
connectRabbitMQ(rabbitMQUrl, queueName).then(() => {
  console.log('RabbitMQ connection established');
  processVideoQueue();
}).catch((error) => {
  console.error('Failed to connect to RabbitMQ:', error.message, error.stack);
  process.exit(1); // Exit process with failure
});