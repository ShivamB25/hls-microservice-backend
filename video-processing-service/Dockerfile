# Use the official Node.js 16 image as the base image
FROM node:21

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and tsconfig.json
COPY package.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Set environment variables for production
ENV NODE_ENV=production

# Expose port 3000 for the service (if needed)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]