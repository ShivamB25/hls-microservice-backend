# microservice-example_

A highly scalable and efficient system for transforming video files into HLS format using a microservices architecture.

## Overview

This project is designed to transform videos into HLS format using a microservices architecture. The system is written in TypeScript and uses asynchronous processing to ensure scalability and efficiency. Key components include an Express.js server for handling HTTP requests, MongoDB for data storage, RabbitMQ for message queuing, and FFmpeg for video processing.

### Project Structure

- **src/**: Contains the main application code.
  - **index.ts**: Entry point of the Express.js server.
  - **db.ts**: MongoDB connection setup.
  - **routes/**: Defines the API routes for video operations.
  - **utils/**: Utility functions, including RabbitMQ setup.
- **models/**: Mongoose models for MongoDB.
- **video-processing-service/**: Microservice for processing videos.
  - **src/**: Contains the video processing code.
  - **index.ts**: Entry point of the video processing service.
  - **db.ts**: MongoDB connection setup for the service.
  - **videoProcessor.ts**: Contains the logic for converting videos to HLS format.
- **types/**: TypeScript type definitions.
- **.env**: Environment variables.
- **package.json**: Node.js dependencies and scripts.
- **tsconfig.json**: TypeScript configuration.
- **Dockerfile**: Docker configuration for containerization.
- **helm/**: Helm chart for Kubernetes deployment.

## Features

- Upload videos via a REST API.
- Store video metadata in MongoDB.
- Queue video processing tasks using RabbitMQ.
- Convert videos to HLS format asynchronously.
- Fetch processed videos with pagination support.

## Getting started

### Requirements

- Node.js (v14 or later)
- MongoDB
- RabbitMQ
- Docker
- Kubernetes (optional, for Helm chart)

### Quickstart

1. **Clone the repository**
   ```sh
   git clone https://github.com/your-username/microservice-example_.git
   cd microservice-example_
   ```
2. **Install dependencies**
   ```sh
   npm install
   cd video-processing-service
   npm install
   cd ..
   ```
3. **Set up environment variables**
   - Copy `.env.example` to `.env` and fill in the necessary details.
4. **Run the services**
   - Start MongoDB and RabbitMQ.
   - Run the main service:
     ```sh
     npm start
     ```
   - Run the video processing service:
     ```sh
     cd video-processing-service
     npm start
     ```
5. **Docker and Kubernetes (optional)**
   - Build Docker images:
     ```sh
     docker build -t microservice-example_ .
     cd video-processing-service
     docker build -t video-processing-service .
     ```
   - Deploy using Helm:
     ```sh
     helm install microservice-example_ ./helm
     ```

## Documentation

For more detailed information, refer to the following documentation files:

1. [Kubernetes Deployment Guide](./docs/kubernetes.md)
   - An in-depth explanation of how Kubernetes is used in the project, including setting up a Kubernetes cluster, using kubectl, and the purpose of each YAML file in the Helm chart.
   
2. [Code Architecture](./docs/code-architecture.md)
   - An overview of the project's architecture, explaining the roles of the Express server, video-processing service, MongoDB, and RabbitMQ, along with detailed descriptions of key files and directories.

3. [RabbitMQ Usage](./docs/rabbitmq.md)
   - An explanation of the purpose of RabbitMQ in the project, including how it is used for message queuing, how it enables asynchronous processing, and how it is configured within the project. Examples of publishing and consuming messages are also provided.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.