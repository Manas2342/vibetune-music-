import serverless from 'serverless-http';
import { createServer } from '../../server/index';

// Set NETLIFY environment variable so services know we're in serverless
if (!process.env.NETLIFY) {
  process.env.NETLIFY = 'true';
}

// Create Express app
const app = createServer();

// Export handler for Netlify Functions
export const handler = serverless(app, {
  binary: ['image/*', 'audio/*', 'video/*'],
});

