# VibeTune - Spotify API Integration Setup

This document provides a comprehensive guide for setting up and configuring the Spotify API integration for your VibeTune music streaming application.

## Overview

The backend has been fully configured to work with Spotify's Web API, providing:
- User authentication via Spotify OAuth 2.0
- Access to user's playlists, saved tracks, and listening history
- Music search and discovery
- Personalized recommendations
- Track and artist information

## Prerequisites

Before you can use the Spotify integration, you need to:

1. **Create a Spotify Developer Account**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Log in with your Spotify account
   - Accept the terms of service

2. **Create a Spotify App**
   - Click "Create an App"
   - Fill in the app details:
     - App name: VibeTime (or your preferred name)
     - App description: AI-powered music streaming application
     - Website: Your app's URL
     - Redirect URI: `http://localhost:8080/callback` (for development)
   - Accept the terms and create the app

3. **Get Your Credentials**
   - Once created, you'll see your Client ID and Client Secret
   - Keep the Client Secret secure and never expose it publicly

## Environment Configuration

Update your `.env` file with your Spotify credentials:

```bash
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_client_id_from_spotify_dashboard
SPOTIFY_CLIENT_SECRET=your_client_secret_from_spotify_dashboard
SPOTIFY_REDIRECT_URI=http://localhost:8080/callback

# App Configuration (generate secure random strings)
JWT_SECRET=your_secure_jwt_secret_here
SESSION_SECRET=your_secure_session_secret_here
```

### Generating Secure Secrets

You can generate secure secrets using:

```bash
# For JWT_SECRET and SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Spotify App Settings

In your Spotify Developer Dashboard, configure these settings:

### Redirect URIs
Add these redirect URIs to your Spotify app:
- Development: `http://localhost:8080/callback`
- Production: `https://your-domain.com/callback`

### API Scopes
The application requests these scopes:
- `user-read-private` - Read user profile data
- `user-read-email` - Read user's email address
- `user-read-playback-state` - Read user's playback state
- `user-modify-playback-state` - Control user's playback
- `user-read-currently-playing` - Read currently playing track
- `user-read-playback-position` - Read playback position
- `user-top-read` - Read user's top tracks and artists
- `user-read-recently-played` - Read recently played tracks
- `user-library-read` - Read user's saved tracks
- `user-library-modify` - Modify user's saved tracks
- `playlist-read-private` - Read user's private playlists
- `playlist-read-collaborative` - Read collaborative playlists
- `playlist-modify-private` - Modify private playlists
- `playlist-modify-public` - Modify public playlists
- `user-follow-read` - Read user's followed artists
- `user-follow-modify` - Modify user's followed artists

## Backend Architecture

### Services
- **SpotifyService** (`server/services/spotifyService.ts`): Core Spotify API client
- **AuthService** (`server/middleware/auth.ts`): Session and authentication management

### Routes
- **Auth Routes** (`server/routes/auth.ts`): OAuth flow and user authentication
- **Spotify Routes** (`server/routes/spotify.ts`): Music API endpoints

### Key Endpoints

#### Authentication
- `GET /api/auth/spotify/url` - Get Spotify authorization URL
- `GET /api/auth/spotify/callback` - Handle OAuth callback
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/user` - Get current user profile
- `POST /api/auth/logout` - Logout user

#### Music API (Public - work without auth using client credentials)
- `GET /api/spotify/search` - Search tracks, albums, artists, playlists
- `GET /api/spotify/track/:id` - Get track details
- `GET /api/spotify/album/:id` - Get album details
- `GET /api/spotify/artist/:id` - Get artist details
- `GET /api/spotify/featured-playlists` - Get featured playlists
- `GET /api/spotify/new-releases` - Get new releases
- `GET /api/spotify/recommendations` - Get recommendations

#### User-Specific API (Require authentication)
- `GET /api/spotify/me/playlists` - Get user's playlists
- `GET /api/spotify/me/tracks` - Get user's saved tracks
- `GET /api/spotify/me/top/tracks` - Get user's top tracks
- `GET /api/spotify/me/top/artists` - Get user's top artists
- `GET /api/spotify/me/player/recently-played` - Get recently played
- `PUT /api/spotify/me/tracks` - Save tracks to library
- `DELETE /api/spotify/me/tracks` - Remove tracks from library

## Frontend Integration

### Client Service
The `ClientSpotifyService` (`client/services/spotifyService.ts`) provides a clean interface for making API calls from the frontend.

### Authentication Flow
1. User clicks "Login with Spotify"
2. Frontend gets authorization URL from backend
3. User is redirected to Spotify
4. Spotify redirects back to `/callback`
5. `SpotifyCallback` component handles the response
6. Session token is stored and user is authenticated

### Usage Examples

```typescript
import spotifyService from '../services/spotifyService';

