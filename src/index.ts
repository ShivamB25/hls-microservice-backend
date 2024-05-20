import express from 'express';
import connectDB from './db';
import videoRoutes from './routes/videoRoutes';
import cors from 'cors';
import { connectRabbitMQ, getChannel } from './utils/rabbitMQ';
import logger from './utils/logger';

const app = express();
const PORT = 3000;

connectDB();

// Connect to RabbitMQ
const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const queueName = process.env.RABBITMQ_QUEUE || 'video-upload-queue';

connectRabbitMQ(rabbitMQUrl, queueName).then(() => {
  try {
    logger.info('RabbitMQ connection established');
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to get RabbitMQ channel:', error.message, error.stack);
    } else {
      logger.error('Unexpected error when getting RabbitMQ channel:', error);
    }
    process.exit(1); // Exit process with failure
  }
}).catch((error) => {
  logger.error('Failed to connect to RabbitMQ:', error.message, error.stack);
  process.exit(1); 
});

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to enable CORS
app.use(cors());

// Use video routes
app.use('/api/videos', videoRoutes);

app.get('/ping', (req, res: express.Response) => {
  try {
    res.status(200).send('pong');
    logger.info('Ping request received and responded with pong');
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error handling /ping route:', error.message, error.stack);
      res.status(500).send('Internal Server Error');
    } else {
      logger.error('Unexpected error handling /ping route:', error);
      res.status(500).send('Internal Server Error');
    }
  }
});

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});