import Video from '../../models/videoModel';
import ffmpeg from 'fluent-ffmpeg';
import { getChannel } from '../../src/utils/rabbitMQ';
import logger from '../../src/utils/logger';

const processVideoQueue = async () => {
  const channel = getChannel();
  if (!channel) {
    logger.error('RabbitMQ channel is not available');
    return;
  }

  channel.consume('video-upload-queue', async (msg) => {
    if (msg) {
      const videoId = msg.content.toString();
      try {
        const video = await Video.findById(videoId);

        if (video && video.status === 'uploaded') {
          video.status = 'processing';
          await video.save();

          logger.info(`Processing video ${video._id}`);

          // Convert video to HLS format
          ffmpeg(video.filePath)
            .outputOptions([
              '-profile:v baseline', 
              '-level 3.0', 
              '-start_number 0', 
              '-hls_time 10', 
              '-hls_list_size 0', 
              '-f hls'
            ])
            .output(`hls/${video._id}.m3u8`)
            .on('start', () => {
              logger.info(`Started processing video ${video._id}`);
            })
            .on('progress', (progress) => {
              logger.info(`Processing video ${video._id}: ${progress.percent}% done`);
            })
            .on('end', async () => {
              try {
                video.status = 'processed';
                await video.save();
                logger.info(`Video ${video._id} processed successfully`);
                channel.ack(msg);
              } catch (error) {
                if (error instanceof Error) {
                  logger.error(`Error updating video status to 'processed' for video ${video._id}:`, error.message, error.stack);
                } else {
                  logger.error(`Unknown error updating video status to 'processed' for video ${video._id}:`, error);
                }
                channel.nack(msg);
              }
            })
            .on('error', (err) => {
              logger.error(`Error processing video ${video._id}:`, err.message, err.stack);
              channel.nack(msg);
            })
            .run();
        } else {
          logger.error(`Video not found or not in uploaded status: ${videoId}`);
          channel.nack(msg);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error('Error processing video:', error.message, error.stack);
        } else {
          logger.error('Unknown error processing video:', error);
        }
        channel.nack(msg);
      }
    }
  });
};

export default processVideoQueue;