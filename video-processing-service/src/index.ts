import connectDB from './db';
import processVideos from './videoProcessor';
import { connectRabbitMQ } from './rabbitMQ';

// Connect to MongoDB
connectDB().then(() => {
  console.log('MongoDB connection established');
}).catch((error) => {
  console.error('Failed to connect to MongoDB:', error.message, error.stack);
  process.exit(1); // Exit process with failure
});

// Connect to RabbitMQ and start processing videos
connectRabbitMQ().then(() => {
  console.log('RabbitMQ connection established');
  processVideos();
}).catch((error) => {
  console.error('Failed to connect to RabbitMQ:', error.message, error.stack);
  process.exit(1); // Exit process with failure
});