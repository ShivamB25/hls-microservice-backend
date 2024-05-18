import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/microservice-example'; // INPUT_REQUIRED {Replace with your MongoDB URI or set via environment variable}

  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error connecting to MongoDB:', error.message, error.stack);
    } else {
      console.error('Unknown error connecting to MongoDB:', error);
    }
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;