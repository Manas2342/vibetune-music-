import { RequestHandler } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { librarySyncService } from '../services/librarySyncService';
import { databaseService } from '../services/databaseService';

// Start library synchronization
export const syncLibrary: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.user.spotifyAccessToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    const accessToken = req.user.spotifyAccessToken;
    const options = req.body;

    // Start sync in background
    librarySyncService.syncUserLibrary(userId, accessToken, options)
      .catch(error => {
        console.error('Background sync error:', error);
      });

    res.json({ 
      message: 'Library synchronization started',
      userId: userId
    });
  } catch (error) {
    console.error('Sync library error:', error);
    res.status(500).json({ error: 'Failed to start library synchronization' });
  }
};

// Get sync progress
export const getSyncProgress: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const progress = librarySyncService.getSyncProgress(req.user.id);
    
    res.json({ 
      progress: progress || { 
        stage: 'idle', 
        progress: 0, 
        total: 0, 
        message: 'No synchronization in progress' 
      }
    });
  } catch (error) {
    console.error('Get sync progress error:', error);
    res.status(500).json({ error: 'Failed to get sync progress' });
  }
};

// Get user library
export const getUserLibrary: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { type } = req.query;
    const library = await librarySyncService.getUserLibrary(
      req.user.id, 
      type as string
    );

    res.json({ library });
  } catch (error) {
    console.error('Get user library error:', error);
    res.status(500).json({ error: 'Failed to get user library' });
  }
};

// Get library statistics
export const getLibraryStats: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await librarySyncService.getLibraryStats(req.user.id);

    res.json({ stats });
  } catch (error) {
    console.error('Get library stats error:', error);
    res.status(500).json({ error: 'Failed to get library statistics' });
  }
};

// Resync specific playlist
export const resyncPlaylist: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user || !req.user.spotifyAccessToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { playlistId } = req.params;
    
    await librarySyncService.resyncPlaylist(
      req.user.id,
      playlistId,
      req.user.spotifyAccessToken
    );

    res.json({ 
      message: 'Playlist resynced successfully',
      playlistId: playlistId
    });
  } catch (error) {
    console.error('Resync playlist error:', error);
    res.status(500).json({ error: 'Failed to resync playlist' });
  }
};

// Record track playback for analytics
export const recordPlayback: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { trackData, durationMs, completed } = req.body;

    await databaseService.recordPlayback(
      req.user.id,
      trackData,
      durationMs,
      completed
    );

    // Record activity for social feed
    await databaseService.recordActivity(req.user.id, 'play', {
      trackId: trackData.id,
      trackName: trackData.name,
      artistName: trackData.artists?.[0]?.name,
      albumName: trackData.album?.name
    });

    res.json({ message: 'Playback recorded successfully' });
  } catch (error) {
    console.error('Record playback error:', error);
    res.status(500).json({ error: 'Failed to record playback' });
  }
};

// Get listening analytics
export const getListeningStats: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { timeframe } = req.query;
    const stats = await databaseService.getListeningStats(
      req.user.id,
      timeframe as 'week' | 'month' | 'year'
    );

    res.json({ stats });
  } catch (error) {
    console.error('Get listening stats error:', error);
    res.status(500).json({ error: 'Failed to get listening statistics' });
  }
};

// Follow user
export const followUser: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;
    
    await databaseService.followUser(req.user.id, userId);

    // Record activity
    await databaseService.recordActivity(req.user.id, 'follow', {
      followedUserId: userId
    });

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

// Unfollow user
export const unfollowUser: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;
    
    await databaseService.unfollowUser(req.user.id, userId);

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

// Get user following list
export const getUserFollowing: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const following = await databaseService.getUserFollowing(req.user.id);

    res.json({ following });
  } catch (error) {
    console.error('Get user following error:', error);
    res.status(500).json({ error: 'Failed to get following list' });
  }
};

// Get user followers list
export const getUserFollowers: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const followers = await databaseService.getUserFollowers(req.user.id);

    res.json({ followers });
  } catch (error) {
    console.error('Get user followers error:', error);
    res.status(500).json({ error: 'Failed to get followers list' });
  }
};

// Get activity feed
export const getActivityFeed: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { limit } = req.query;
    const activities = await databaseService.getActivityFeed(
      req.user.id,
      limit ? parseInt(limit as string) : 50
    );

    res.json({ activities });
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Failed to get activity feed' });
  }
};

// Like track
export const likeTrack: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { trackData } = req.body;

    // Record activity
    await databaseService.recordActivity(req.user.id, 'like', {
      trackId: trackData.id,
      trackName: trackData.name,
      artistName: trackData.artists?.[0]?.name,
      albumName: trackData.album?.name
    });

    res.json({ message: 'Track liked successfully' });
  } catch (error) {
    console.error('Like track error:', error);
    res.status(500).json({ error: 'Failed to like track' });
  }
};

// Share track
export const shareTrack: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { trackData, message } = req.body;

    // Record activity
    await databaseService.recordActivity(req.user.id, 'share', {
      trackId: trackData.id,
      trackName: trackData.name,
      artistName: trackData.artists?.[0]?.name,
      albumName: trackData.album?.name,
      shareMessage: message
    });

    res.json({ message: 'Track shared successfully' });
  } catch (error) {
    console.error('Share track error:', error);
    res.status(500).json({ error: 'Failed to share track' });
  }
};