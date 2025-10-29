FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++ sqlite sqlite-dev ffmpeg

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies - simple install without flags
RUN npm install

# Copy all source code
COPY . .

# Create directories
RUN mkdir -p storage/offline storage/cache logs

# Build
RUN npm run build

# Copy env template
COPY env.example .env

EXPOSE 8080

CMD ["npm", "start"]
