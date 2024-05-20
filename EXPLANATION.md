## Introduction

The `hls-microservice-backend` application is designed to transform video files into HLS (HTTP Live Streaming) format using a microservices architecture. This document provides an overview of the application's components, technologies used, and how they interact.

## Architecture Overview

The application follows a microservices architecture, which allows for scalability and efficient management of different components. Below is a basic diagram illustrating the architecture and data flow:

<!-- ![Architecture Diagram](./docs/architecture-diagram.png) -->

### Key Components

1. **Express Server:**
   - Handles HTTP requests for video uploads and fetching processed videos.
   - Interacts with MongoDB to store and retrieve video metadata.
   - Publishes messages to RabbitMQ to queue video processing tasks.

2. **Video Processing Service:**
   - Listens to RabbitMQ for video processing tasks.
   - Uses `ffmpeg` to convert videos to HLS format.
   - Updates the status of videos in MongoDB after processing.

3. **MongoDB:**
   - Stores metadata about videos, including their status and file paths.

4. **RabbitMQ:**
   - Manages the queue for video processing tasks.
   - Ensures that video processing tasks are handled asynchronously.

### Technologies Used

- **Node.js:** JavaScript runtime for building the server and processing services.
- **TypeScript:** Superset of JavaScript that adds static types.
- **Express:** Web framework for Node.js to handle HTTP requests.
- **MongoDB:** NoSQL database for storing video metadata.
- **RabbitMQ:** Message broker for managing video processing tasks.
- **ffmpeg:** Command-line tool for processing video and audio files.
- **Docker:** Container platform for managing software processes in isolated environments.
- **Kubernetes:** Orchestration system for automating deployment, scaling, and management of containerized applications.
- **Helm:** Kubernetes package manager for deploying and managing applications.

## Data Flow

1. **Video Upload:**
   - A user uploads a video via an HTTP request to the Express server.
   - The server saves the video file and stores metadata in MongoDB.
   - The server publishes a message to RabbitMQ to queue the video for processing.

2. **Video Processing:**
   - The Video Processing Service listens to RabbitMQ for new video processing tasks.
   - Upon receiving a task, it retrieves the video file and uses `ffmpeg` to convert it to HLS format.
   - After processing, it updates the video's status in MongoDB.

3. **Fetching Processed Videos:**
   - Users can fetch the processed videos via HTTP requests to the Express server.
   - The server retrieves the video metadata from MongoDB and serves the processed video files.

## Conclusion

This document provides an overview of the `microservice-example_` application, including its architecture, key components, technologies used, and data flow. For more detailed instructions on deploying the application using Helm, please refer to the [README.md](./charts/microservice-example-chart/README.md) file.