import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Video document
interface IVideo extends Document {
  title: string;
  description: string;
  filePath: string;
  status: 'uploaded' | 'processing' | 'processed';
  createdAt: Date;
}

// Define the schema for the Video model
const videoSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  filePath: { type: String, required: true },
  status: { type: String, enum: ['uploaded', 'processing', 'processed'], default: 'uploaded' },
  createdAt: { type: Date, default: Date.now },
});

// Create and export the Video model
const Video = mongoose.model<IVideo>('Video', videoSchema);

export default Video;