// Search for music
const results = await spotifyService.search('Taylor Swift', 'artist,track');

// Get user's playlists
const playlists = await spotifyService.getUserPlaylists();

// Get track details
const track = await spotifyService.getTrack('trackId');

// Save track to library
await spotifyService.saveTracks(['trackId']);
```

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   Update `.env` with your Spotify credentials

3. **Start Development Servers**
   ```bash
   # Start both client and server
   npm run dev
   ```

4. **Test Authentication**
   - Navigate to `http://localhost:8080/login`
   - Click "Login with Spotify"
   - Complete OAuth flow
   - You should be redirected back and logged in

## Production Deployment

### Environment Variables
Ensure these are set in your production environment:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI` (update with production URL)
- `JWT_SECRET`
- `SESSION_SECRET`
- `NODE_ENV=production`

### Spotify App Configuration
- Add production redirect URI to Spotify app settings
- Update CORS settings if needed

## Security Considerations

1. **Never expose Client Secret**: Keep it on the server only
2. **Use HTTPS in production**: Required for OAuth
3. **Secure session storage**: Consider Redis for production session storage
4. **Token refresh**: Implement automatic token refresh
5. **Rate limiting**: Implement rate limiting for API endpoints

## Common Issues & Solutions

### 1. "Invalid redirect URI"
- Ensure redirect URI in Spotify app matches exactly
- Check for trailing slashes or typos

### 2. "Invalid client"
- Verify Client ID and Client Secret
- Ensure credentials are correctly set in environment variables

### 3. "Token expired"
- Implement token refresh logic
- Handle 401 errors gracefully

### 4. "Scope not granted"
- Check if all required scopes are requested
- User may need to re-authorize with new scopes

## API Rate Limits

Spotify enforces rate limits:
- **Standard rate limit**: Varies by endpoint
- **User rate limit**: Varies by user
- Implement exponential backoff for rate limit errors
- Cache frequently accessed data

## Features Implemented

### Core Features
- ✅ Spotify OAuth authentication
- ✅ User profile management
- ✅ Music search and discovery
- ✅ Track, album, and artist details
- ✅ User playlists management
- ✅ Saved tracks (user library)
- ✅ Recently played tracks
- ✅ Top tracks and artists
- ✅ Music recommendations
- ✅ Browse featured content
- ✅ New releases
- ✅ Music categories

### Advanced Features
- ✅ Session management with automatic cleanup
- ✅ Token refresh handling
- ✅ Error handling and recovery
- ✅ Type-safe API interfaces
- ✅ Client-side service layer
- ✅ Responsive authentication flow

## Next Steps

1. **Set up your Spotify Developer App**
2. **Update environment variables**
3. **Test the authentication flow**
4. **Customize the UI components to match your design**
5. **Add additional features like playlist creation/modification**
6. **Implement music playback (requires Spotify Premium)**

## Support

For issues with:
- **Spotify API**: Check [Spotify Developer Documentation](https://developer.spotify.com/documentation/)
- **OAuth Flow**: Review [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization/)
- **API Endpoints**: See [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api/reference/)

The backend is fully configured and ready to use. Just add your Spotify credentials and you'll have a fully functional music streaming backend!
