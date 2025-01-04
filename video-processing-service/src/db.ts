import mongoose from 'mongoose';
import logger from '../../src/utils/logger';

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/microservice-example';

  const mongooseOptions = {
    serverSelectionTimeoutMS: 15000, // Timeout for server selection
    socketTimeoutMS: 45000, // How long to wait for operations to complete
    connectTimeoutMS: 15000, // How long to wait for initial connection
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 2, // Minimum number of connections in the pool
    retryWrites: true, // Enable retry for write operations
    retryReads: true, // Enable retry for read operations
  };

  try {
    await mongoose.connect(mongoURI, mongooseOptions);
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
