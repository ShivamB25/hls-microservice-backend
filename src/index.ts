import express from 'express';
import connectDB from './db';
import videoRoutes from './routes/videoRoutes';
import cors from 'cors';
import { connectRabbitMQ } from './rabbitMQ';

const app = express();
const PORT = 3000;

// Connect to MongoDB
connectDB();

// Connect to RabbitMQ
const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const queueName = process.env.RABBITMQ_QUEUE || 'video-upload-queue';

connectRabbitMQ(rabbitMQUrl, queueName).then(() => {
  console.log('RabbitMQ connection established');
}).catch((error) => {
  console.error('Failed to connect to RabbitMQ:', error.message, error.stack);
  process.exit(1); // Exit process with failure
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
    console.log('Ping request received and responded with pong');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error handling /ping route:', error.message, error.stack);
      res.status(500).send('Internal Server Error');
    } else {
      console.error('Unexpected error handling /ping route:', error);
      res.status(500).send('Internal Server Error');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});