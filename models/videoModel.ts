import mongoose, { Document, Schema, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

// Define the interface for the Video document
interface IVideo extends Document {
  _id: mongoose.Types.ObjectId;
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

// Add indexes for frequently queried fields
videoSchema.index({ status: 1 });
videoSchema.index({ createdAt: -1 });

// Add pagination plugin to the schema
videoSchema.plugin(mongoosePaginate);

// Create and export the Video model
const Video = mongoose.model<IVideo, PaginateModel<IVideo>>('Video', videoSchema);

export default Video;
