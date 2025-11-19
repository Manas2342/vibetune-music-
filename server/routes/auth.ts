import { RequestHandler } from 'express';
import { authService } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import spotifyService from '../services/spotifyService';

// Mock users data (simulating Spotify connection)
const mockUsers = [
  {
    id: 'spotify_music_lover_1',
    displayName: 'Music Lover',
    email: 'musiclover@vibetune.com',
    country: 'US',
    followers: 1250,
    images: [{
      url: 'https://i.pravatar.cc/300?img=1',
      height: 300,
      width: 300
    }],
    product: 'premium'
  },
  {
    id: 'spotify_audiophile_2',
    displayName: 'Audio Enthusiast',
    email: 'audiophile@vibetune.com',
    country: 'CA',
    followers: 892,
    images: [{
      url: 'https://i.pravatar.cc/300?img=2',
      height: 300,
      width: 300
    }],
    product: 'premium'
  }
];

// Get real Spotify authorization URL
export const getSpotifyAuthUrl: RequestHandler = (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const authUrl = spotifyService.generateAuthUrl(state);
    res.json({ authUrl, state });
  } catch (error) {
    console.error('Error generating Spotify auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
};

// Handle real Spotify OAuth callback
export const handleSpotifyCallback: RequestHandler = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('Spotify OAuth error:', error);
      // Check if client wants JSON response
      const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
      if (wantsJson) {
        return res.status(400).json({ 
          error: 'spotify_auth_denied',
          message: `Spotify authorization failed: ${error}` 
        });
      }
      return res.redirect('/?error=spotify_auth_denied');
    }
    
    if (!code) {
      // Check if client wants JSON response
      const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
      if (wantsJson) {
        return res.status(400).json({ 
          error: 'no_auth_code',
          message: 'No authorization code received from Spotify' 
        });
      }
      return res.redirect('/?error=no_auth_code');
    }
    
    console.log('🎵 Spotify callback received, exchanging code for token...');
    
    // Exchange code for tokens
    const tokenResponse = await spotifyService.exchangeCodeForToken(code as string);
    console.log('🎵 Token exchange successful');

    // Get user profile
    const userProfile = await spotifyService.getCurrentUser(tokenResponse.access_token);
    console.log('🎵 User profile retrieved:', userProfile.display_name);

    // Create session
    const sessionId = authService.createSession(
      tokenResponse.access_token,
      tokenResponse.refresh_token || '',
      tokenResponse.expires_in
    );
    console.log('🎵 Session created:', sessionId);

    // Check if client wants JSON response (from fetch/XHR calls)
    const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
    
    // For API calls from client (fetch requests), always return JSON
    if (wantsJson) {
      return res.json({
        sessionToken: sessionId,
        user: userProfile,
        connected: 'spotify',
        // Expose raw tokens in dev only to allow Web Playback SDK on client
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in
      });
    }

    // Fallback redirect (shouldn't normally be used)
    const redirectUrl = `/?sessionToken=${sessionId}&connected=spotify`;
    res.redirect(redirectUrl);
    
  } catch (error: any) {
    console.error('❌ Error handling Spotify callback:', error);
    const errorMessage = error.response?.data?.error_description || error.message || 'Unknown error';
    
    // Check if client wants JSON response
    const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
    if (wantsJson) {
      return res.status(500).json({ 
        error: 'spotify_connection_failed',
        message: errorMessage 
      });
    }
    res.redirect(`/?error=spotify_connection_failed&message=${encodeURIComponent(errorMessage)}`);
  }
};


// Refresh access token (mock)
export const refreshSpotifyToken: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.user.spotifyRefreshToken) {
      return res.status(400).json({ error: 'No refresh token available' });
    }

    // Use real Spotify refresh flow
    const newTokens = await spotifyService.refreshToken(req.user.spotifyRefreshToken);

    // Update session with new tokens
    const updated = authService.updateSession(
      req.user.id,
      newTokens.access_token,
      newTokens.refresh_token || req.user.spotifyRefreshToken,
      newTokens.expires_in
    );

    if (!updated) {
      return res.status(400).json({ error: 'Failed to update session' });
    }

    res.json({
      accessToken: newTokens.access_token,
      expiresIn: newTokens.expires_in,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

// Get current user profile from Spotify
export const getCurrentUser: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.user.spotifyAccessToken) {
      return res.status(401).json({ error: 'Not authenticated with Spotify' });
    }

    try {
      const userProfile = await spotifyService.getCurrentUser(req.user.spotifyAccessToken);
      res.json({ user: userProfile });
    } catch (spotifyError) {
      // If token is expired, try to refresh
      if (req.user.spotifyRefreshToken) {
        try {
          const newTokens = await spotifyService.refreshToken(req.user.spotifyRefreshToken);
          authService.updateSession(
            req.user.id,
            newTokens.access_token,
            newTokens.refresh_token || req.user.spotifyRefreshToken,
            newTokens.expires_in
          );
          
          const userProfile = await spotifyService.getCurrentUser(newTokens.access_token);
          res.json({ user: userProfile });
        } catch (refreshError) {
          return res.status(401).json({ error: 'Authentication expired. Please reconnect to Spotify.' });
        }
      } else {
        return res.status(401).json({ error: 'Authentication expired. Please reconnect to Spotify.' });
      }
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Logout user
export const logout: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user) {
      authService.deleteSession(req.user.id);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};
