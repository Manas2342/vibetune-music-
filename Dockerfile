# Simple single-stage build for VibeTune
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    sqlite-dev \
    ffmpeg \
    wget \
    curl

# Set working directory
WORKDIR /app

# Configure npm for better reliability
RUN npm config set fund false && \
    npm config set audit false && \
    npm config set optional false

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install all dependencies (using install instead of ci for better compatibility)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p storage/offline storage/cache logs

# Build the application
RUN npm run build

# Copy environment template
COPY env.example .env

# Expose port (Render will use PORT env var at runtime)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8084/api/ping || exit 1

# Start the application
CMD ["npm", "start"]
