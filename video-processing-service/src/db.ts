import mongoose from 'mongoose';
import logger from '../../src/utils/logger';

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/microservice-example'; // INPUT_REQUIRED {Replace with your MongoDB URI or set via environment variable}

  try {
    await mongoose.connect(mongoURI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error connecting to MongoDB:', error.message, error.stack);
    } else {
      logger.error('Unknown error connecting to MongoDB:', error);
    }
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;