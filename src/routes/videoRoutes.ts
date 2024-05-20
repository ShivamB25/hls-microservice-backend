import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import Video from '../../models/videoModel';
import { publishToQueue } from '../utils/rabbitMQ';
import logger from '../utils/logger';

// Setup multer for file uploads
const upload = multer({
  dest: 'uploads/', // Destination folder for uploaded files
  limits: { fileSize: 100 * 1024 * 1024 }, // Limit file size to 100MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext !== 'mp4' && ext !== 'mkv' && ext !== 'avi') {
      return cb(new Error('Only videos are allowed'));
    }
    cb(null, true);
  }
});

const router = express.Router();

// POST /upload route for uploading videos
router.post('/upload', upload.single('video'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const { title, description } = req.body;

    // Create a new video document in MongoDB
    const video = new Video({
      title,
      description,
      filePath: req.file.path,
      status: 'uploaded'
    });

    await video.save();

    // Publish a message to RabbitMQ
    await publishToQueue('video-upload-queue', video._id.toString());

    res.status(201).json(video);
    logger.info('Video uploaded successfully:', video);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error uploading video:', error.message, error.stack);
      res.status(500).send('Internal Server Error');
    } else {
      logger.error('Unexpected error uploading video:', error);
      res.status(500).send('Internal Server Error');
    }
  }
});

// GET / route for fetching processed videos with pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sort: { createdAt: -1 }
    };

    const videos = await Video.paginate({ status: 'processed' }, options);

    res.status(200).json(videos);
    logger.info(`Fetched processed videos: ${videos.docs.length} videos found`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error fetching processed videos:', error.message, error.stack);
      res.status(500).send('Internal Server Error');
    } else {
      logger.error('Unexpected error fetching processed videos:', error);
      res.status(500).send('Internal Server Error');
    }
  }
});

export default router;