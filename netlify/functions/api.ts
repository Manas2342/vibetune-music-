import serverless from 'serverless-http';
import { createServer } from '../../server/index';

// Create Express app
const app = createServer();

// Export handler for Netlify Functions
export const handler = serverless(app, {
  binary: ['image/*', 'audio/*', 'video/*'],
});

