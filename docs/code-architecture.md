# Code Architecture

## Overview

The `hls-microservice-backend` project is designed to transform video files into HLS (HTTP Live Streaming) format using a microservices architecture. This document provides an overview of the application's architecture, the roles of various components, and detailed descriptions of key files and directories.

## Architecture Components

### Express Server

The Express server handles HTTP requests for uploading videos and fetching processed videos. It interacts with MongoDB to store and retrieve video metadata and publishes messages to RabbitMQ to queue video processing tasks.

- **Key responsibilities:**
  - Handle video uploads via REST API.
  - Store video metadata in MongoDB.
  - Publish messages to RabbitMQ for video processing tasks.
  - Serve processed video files.

### Video Processing Service

The Video Processing Service listens to RabbitMQ for video processing tasks. Upon receiving a task, it retrieves the video file and uses `ffmpeg` to convert it to HLS format. After processing, it updates the video's status in MongoDB.

- **Key responsibilities:**
  - Listen to RabbitMQ for video processing tasks.
  - Convert videos to HLS format using `ffmpeg`.
  - Update the status of videos in MongoDB.

### MongoDB

MongoDB is used to store metadata about videos, including their status and file paths.

- **Key responsibilities:**
  - Store video metadata.
  - Provide data retrieval for video metadata.

### RabbitMQ

RabbitMQ manages the queue for video processing tasks, ensuring that tasks are handled asynchronously.

- **Key responsibilities:**
  - Manage video processing task queue.
  - Enable asynchronous processing of video tasks.

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

## Key Files and Directories

### Main Application

- **src/index.ts:**
  - Entry point of the Express server.
  - Connects to MongoDB and RabbitMQ.
  - Defines routes and middlewares.

- **src/db.ts:**
  - MongoDB connection setup.

- **src/routes/videoRoutes.ts:**
  - Defines API routes for video operations.

- **models/videoModel.ts:**
  - Mongoose model for video documents.

- **src/utils/rabbitMQ.ts:**
  - Utility functions for connecting and interacting with RabbitMQ.

- **src/utils/logger.ts:**
  - Logger utility using Winston.

### Video Processing Service

- **video-processing-service/src/index.ts:**
  - Entry point of the video processing service.
  - Connects to MongoDB and RabbitMQ.
  - Starts processing videos from the queue.

- **video-processing-service/src/db.ts:**
  - MongoDB connection setup for the service.

- **video-processing-service/src/videoProcessor.ts:**
  - Contains logic for converting videos to HLS format.

### Configuration

- **.env:**
  - Environment variables for MongoDB URI, RabbitMQ configurations, and video processing settings.

- **tsconfig.json:**
  - TypeScript compiler options.

- **Dockerfile:**
  - Docker configuration for containerizing the application.

- **docker-compose.yml:**
  - Docker Compose configuration for running multiple services.

### Kubernetes

- **charts/microservice-example-chart/:**
  - Helm chart for Kubernetes deployment.
  - Contains templates and configuration values for deploying the application.

## Conclusion

This document provides an overview of the `microservice-example_` application's architecture, including its components, data flow, and key files and directories. For more detailed deployment instructions, please refer to the [README.md](../README.md) and other documentation files in the `docs` directory.