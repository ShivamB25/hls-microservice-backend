# Use the official Node.js image as a base image
FROM node:21

# Set the working directory for the main application
WORKDIR /app

# Copy package.json to the working directory of the main application
COPY package.json ./

# Install dependencies for the main application
RUN npm install

# Copy the rest of the main application code to the working directory
COPY . .

# Build the TypeScript files for the main application
RUN npm run build

# Set the working directory for the video-processing-service
WORKDIR /app/video-processing-service

# Copy package.json to the working directory of video-processing-service
COPY video-processing-service/package.json ./

# Install dependencies for video-processing-service
RUN npm install

# Copy the rest of the video-processing-service code to the working directory
COPY video-processing-service ./

# Build the TypeScript files for video-processing-service
RUN npm run build

# Expose the port the main application runs on
EXPOSE 3000

# Expose the port the video-processing-service runs on
EXPOSE 3001

# Start both the main application and the video-processing-service using a process manager
CMD ["npx", "pm2-runtime", "start", "ecosystem.config.js"]