import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import Video from '../../models/videoModel';
import path from 'path';

// Setup multer for file uploads
const upload = multer({
  dest: 'uploads/', // Destination folder for uploaded files
  limits: { fileSize: 100 * 1024 * 1024 }, // Limit file size to 100MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.mp4' && ext !== '.mkv' && ext !== '.avi') {
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

    res.status(201).json(video);
    console.log('Video uploaded successfully:', video);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error uploading video:', error.message, error.stack);
      res.status(500).send('Internal Server Error');
    } else {
      console.error('Unexpected error uploading video:', error);
      res.status(500).send('Internal Server Error');
    }
  }
});

export default router;