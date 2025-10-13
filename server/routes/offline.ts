import { RequestHandler } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { offlineMusicService } from '../services/offlineMusicService';
import fs from 'fs';
import path from 'path';

// Download track for offline use
export const downloadTrack: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { trackId, trackName, artistName, quality, format } = req.body;

    if (!trackId || !trackName || !artistName) {
      return res.status(400).json({ error: 'Missing required fields: trackId, trackName, artistName' });
    }

    // Start download in background
    offlineMusicService.downloadTrack(
      req.user.id,
      trackId,
      trackName,
      artistName,
      { quality: quality || 'high', format: format || 'mp3' }
    ).catch(error => {
      console.error('Background download error:', error);
    });

    res.json({ 
      message: 'Download started',
      trackId,
      userId: req.user.id
    });
  } catch (error) {
    console.error('Download track error:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
};

// Get download progress
export const getDownloadProgress: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { trackId } = req.params;
    const progress = offlineMusicService.getDownloadProgress(req.user.id, trackId);

    res.json({ progress });
  } catch (error) {
    console.error('Get download progress error:', error);
    res.status(500).json({ error: 'Failed to get download progress' });
  }
};

// Get all user downloads
export const getUserDownloads: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const downloads = offlineMusicService.getUserDownloads(req.user.id);

    res.json({ downloads });
  } catch (error) {
    console.error('Get user downloads error:', error);
    res.status(500).json({ error: 'Failed to get user downloads' });
  }
};

// Serve offline track
export const serveOfflineTrack: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { trackId } = req.params;
    const filePath = await offlineMusicService.getOfflineTrack(req.user.id, trackId);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Offline track not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const range = req.headers.range;

    // Support range requests for audio streaming
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;

      const file = fs.createReadStream(filePath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': stats.size,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
      };

      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Serve offline track error:', error);
    res.status(500).json({ error: 'Failed to serve offline track' });
  }
};

// Check if track is available offline
export const checkOfflineStatus: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { trackId } = req.params;
    const filePath = await offlineMusicService.getOfflineTrack(req.user.id, trackId);
    const isOffline = filePath && fs.existsSync(filePath);

    let fileSize = 0;
    if (isOffline && filePath) {
      const stats = fs.statSync(filePath);
      fileSize = stats.size;
    }

    res.json({ 
      isOffline,
      filePath: isOffline ? filePath : null,
      fileSize: fileSize,
      fileSizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100
    });
  } catch (error) {
    console.error('Check offline status error:', error);
    res.status(500).json({ error: 'Failed to check offline status' });
  }
};

// Delete offline track
export const deleteOfflineTrack: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { trackId } = req.params;
    const success = await offlineMusicService.deleteOfflineTrack(req.user.id, trackId);

    if (success) {
      res.json({ message: 'Offline track deleted successfully' });
    } else {
      res.status(404).json({ error: 'Offline track not found or could not be deleted' });
    }
  } catch (error) {
    console.error('Delete offline track error:', error);
    res.status(500).json({ error: 'Failed to delete offline track' });
  }
};

// Get offline storage statistics
export const getOfflineStats: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await offlineMusicService.getStorageStats(req.user.id);

    res.json({ stats });
  } catch (error) {
    console.error('Get offline stats error:', error);
    res.status(500).json({ error: 'Failed to get offline statistics' });
  }
};

// Clean up offline storage
export const cleanupOfflineStorage: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { targetUsage } = req.body;
    await offlineMusicService.cleanupStorage(targetUsage || 80);

    res.json({ message: 'Storage cleanup completed' });
  } catch (error) {
    console.error('Cleanup offline storage error:', error);
    res.status(500).json({ error: 'Failed to cleanup offline storage' });
  }
};

// Get offline tracks list
export const getOfflineTracks: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { databaseService } = await import('../services/databaseService');
    const libraryItems = await databaseService.getUserLibrary(req.user.id, 'track');
    
    const offlineTracks = libraryItems
      .filter(item => item.isOffline && item.downloadPath)
      .map(item => {
        const trackData = JSON.parse(item.data);
        return {
          ...item,
          trackData,
          isAvailable: fs.existsSync(item.downloadPath!)
        };
      });

    res.json({ offlineTracks });
  } catch (error) {
    console.error('Get offline tracks error:', error);
    res.status(500).json({ error: 'Failed to get offline tracks' });
  }
};

// Batch download tracks
export const batchDownload: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { tracks, options } = req.body;

    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: 'Invalid tracks array' });
    }

    // Start batch downloads
    const downloadPromises = tracks.map(track => 
      offlineMusicService.downloadTrack(
        req.user!.id,
        track.trackId,
        track.trackName,
        track.artistName,
        options || { quality: 'high', format: 'mp3' }
      ).catch(error => {
        console.error(`Error downloading track ${track.trackId}:`, error);
        return null;
      })
    );

    // Start all downloads without waiting
    Promise.all(downloadPromises).then(results => {
      console.log(`Batch download completed for user ${req.user!.id}: ${results.filter(r => r).length}/${tracks.length} successful`);
    });

    res.json({ 
      message: `Started downloading ${tracks.length} tracks`,
      trackCount: tracks.length
    });
  } catch (error) {
    console.error('Batch download error:', error);
    res.status(500).json({ error: 'Failed to start batch download' });
  }
};

// Get offline track metadata
export const getOfflineTrackMetadata: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { trackId } = req.params;
    const { databaseService } = await import('../services/databaseService');
    const libraryItems = await databaseService.getUserLibrary(req.user.id, 'track');
    
    const track = libraryItems.find(item => 
      item.spotifyId === trackId && item.isOffline && item.downloadPath
    );

    if (!track || !fs.existsSync(track.downloadPath!)) {
      return res.status(404).json({ error: 'Offline track not found' });
    }

    const stats = fs.statSync(track.downloadPath!);
    const trackData = JSON.parse(track.data);

    res.json({
      metadata: {
        trackId: track.spotifyId,
        name: track.name,
        filePath: track.downloadPath,
        fileSize: stats.size,
        fileSizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100,
        downloadedAt: track.syncedAt,
        lastAccessed: stats.atime,
        trackData: trackData
      }
    });
  } catch (error) {
    console.error('Get offline track metadata error:', error);
    res.status(500).json({ error: 'Failed to get offline track metadata' });
  }
};