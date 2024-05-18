import Video from '../../models/videoModel';
import ffmpeg from 'fluent-ffmpeg';
import { getChannel } from './rabbitMQ';

const processVideos = async () => {
  const channel = getChannel();
  if (!channel) {
    console.error('RabbitMQ channel is not available');
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

          console.log(`Processing video ${video._id}`);

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
            .on('end', async () => {
              video.status = 'processed';
              await video.save();
              console.log(`Video ${video._id} processed successfully`);
              channel.ack(msg);
            })
            .on('error', (err) => {
              console.error(`Error processing video ${video._id}:`, err.message, err.stack);
              channel.nack(msg);
            })
            .run();
        } else {
          console.error(`Video not found or not in uploaded status: ${videoId}`);
          channel.nack(msg);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error processing video:', error.message, error.stack);
        } else {
          console.error('Unknown error processing video:', error);
        }
        channel.nack(msg);
      }
    }
  });
};

export default processVideos;