import amqp from 'amqplib';

let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async (url: string, queue: string) => {
  try {
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    console.log('RabbitMQ connected successfully');

    await channel.assertQueue(queue, { durable: true });
    console.log(`Queue '${queue}' is ready`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error connecting to RabbitMQ:', error.message, error.stack);
    } else {
      console.error('Unknown error connecting to RabbitMQ:', error);
    }
    process.exit(1); // Exit process with failure
  }
};

export const getChannel = () => channel;